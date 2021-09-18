const EXCHANGE_NAMES = {
  'get-news': 'get-news'
}

const getGetNewsExchange = (channel) => {
  channel.assertExchange(EXCHANGE_NAMES["get-news"], 'direct', {
    durable: true
  });
  return EXCHANGE_NAMES["get-news"]
}

module.exports = {
  getGetNewsExchange
}
