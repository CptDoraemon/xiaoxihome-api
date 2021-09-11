const { Client } = require('@elastic/elasticsearch');
const NewsService = require('./news');

class Elasticsearch {
	client;
	newsService;

	constructor() {
		this.client = new Client({
			node: 'http://localhost:9200',
			auth: {
				username: process.env.ELASTICSEARCH_USERNAME,
				password: process.env.ELASTICSEARCH_PASSWORD,
			}
		});

		this.newsService = new NewsService(this.client);
	}
}

module.exports = Elasticsearch
