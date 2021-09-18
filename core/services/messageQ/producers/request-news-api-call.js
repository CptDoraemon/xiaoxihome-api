const getChannel = require('../channel');
const {
  CATEGORY_VALUES: newsCategoryValues
} = require('../../mongoDB/news');
const {getGetNewsExchange} = require('../exchanges');

const requestNewsApiCall = async (_msg) => {
  try {
    const channel = await getChannel();
    if (!channel) return;

    const {
      exchange,
      routingKey,
    } = await getGetNewsExchange(channel);

    const msg = _msg || {
      data: {},
      attempted: 0
    }
    if (!_msg) {
      newsCategoryValues.forEach(category => {
        msg.data[category] = false
      })
    }
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
  } catch (e) {
    console.log('requestNewsApiCall ', e)
  }
}

module.exports = requestNewsApiCall
