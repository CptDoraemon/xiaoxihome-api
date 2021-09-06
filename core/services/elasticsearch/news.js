const cloneDeep = require('lodash/cloneDeep');

class NewsService {
	indices = {
		'NEWS': 'news',
		'SEARCHED_KEYWORDS': 'searched-keywords'
	};
	elasticsearch;

	constructor(elasticsearch) {
		this.elasticsearch = elasticsearch;
	}

	async searchNews({keyword, startDateUTCString, endDateUTCString, page, itemsPerPage, category, sortBy, sortOrder}) {
		try {
			const sortByRelevance = {"_score": sortOrder};
			const sortByDate = {"publishedAt": sortOrder};

			const promise = this.elasticsearch.client.search({
				index: this.indices.NEWS,
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
								},
								...category !== 'all' ? [{"term":  { "category": category }}] : []
							]
						}
					},
					"sort": sortBy === 'relevance' ? [sortByRelevance, sortByDate] : [sortByDate, sortByRelevance]
				}
			})
			const res = await promise;
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

	async saveSearchedKeyword(keyword) {
		try {
			await this.elasticsearch.client.index({
				index: this.indices.SEARCHED_KEYWORDS,
				body: {
					keyword,
					timestamp: Date.now()
				}
			})
		} catch (e) {
			console.log('saveSearchedKeyword', e)
		}
	}

	/**
	 * @param {'ALL_TIME' | 'LAST_WEEK'} range
	 */
	async getTrendingSearchedKeywords(range) {
		try {
			const query = this.elasticsearch.client.search({
				index: this.indices.SEARCHED_KEYWORDS,
				body: {
					"size": 0,
					...range === 'LAST_WEEK' ? {
						"query": {
							"range": {
								"timestamp": {
									"gte": "now-1w/d",
									"lte": "now/d"
								}
							}
						},
					} : {},
					"aggs": {
						"count": {
							"terms": {
								"field": "keyword",
								"size": 5,
								"order": {"_count": "desc"}
							}
						}
					}
				}
			})
			const data = await query;
			console.log(data)
			return data.body.aggregations.count.buckets;
		} catch (e) {
			console.log('getAllTimeTrendingSearchedKeywords', e);
			return null
		}
	}
}

module.exports = NewsService
