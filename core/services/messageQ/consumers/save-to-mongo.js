const getChannel = require("../channel");
const {getSaveToMongoExchange} = require("../exchanges");
const cloneDeep = require('lodash/cloneDeep');
const mongoService = require('../../mongoDB/mongodb');
const saveToMongoProducer = require('../producers/save-to-mongo');
const saveToEsProducer = require('../producers/save-to-es');

const nonNullifyArticleObject = (article) => {
  Object.keys(article).forEach((key) => {
    if (key === 'source') {
      if (!article.source.id) article.source.id = '';
      if (!article.source.name) article.source.name = '';
    }
    if (article[key] === null) article[key] = '';
  });
}

const handleMessage = async (msg, channel) => {
  try {
    const msgContent = JSON.parse(msg.content.toString());
    const rawArticles = cloneDeep(msgContent);
    rawArticles.forEach(obj => nonNullifyArticleObject(obj));
    const checkExistencePromises = rawArticles.map(obj => mongoService.newsService.findArticle(obj.title, obj.url, obj.category));
    const checkExistenceResult = await Promise.all(checkExistencePromises);
    const savePromises = rawArticles.map((obj, i) => {
      if (checkExistenceResult[i]) {
        return 'existed'
      } else {
        return mongoService.newsService.saveOne(obj)
      }
    });
    const saveResults = await Promise.all(savePromises);

    // push back failed articles
    // push saved to saveToEs producer
    const savedMongoDocs = [];
    const failed = [];
    saveResults.forEach((result, i) => {
      if (result === 'existed') {
        // pass
      } else if (!!result) {
        // returned mongo doc (with _id)
        savedMongoDocs.push(result)
      } else if (result === false) {
        failed.push(result)
      }
    })

    if (failed.length > 0) {
      await saveToMongoProducer(failed);
      console.log(`${failed.length} news failed to save to MongoDB, message requeued`, new Date().toISOString());
    }

    if (savedMongoDocs.length > 0) {
      console.log(`${savedMongoDocs.length} news articles has been saved to MongoDB`, new Date().toISOString());
      await saveToEsProducer(savedMongoDocs);
    }

    channel.ack(msg);
  } catch (e) {
    console.log(e);
    channel.nack(msg, {
      requeue: true
    });
  }
}

/**
 * receives RawArticle[],
 * replace the null fields with empty string,
 * check for existence,
 * then save to mongo
 */
const saveToMongo = async () => {
  try {
    const channel = await getChannel();
    if (!channel) return;
    const {
      q
    } = await getSaveToMongoExchange(channel);
    channel.consume(q.queue, (msg) => handleMessage(msg, channel), {
      noAck: false
    });
  } catch (e) {
    console.log('saveToMongo consumer ', e)
  }
}

module.exports = saveToMongo
