const router = require('express').Router();
const cors = require('cors');
const corsOptions = {
	origin: '*',
	maxAge: 31536000,
	methods: 'GET'
};
const Joi = require('joi');

const NewsCategory = {
	HEADLINE: `headline`,
	BUSINESS: `business`,
	ENTERTAINMENT: `entertainment`,
	HEALTH: `health`,
	SCIENCE: `science`,
	SPORTS: `sports`,
	TECHNOLOGY: `technology`
}
const newsCategories = Object.values(NewsCategory);

const schema = Joi.object({
	keyword: Joi.string()
		.min(1)
		.max(200),
	startDate: Joi.date().less(Joi.ref('endDate')),
	endDate: Joi.date(),
	category: Joi.string().default('all').allow('all', ...newsCategories),
	sortOrder: Joi.string().default('desc').allow('desc', 'asc'),
	sortBy: Joi.string().default('relevance').allow('relevance', 'date'),
	page: Joi.number().integer().min(1).default(1)
})

class DateParsingError extends Error {}
class ValidationError extends Error {}

const parseDate = (string, defaultValue) => {
	try {
		let date;
		if (!string) {
			date = defaultValue;
		}
		// 2022-09-02 -> UTC Date object
		const array = string.split('-');
		date = new Date(Date.UTC(array[0], array[1], array[2]));
		return date.toISOString();
	} catch (e) {
		throw new DateParsingError()
	}
}

const getNextDay = (UTCString) => {
	const ms = new Date(UTCString).valueOf();
	const nextDayMs = ms + 1000 * 60 * 60 * 24;
	const date = new Date(nextDayMs);
	const baseDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	return baseDate.toISOString();
}

router.get('/', cors(corsOptions), async (req, res) => {
	try {
		const startDate = await parseDate(req.query.startDate, new Date(Date.UTC(2020, 0, 1)));
		const endDateExclusive = await parseDate(req.query.endDate, new Date());
		const endDate = getNextDay(endDateExclusive);
		const {
			keyword,
			category,
			sortBy,
			sortOrder,
			page
		} = req.query;
		const itemsPerPage = 20;

		const validationResult = schema.validate({
			keyword,
			startDate,
			endDate,
			category,
			sortBy,
			sortOrder,
			page
		})
		if (validationResult.error) {
			throw new ValidationError(validationResult.error.details[0].message)
		}
		console.log(validationResult.value);
		const {
			docs,
			total
		} = await req.services.elasticsearchService.newsService.searchNews({
			keyword: validationResult.value.keyword,
			startDateUTCString: validationResult.value.startDate,
			endDateUTCString: validationResult.value.endDate,
			page: validationResult.value.page,
			category: validationResult.value.category,
			sortBy: validationResult.value.sortBy,
			sortOrder: validationResult.value.sortOrder,
			itemsPerPage
		});
		if (!docs) {
			throw new Error()
		}
		res.json({
			status: 'ok',
			docs,
			total,
			hasNext: docs.length === itemsPerPage
		})
	} catch (e) {
		let errorMessage = 'Server Error';
		if (e instanceof DateParsingError) {
			errorMessage = 'Failed to parse date, required format: yyyy-mm-dd'
		} else if (e instanceof ValidationError) {
			errorMessage = e.message
		}

		res.json({
			status: 'error',
			message: errorMessage
		})
	}
})

module.exports = router

