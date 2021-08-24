const mongoose = require('mongoose');
const NewsService = require('./news');

class MongoDBService {
  db = null;
  newsService = null;

  connect() {
    return new Promise((resolve, reject) => {
      mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })

      this.db = mongoose.connection;
      this.db.on('error', (err) => {
        console.log('main db mongoose connection error', err);
        reject(err);
      });
      this.db.once('open', () => {
        console.log('connected to mongoDB')
        this.finishSetUp();
        resolve(this.db);
      })
    })
  }

  finishSetUp() {
    this.newsService = new NewsService(this.db)
  }
}

module.exports = MongoDBService
