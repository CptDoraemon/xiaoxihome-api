require('dotenv').config();
const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  }
});

const connectToMongo = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      "auth": { "authSource": "admin" },
      "user": process.env.MONGODB_USER,
      "pass": process.env.MONGODB_PASS,
    })

    const db = mongoose.connection;
    db.on('error', (err) => {
      console.log('main db mongoose connection error', err);
      reject(err);
    });
    db.once('open', () => {
      console.log('connected to mongoDB')
      resolve(db);
    })
  })
}

module.exports = {
  client,
  connectToMongo
}
