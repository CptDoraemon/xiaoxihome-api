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
        index: this.indices.NEWS,
        "body": {
          "_source": false,
          "fields": [
            "publishedAt"
          ],
          "sort": [
            {
              "publishedAt": {
                "order": order
              }
            }
          ],
          "size": 1,
        }
      });
      const totalCountRes = await this.client.search({
        index: this.indices.NEWS,
        size: 0,
        body: {
          "track_total_hits": true
        }
      });
      const firstDocDateRes = new Date(Date.UTC(2020, 0, 5)).toISOString();
      const lastDocDateRes = await getFirstDocByDate('desc');

      const totalCount = totalCountRes.body.hits.total.value;
      const firstDocDate = firstDocDateRes;
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

  async getCountByCategory() {
    try {
      const res = await this.client.search({
        index: this.indices.NEWS,
        body: {
          "size": 0,
          "aggs": {
            "countByCategory": {
              "terms": {
                "field": "category",
                "size": 10
              }
            }
          }
        }
      });
      return res.body.aggregations.countByCategory.buckets.map(obj => ({
        category: obj.key,
        count: obj.doc_count
      }));
    } catch (e) {
      console.log('getCountByCategory', e);
      return null
    }
  }
}

module.exports = NewsAnalytics
