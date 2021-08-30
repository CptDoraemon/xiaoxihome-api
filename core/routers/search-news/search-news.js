const router = require('express').Router();
const cors = require('cors');
const corsOptions = {
	origin: '*',
	maxAge: 31536000,
	methods: 'GET'
};
const Joi = require('joi');

router.use(cors(corsOptions));

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
	startDate: Joi.date().max(Joi.ref('endDate')),
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

router.get('/', async (req, res) => {
	try {
		const startDate = await parseDate(req.query.startDate, new Date(Date.UTC(2020, 0, 1)));
		const endDate = await parseDate(req.query.endDate, new Date());
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
		const {
			docs,
			total,
			histogram
		} = await req.services.elasticsearchService.newsService.searchNews({
			keyword: validationResult.value.keyword,
			startDateUTCString: startDate,
			endDateUTCString: endDate,
			page: validationResult.value.page,
			category: validationResult.value.category,
			sortBy: validationResult.value.sortBy,
			sortOrder: validationResult.value.sortOrder,
			itemsPerPage
		});
		if (!docs) {
			throw new Error()
		}

		// save searched keyword, do not wait
		req.services.elasticsearchService.newsService.saveSearchedKeyword(validationResult.value.keyword);

		return res.json({
			status: 'ok',
			docs,
			histogram,
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
});

router.get('/trending', async (req, res) => {
	try {
		const lastWeek = await req.services.elasticsearchService.newsService.getTrendingSearchedKeywords('LAST_WEEK');
		const allTime = await req.services.elasticsearchService.newsService.getTrendingSearchedKeywords('ALL_TIME');

		return res.json({
			status: 'ok',
			lastWeek,
			allTime
		})
	} catch (e) {
		res.json({
			status: 'error',
			message: 'Server Error'
		})
	}
});

router.get('/id', async (req, res) => {
	try {
		const {id} = req.query;
		if (!id || !id.length || id.length > 200) {
			res.json({
				status: 'error',
				message: 'wrong id'
			})
		}

		const doc = await req.services.elasticsearchService.newsService.getNewsById(id);

		return res.json({
			status: 'ok',
			doc
		})
	} catch (e) {
		res.json({
			status: 'error',
			message: 'Server Error'
		})
	}
})

module.exports = router

