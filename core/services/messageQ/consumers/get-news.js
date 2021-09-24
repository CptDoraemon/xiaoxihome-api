const getChannel = require('../channel');
const {getGetNewsExchange} = require('../exchanges');
const mockNewsResult = require('./mock-news-results');
const getNewsProducer = require('../producers/get-news');
const cloneDeep = require('lodash/cloneDeep');
const saveToMongoProducer = require('../producers/save-to-mongo');

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
    console.log('retrieved news in category: ', category);
    const rawArticles = cloneDeep(mockNewsResult[category].articles);
    // append requestedAt, and category into object
    rawArticles.forEach(obj => {
      obj.requestedAt = Date.now().toString();
      obj.category = category;
    })
    return rawArticles
  } catch (e) {
    console.log('getNewsInCategory error: ', category, new Date().toISOString(), e);
    return false
  }
}

const requestNews = async (msg) => {
  try {
    const data = msg.data;
    const categories = Object.keys(data);

    let index = 0;
    const handleOneCategory = async () => {
      const category = categories[index];
      if (!data[category]) {
        // only request if this category field is still false
        const articles = await getNewsInCategory(category);
        if (articles !== false) {
          data[category] = articles
        }
        await new Promise(r => setTimeout(r, 5000));
      }

      index++;
      if (index < categories.length) {
        await handleOneCategory();
      }
    }
    await handleOneCategory();

    return msg
  } catch (e) {
    console.log('requestNews ', e);
    return false
  }
}

const handleMessage = async (msg, channel) => {
  try {
    if (msg === null) return;
    const msgContent = JSON.parse(msg.content.toString());
    const updatedMsg = await requestNews(msgContent);
    updatedMsg.attempted++;
    if (Date.now() - updatedMsg.created >= 20 * 60 * 1000) {
      // discard timeout task
    } else if (updatedMsg.attempted >= 3 || Object.values(updatedMsg.data).filter(data => data === false).length === 0) {
      // reached max attempts or job finished
      // push to the next in pipeline
      // need to convert obj to array of RawArticle
      const articles = [];
      Object.values(updatedMsg.data).forEach(articlesInCategory => {
        articlesInCategory.forEach(article => articles.push(article))
      })
      await saveToMongoProducer(articles);
    } else {
      // push updatedMsg back to queue after 5 minutes
      // await new Promise(r => setTimeout(r, 1000 * 60 * 5))
      await new Promise(r => setTimeout(r, 1000))
      await getNewsProducer(updatedMsg)
    }
    channel.ack(msg);
  } catch (e) {
    console.log('getNews, handleMessage ', e);
    channel.nack(msg, {
      requeue: true
    });
  }
}

/**
 * fill in the fields that created by producer
 * eventually save an array of RawArticle into save-to-mongo queue
 */
const getNews = async () => {
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
    console.log('getNews consumer ', e)
  }
}

module.exports = getNews
