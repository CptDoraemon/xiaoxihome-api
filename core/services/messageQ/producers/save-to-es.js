const getChannel = require("../channel");
const getSaveToEsExchange = require('../exchanges').getSaveToEsExchange;

/**
 * receives array of mongodb docs
 */
const saveToEs = async (msg) => {
  try {
    const channel = await getChannel();
    if (!channel) return;
    const {
      exchange,
      routingKey,
    } = await getSaveToEsExchange(channel);
    await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
    return true
  } catch (e) {
    console.log('saveToMongo producer ', e);
    return false
  }
}

module.exports = saveToEs;
