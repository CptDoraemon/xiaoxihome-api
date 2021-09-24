const newsAnalytics = require('./news-analytics');

const getOutNewsDoc = (doc) => {
	return {
		id: doc.mongoId,
		source: doc.source,
		author: doc.author,
		title:  doc.title,
		description:  doc.description,
		url:  doc.url,
		urlToImage:  doc.urlToImage,
		publishedAt:  doc.publishedAt,
		content:  doc.content,
	}
}

class NewsService {
	indices = {
		'NEWS': 'news',
		'SEARCHED_KEYWORDS': 'searched-keywords'
	};
	client;
	newsAnalytics;

	constructor(client) {
		this.client = client;
		this.newsAnalytics = new newsAnalytics(this.indices, this.client);
	}

	async searchNews({keyword, startDateUTCString, endDateUTCString, page, itemsPerPage, category, sortBy, sortOrder}) {
		try {
			const sortByRelevance = {"_score": sortOrder};
			const sortByDate = {"publishedAt": sortOrder};
			console.log('start ', startDateUTCString);
			console.log('end ', endDateUTCString);

			const res = await this.client.search({
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
											"gte": `${startDateUTCString}||/d`,
											"lte": `${endDateUTCString}||/d`,
											"format": "strict_date_optional_time"
										}
									}
								},
								...category !== 'all' ? [{"term":  { "category": category }}] : []
							]
						}
					},
					"sort": sortBy === 'relevance' ? [sortByRelevance, sortByDate] : [sortByDate, sortByRelevance],
					"aggs": {
						"histogram": {
							"auto_date_histogram": {
								"field": "publishedAt",
								"buckets": 100,
								"format": "yyyy-MM-dd",
								"minimum_interval": "day"
							}
						}
					}
				}
			})
			return {
				docs: res.body.hits.hits.map(obj => {
					return getOutNewsDoc(obj._source)
				}),
				histogram: res.body.aggregations.histogram.buckets,
				total: res.body.hits.total.value
			};
		} catch (e) {
			console.log(e);
			return null
		}
	}

	async saveSearchedKeyword(keyword) {
		try {
			await this.client.index({
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
			const res = await this.client.search({
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
			return res.body.aggregations.count.buckets;
		} catch (e) {
			console.log('getAllTimeTrendingSearchedKeywords', e);
			return null
		}
	}

	async getLatestNewsInCategory(category) {
		try {
			const res = await this.client.search({
				index: this.indices.NEWS,
				size: 50,
				body: {
					"query": {
						"bool": {
							"filter": [
								{"term":
									{ "category": category }
								}
							]
						}
					},
					"sort": [{"publishedAt": 'desc'}]
				}
			})
			return res.body.hits.hits.map(obj => {
				return getOutNewsDoc(obj._source)
			})
		} catch (e) {
			console.log('getLatestNewsInCategory', e)
			return null
		}
	}

	async getNewsById(id) {
		try {
			const res = await this.client.search({
				index: this.indices.NEWS,
				size: 1,
				body: {
					"query": {
						"term": {
							"mongoId": id
						}
					}
				}
			})
			return res.body.hits.hits.map(obj => {
				return getOutNewsDoc(obj._source)
			})
		} catch (e) {
			console.log('getLatestNewsInCategory', e)
			return null
		}
	}

	async saveMongoDocsToEs(docs) {
		console.log(docs);
		try {
			const body = docs.flatMap(doc => [
				{
					index: {
						_index: this.indices.NEWS
					}
				},
				{
					mongoId: doc._id,
					source: doc.source.name,
					author: doc.author,
					title: doc.title,
					description: doc.description,
					publishedAt: doc.publishedAt,
					content: doc.content,
					category: doc.category,
					url: doc.url,
					urlToImage: doc.urlToImage
				}
			])
			await this.client.bulk({
				refresh: true,
				body
			})
			return true
		} catch (e) {
			console.log(e);
			return false
		}
	}
}

module.exports = NewsService
