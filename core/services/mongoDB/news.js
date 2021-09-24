const mongoose = require ("mongoose");

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
  collections = {
    'news': null
  }

  constructor(db) {
    this.db = db;
    this.collections = {
      'news': this.db.collection('news'),
    }
  }

  async saveOne(article) {
    try {
      const newArticle = new NewsArticleModel(article);
      const saved = await newArticle.save();
      return saved
    } catch (e) {
      console.log('saveOneToDB() error:', e);
      return false
    }
  }

  async findArticle(title, url, category) {
    try {
      const query = NewsArticleModel.where({
        title,
        url,
        category
      });
      const found = await query.findOne(query).exec();
      return !!found
    } catch (e) {
      console.log('findIfArticleExists() error:', e);
      return false
    }
  }
}

module.exports = {
  NewsService,
  CATEGORIES,
  CATEGORY_VALUES
}
