const {
  blacklist: wordCloudBlacklist
} = require('./word-cloud-dictionary')

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

  async getDocCountByDay() {
    try {
      const res = await this.client.search({
        index: this.indices.NEWS,
        body: {
          "size": 0,
          "query": {
            "range": {
              "publishedAt": {
                "gte": "now-1y/d",
                "lte": "now/d"
              }
            }
          },
          "aggs": {
            "docCountByDay": {
              "date_histogram": {
                "field": "publishedAt",
                "calendar_interval": "1d"
              }
            }
          }
        }
      });

      const docCountByDay = [];
      const date = [];
      res.body.aggregations.docCountByDay.buckets.forEach(obj => {
        date.push(obj.key);
        docCountByDay.push(obj.doc_count);
      })

      return {
        docCountByDay,
        date
      }
    } catch (e) {
      console.log('getDocCountByDay', e);
      return null
    }
  }

  async getDocCountByDayAndCategory() {
    try {
      const categories = ["headline", "business", "entertainment", "health", "science", "sports", "technology"];
      const res = await this.client.search({
        index: this.indices.NEWS,
        body: {
          "size": 0,
          "query": {
            "range": {
              "publishedAt": {
                "gte": "2020-01-04||/d"
              }
            }
          },
          "aggs": {
            "docCountByDay": {
              "date_histogram": {
                "field": "publishedAt",
                "calendar_interval": "1d"
              },
              "aggs": {
                "byCategory": {
                  "terms": {
                    "field": "category"
                  }
                }
              }
            }
          }
        }
      });

      const docCountByDayAndCategory = [];
      const date = [];
      res.body.aggregations.docCountByDay.buckets.forEach(obj => {
        date.push(obj.key);
        const _docCountByDayAndCategory = new Array(categories.length).fill(0);
        obj.byCategory.buckets.forEach(obj => {
          const index = categories.indexOf(obj.key);
          if (_docCountByDayAndCategory[index] === 0) {
            _docCountByDayAndCategory[index] = obj.doc_count
          }
        });
        docCountByDayAndCategory.push(_docCountByDayAndCategory);
      })

      return {
        docCountByDayAndCategory,
        date,
        categories
      }
    } catch (e) {
      console.log('getDocCountByDayAndCategory', e);
      return null
    }
  }

  async getWordFrequency() {
    try {
      const res = await this.client.search({
        index: this.indices.NEWS,
        body: {
          "size": 0,
          "query": {
            "range": {
              "publishedAt": {
                "gte": "2020-01-01||/d"
              }
            }
          },
          "aggs": {
            "byYear": {
              "date_histogram": {
                "field": "publishedAt",
                "calendar_interval": "1y"
              },
              "aggs": {
                "wordFrequency": {
                  "terms": {
                    "field": "description",
                    "size": 80,
                    "exclude": wordCloudBlacklist
                  }
                }
              }
            }
          }
        }
      });
      const data = [];
      res.body.aggregations.byYear.buckets.map(bucket => {
        const yearBucket = {};
        yearBucket.year = new Date(bucket.key_as_string).getUTCFullYear();
        yearBucket.data = [];
        bucket.wordFrequency.buckets.forEach(obj => {
          yearBucket.data.push({
            word: obj.key,
            count: obj.doc_count
          });
        });
        data.push(yearBucket);
      })
      return data
    } catch (e) {
      console.log('getWordFrequency', e);
      return null
    }
  }
}

module.exports = NewsAnalytics
