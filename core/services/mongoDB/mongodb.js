const mongoose = require('mongoose');
const NewsService = require('./news').NewsService;

class MongoDBService {
  db = null;
  newsService = null;

  async connect() {
    const isConnected = await this._connect();
    if (!isConnected) {
      await new Promise(r => setTimeout(r, 5000));
      await this.connect();
    }
  }

  _connect() {
    return new Promise((resolve) => {
      mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        "auth": { "authSource": "admin" },
        "user": process.env.MONGODB_USER,
        "pass": process.env.MONGODB_PASS,
      })

      this.db = mongoose.connection;
      this.db.on('error', (err) => {
        console.log('main db mongoose connection error', err);
        resolve(null);
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

const mongoDBService = new MongoDBService();

module.exports = mongoDBService
