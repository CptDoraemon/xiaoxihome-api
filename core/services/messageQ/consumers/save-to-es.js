const getChannel = require("../channel");
const {getSaveToEsExchange} = require("../exchanges");
const esService = require('../../elasticsearch/elasticsearch');

const handleMessage = async (msg, channel) => {
  try {
    const docs = JSON.parse(msg.content.toString());
    const isSaved = await esService.newsService.saveMongoDocsToEs(docs);
    if (isSaved) {
      console.log(`${docs.length} news articles has been saved to ES`, new Date().toISOString());
      channel.ack(msg);
    } else {
      throw new Error()
    }
  } catch (e) {
    console.log(e);
    channel.nack(msg, {
      requeue: true
    });
  }
}

/**
 * receives mongoDB document, saves to ES
 */
const saveToEs = async () => {
  try {
    const channel = await getChannel();
    if (!channel) return;
    const {
      q
    } = await getSaveToEsExchange(channel);
    channel.consume(q.queue, (msg) => handleMessage(msg, channel), {
      noAck: false
    });
  } catch (e) {
    console.log('saveToEs consumer ', e)
  }
}

module.exports = saveToEs
