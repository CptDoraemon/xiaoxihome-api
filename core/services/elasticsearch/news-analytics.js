class NewsAnalytics {
  indices;
  client;

  constructor(indices, client) {
    this.indices = indices;
    this.client = client
  }

  async getSummary() {
    try {
      const getFirstDocByDate = (order) => this.client.search({
        "size": 1,
        "sort": [
          {
            "publishedAt": {
              "order": order
            }
          }
        ],
        "_source": false,
        "fields": [
          "publishedAt"
        ]
      });
      const totalCountRes = await this.client.search({
        index: this.indices.NEWS,
        size: 0,
        body: {}
      });
      const firstDocDateRes = await getFirstDocByDate('asc');
      const lastDocDateRes = await getFirstDocByDate('desc');

      const totalCount = totalCountRes.body.hits.total.value;
      const firstDocDate = firstDocDateRes.body.hits.hits[0].fields.publishedAt[0];
      const lastDocDate = lastDocDateRes.body.hits.hits[0].fields.publishedAt[0];

      return {
        totalCount,
        firstDocDate,
        lastDocDate
      }
    } catch (e) {
      console.log('getSummary', e);
      return null
    }
  }
}

module.exports = NewsAnalytics
