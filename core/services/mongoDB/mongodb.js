import mongoose from "mongoose";

class MongoDBService {
  db = null;
  newsService = null;

  connect() {
    return new Promise((resolve, reject) => {
      mongoose.connect('mongodb://localhost:27017', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })

      this.db = mongoose.connection;
      this.db.on('error', (err) => {
        console.log('main db mongoose connection error', err);
        reject(err);
      });
      this.db.once('open', () => {
        this.finishSetUp();
        resolve(this.db);
      })
    })
  }

  finishSetUp() {
    this.newsService = new
  }
}
