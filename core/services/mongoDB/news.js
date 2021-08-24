const axios = require('axios');
const mongoose = require ("mongoose");
const cloneDeep = require('lodash/cloneDeep');

const newsArticleSchema = new mongoose.Schema({
  source: {
    id: String,
    name: String
  },
  author: String,
  title: String,
  description: String,
  url: String,
  urlToImage: String,
  publishedAt: String,
  content: String,
  requestedAt: String,
  category: String
});
const NewsArticleModel = mongoose.model('News', newsArticleSchema);

const CATEGORIES = {
  'headline': 'headline',
  'business': 'business',
  'entertainment': 'entertainment',
  'health': 'health',
  'science': 'science',
  'sports': 'sports',
  'technology': 'technology',
}
const CATEGORY_VALUES = Object.values(CATEGORIES);

class NewsService {
  db = null;
  latestNews = {};
  collections = {
    'lastUpdatedNews': null,
    'news': null
  }

  constructor(db) {
    this.db = db;
    this.collections = {
      'lastUpdatedNews': this.db.collection('lastUpdatedNews'),
      'news': this.db.collection('news'),
    }
  }

  getLastUpdated() {

  }

  async _getNewsInCategory(category) {
    try {
      const res = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: process.env.NEWS_API_KEY,
          country: 'ca',
          ...category !== CATEGORIES.headline && {
            category
          }
        }
      })
      const data = res.data;
      if (body.status !== 'ok') {
        throw new Error()
      }
      return data.articles;
    } catch (e) {
      console.log('_getNewsInCategory() error: ', category, new Date().toISOString(), e)
    }
  }

  async update() {
    try {
      const isColdStart = !Object.keys(this.latestNews).length;
      const delay = isColdStart ? 1000 * 60 * 0 : 0;
      const waitBetweenCategories = 1000 * 60; // 1 minute
      const recurringUpdateFrequency = 1000 * 60 * 60 * 2; // 2 hour

      if (isColdStart) {
        // const lastUpdated = await getNewsCacheFromDB(currentNewsCollection);
        // this.latestNews = lastUpdated;
      }

      // get latest news from newsapi.org
      let i = 0;
      const getNewsInQueue = async () => {
        const isLast = i === CATEGORIES.length - 1;
        const category = CATEGORY_VALUES[i];
        const newsInCategory = await this._getNewsInCategory(category);
        this.latestNews[category] = newsInCategory;
        console.log(`${category} news updated at: `, new Date().toISOString());
        i++;
        if (!isLast) {
          setTimeout(getNewsInQueue, waitBetweenCategories);
        }
        if (isLast) {
          console.log('All news updated at: ', new Date().toISOString());
          setTimeout(() => this.update, recurringUpdateFrequency);
          this._saveToDB();
        }
      };

      setTimeout(getNewsInQueue, delay);
    } catch (e) {
      console.log(e);
    }
  }

  async _saveToDB() {
    try {
      const requestedAt = Date.now();
      const articles = [];
      const keys = Object.keys(this.latestNews);
      keys.forEach(categoryKey => {
        const categoryObj = this.latestNews[categoryKey];
        if (Array.isArray(categoryObj.articles)) {
            categoryObj.articles.forEach(article => {
              const cloned = cloneDeep(article);
              cloned.category = categoryKey;
              articles.push(cloned)
            })
        }
      })

      const nonNullifyArticleObject = (article) => {
        Object.keys(article).forEach((key) => {
          if (key === 'source') {
            if (!article.source.id) article.source.id = '';
            if (!article.source.name) article.source.name = '';
          }
          if (article[key] === null) article[key] = '';
        });
      }

      const findIfArticleExists = async (article) => {
        try {
          const query = NewsArticleModel.where({
            title: article.title,
            url: article.url,
            category: article.category
          });
          const found = await query.findOne(query).exec();
          return !!found
        } catch (e) {
          console.log('findIfArticleExists() error:', e);
          return false
        }
      }

      const saveOneToDB = async (article) => {
        try {
          nonNullifyArticleObject(article);
          const newArticle = new NewsArticleModel({
            ...article,
            requestedAt: requestedAt,
          });
          await newArticle.save()
        } catch (e) {
          console.log('saveOneToDB() error:', e);
        }
      }

      let i = 0;
      const saveOne = async () => {
        if (i >= articles.length) {
          return
        }
        const article = articles[i];
        const existed = findIfArticleExists(article)
        if (!existed) {
          await saveOneToDB(article)
        }
        i++;
        await saveOne()
      }

      await saveOne()
    } catch (e) {
      console.log('_saveToDB() error:', e);
    }
  }
}

module.exports = NewsService
