const EXCHANGE_NAMES = {
  'get-news': 'get-news',
  'save-to-mongo': 'save-to-mongo',
  'save-to-es': 'save-to-es'
}

const createGetDirectExchange = (name) => {
  return async (channel) => {
    try {
      const exchange = name;
      const routingKey = name;
      const queueName = name;
      await channel.assertExchange(exchange, 'direct', {
        durable: true
      });
      const q = await channel.assertQueue(queueName);
      channel.bindQueue(q.queue, exchange, routingKey);
      return {
        exchange,
        routingKey,
        queueName,
        q
      }
    } catch (e) {
      throw e
    }
  }
}

const getGetNewsExchange = createGetDirectExchange(EXCHANGE_NAMES["get-news"]);
const getSaveToMongoExchange = createGetDirectExchange(EXCHANGE_NAMES["save-to-mongo"]);
const getSaveToEsExchange = createGetDirectExchange(EXCHANGE_NAMES["save-to-es"]);

module.exports = {
  getGetNewsExchange,
  getSaveToMongoExchange,
  getSaveToEsExchange
}
