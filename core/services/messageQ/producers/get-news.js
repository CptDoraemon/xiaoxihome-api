const getChannel = require('../channel');
const {
  CATEGORY_VALUES: newsCategoryValues
} = require('../../mongoDB/news');
const {getGetNewsExchange} = require('../exchanges');

/**
 * pushes an object into queue
 * {
 *   data: {[key: newsCategoryValues]: false}, the data obj needs to be filled in by consumer
 *   attempted: number, move to next if max attempts is reached
 *   created: number,  discard if message too old (due to server restart)
 * }
 */
const getNews = async (_msg) => {
  try {
    const channel = await getChannel();
    if (!channel) return;

    const {
      exchange,
      routingKey,
    } = await getGetNewsExchange(channel);

    const msg = _msg || {
      data: {},
      attempted: 0,
      created: Date.now()
    }
    if (!_msg) {
      newsCategoryValues.forEach(category => {
        msg.data[category] = false
      })
    }
    await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
    return true
  } catch (e) {
    console.log('getNews producer ', e);
    return false
  }
}

module.exports = getNews
