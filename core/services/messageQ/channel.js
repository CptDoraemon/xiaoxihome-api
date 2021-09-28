const amqp = require('amqplib');

let channel = null;

const getChannel = async () => {
  try {
    if (channel) return channel;
    const connection = await amqp.connect(`amqp://${process.env.MQ_HOST}`);
    channel = connection.createChannel();
    return channel
  } catch (e) {
    console.log('failed to connect to mq: ', e);
    return null
  }
}

module.exports = getChannel
