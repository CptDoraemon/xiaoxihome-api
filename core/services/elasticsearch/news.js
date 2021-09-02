const cloneDeep = require('lodash/cloneDeep');

class NewsService {
	indexName = 'news';
	elasticsearch;

	constructor(elasticsearch) {
		this.elasticsearch = elasticsearch;
	}

	async searchNews({keyword, startDateUTCString, endDateUTCString, page, itemsPerPage}) {
		try {
			const res = await this.elasticsearch.client.search({
				index: this.indexName,
				from: (page - 1) * itemsPerPage,
				size: itemsPerPage,
				body: {
					"track_total_hits": true,
					"query": {
						"bool": {
							"must": [
								{
									"multi_match": {
										"query": keyword,
										"fields": [
											"title",
											"description",
											"category"
										]
									}
								}
							],
							"filter": [
								{
									"range": {
										"publishedAt": {
											"gte": startDateUTCString,
											"lte": endDateUTCString
										}
									}
								}
							]
						}
					}
				}
			})
			return {
				docs: res.body.hits.hits.map(obj => {
					const doc = cloneDeep(obj._source);
					doc.id = obj._id;
					return doc
				}),
				total: res.body.hits.total.value
			};
		} catch (e) {
			console.log(e);
			return null
		}
	}
}

module.exports = NewsService
