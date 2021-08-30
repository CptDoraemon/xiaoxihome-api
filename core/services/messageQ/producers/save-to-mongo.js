const getChannel = require("../channel");
const getSaveToMongoExchange = require('../exchanges').getSaveToMongoExchange;

/**
 * The article object requested from outside API, plus two fields: requestedAt and category,
 * requestedAt is epoch ms, publishedAt is ISO string
 * typedef {
 *  "source":{
      "id": null | string,
      "name": null | string
   },
   "author": null | string,
   "title": null | string,
   "description": null | string,
   "url": null | string,
   "urlToImage": null | string,
   "publishedAt": string,
   "content": null | string,
   "requestedAt": string,
   "category": string
 * } RawArticle
 */

/**
 * push an array of object into queue
 * each object is a RawArticle
 */
const saveToMongo = async (msg) => {
   try {
      const channel = await getChannel();
      if (!channel) return;
      const {
         exchange,
         routingKey,
      } = await getSaveToMongoExchange(channel);
      await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
      return true
   } catch (e) {
      console.log('saveToMongo producer ', e);
      return false
   }
}

module.exports = saveToMongo;
