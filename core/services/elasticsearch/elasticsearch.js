const { Client } = require('@elastic/elasticsearch');
const NewsService = require('./news');

class Elasticsearch {
	client;
	newsService;

	constructor() {
		this.client = new Client({
			node: `http://${process.env.ELASTICSEARCH_HOST}`,
			auth: {
				username: process.env.ELASTICSEARCH_USERNAME,
				password: process.env.ELASTICSEARCH_PASSWORD,
			}
		});

		this.newsService = new NewsService(this.client);
	}
}

const elasticsearchService = new Elasticsearch();

module.exports = elasticsearchService
