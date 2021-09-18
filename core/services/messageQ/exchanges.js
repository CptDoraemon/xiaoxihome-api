const EXCHANGE_NAMES = {
  'get-news': 'get-news'
}

const getGetNewsExchange = async (channel) => {
  try {
    const exchange = EXCHANGE_NAMES["get-news"];
    const queueName = "get-news";
    const routingKey = "get-news"
    await channel.assertExchange(exchange, 'direct', {
      durable: true
    });
    const q = await channel.assertQueue(queueName);
    channel.bindQueue(q.queue, exchange, routingKey);
    return {
      exchange,
      queueName,
      routingKey,
      q
    }
  } catch (e) {
    throw e
  }
}

module.exports = {
  getGetNewsExchange
}
