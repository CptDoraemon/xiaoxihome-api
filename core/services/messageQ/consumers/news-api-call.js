const getChannel = require('../channel');
const {
  CATEGORY_VALUES: newsCategoryValues
} = require('../../mongoDB/news');
const {getGetNewsExchange} = require('../exchanges');
const mockNewsResult = require('./mock-news-results');
const requestNewsApiCall = require('../producers/request-news-api-call');

const getNewsInCategory = async (category) => {
  try {
    // const res = await axios.get('https://newsapi.org/v2/top-headlines', {
    //   params: {
    //     apiKey: process.env.NEWS_API_KEY,
    //     country: 'ca',
    //     ...category !== CATEGORIES.headline && {
    //       category
    //     }
    //   }
    // })
    // const data = res.data;
    // if (body.status !== 'ok') {
    //   throw new Error()
    // }
    // return data.articles;
    if (Math.random() > 0.5) {
      throw new Error()
    }
    console.log('retrieved news in category: ', category);
    return mockNewsResult[category].articles
  } catch (e) {
    console.log('getNewsInCategory error: ', category, new Date().toISOString(), e);
    return false
  }
}

const getNews = async (msg) => {
  try {
    console.log('getNews', msg)
    const data = msg.data;
    const categories = Object.keys(data);

    let index = 0;
    const handleOneCategory = async () => {
      const category = categories[index];
      const articles = await getNewsInCategory(category);
      if (articles !== false) {
        data[category] = articles
      }
      await new Promise(r => setTimeout(r, 5000));

      index++;
      if (index < categories.length) {
        await handleOneCategory();
      }
    }
    await handleOneCategory();

    return msg
  } catch (e) {
    console.log('getNews ', e);
    return false
  }
}

const handleMessage = async (msg, channel) => {
  try {
    if (msg === null) return;
    const msgContent = JSON.parse(msg.content.toString());
    const updatedMsg = await getNews(msgContent);
    updatedMsg.attempted++;
    if (updatedMsg.attempted === 3 || Object.values(updatedMsg.data).filter(data => data === false).length === 0) {
      // reached max attempts or job finished
      // push to the next in pipeline
      // TODO: next
      console.log(updatedMsg);
    } else {
      // push updatedMsg back to queue after 5 minutes
      // await new Promise(r => setTimeout(r, 1000 * 60 * 5))
      await new Promise(r => setTimeout(r, 1000))
      await requestNewsApiCall(updatedMsg)
    }
    channel.ack(msg);
  } catch (e) {
    console.log('requestNewsApiCall, handleMessage ', e);
    channel.nack(msg, {
      requeue: true
    });
  }
}

const consumeRequestNewsApiCall = async () => {
  try {
    const channel = await getChannel();
    if (!channel) return;
    const {
      q
    } = await getGetNewsExchange(channel);
    channel.consume(q.queue, (msg) => handleMessage(msg, channel), {
      noAck: false
    });
  } catch (e) {
    console.log('requestNewsApiCall ', e)
  }
}

module.exports = consumeRequestNewsApiCall
