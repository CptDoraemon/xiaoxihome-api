const getNews = require('./consumers/get-news');
const saveToMongo = require('./consumers/save-to-mongo');
const saveToEs = require('./consumers/save-to-es');

const init = async () => {
  try {
    // sub consumers
    await getNews();
    await saveToMongo();
    await saveToEs();
  } catch (e) {
    console.log('message queue init error ', e)
  }
}

module.exports = init
