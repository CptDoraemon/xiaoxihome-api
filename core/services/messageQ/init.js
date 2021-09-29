const getNews = require('./consumers/get-news');
const saveToMongo = require('./consumers/save-to-mongo');
const saveToEs = require('./consumers/save-to-es');
const getChannel = require('./channel');

const waitUntilMQIsUp = async () => {
  const channel = await getChannel();
  if (!channel) {
    await new Promise(r => setTimeout(r, 5000));
    await waitUntilMQIsUp();
  }
}

const init = async () => {
  try {
    await waitUntilMQIsUp();

    // sub consumers
    await getNews();
    await saveToMongo();
    await saveToEs();
  } catch (e) {
    console.log('message queue init error ', e)
  }
}

module.exports = init
