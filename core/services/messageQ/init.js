const consumeRequestNewsApiCall = require('./consumers/news-api-call');

const init = async () => {
  try {
    // sub consumers
    await consumeRequestNewsApiCall()
  } catch (e) {
    console.log('message queue init error ', e)
  }
}

module.exports = init
