require('dotenv').config();
const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  }
});
const INDEX_NAME = 'news';

const createIndex = async () => {
  try {
    await client.indices.delete({index: INDEX_NAME})
  } catch (e) {
    console.log(`Didn't delete index`)
  }

  await client.indices.create({
    index: INDEX_NAME,
    body: {
      mappings: {
        properties: {
          source: {
            type: 'text',
            fields : {
              keyword : {
                type : "keyword",
              }
            }
          },
          author: {type: 'text'},
          title: {type: 'text'},
          description: {type: 'text'},
          publishedAt: {type: 'date'},
          content: {type: 'text'},
          category: {type: 'keyword'},
          url: {enabled: false},
          urlToImage: {enabled: false}
        }
      }
    }
  });
  console.log('news index created with mapping');
}

const saveDocToES = async (doc) => {
  try {
    await client.index({
      index: INDEX_NAME,
      id: `${doc._id}`,
      body: {
        source: doc.source.name,
        author: doc.author,
        title: doc.title,
        description: doc.description,
        publishedAt: doc.publishedAt,
        content: doc.content,
        category: doc.category,
        url: doc.url,
        urlToImage: doc.urlToImage
      },
      refresh: false
    })
    return true
  } catch (e) {
    console.log(e)
    console.log('failed save: ', doc._id);
    return false
  }
}

const bulkSave = async (array) => {
  try {
    const body = array.flatMap(doc => [
      {
        index: {
          _index: INDEX_NAME,
          _id: `${doc._id}`
        }
      },
      {
        source: doc.source.name,
        author: doc.author,
        title: doc.title,
        description: doc.description,
        publishedAt: doc.publishedAt,
        content: doc.content,
        category: doc.category,
        url: doc.url,
        urlToImage: doc.urlToImage
      }
    ])
    await client.bulk({
      refresh: false,
      body
    })
    return true
  } catch (e) {
    console.log(e)
    console.log('failed save: ', array[0]._id, array[array.length - 1]._id);
    return false
  }
}

const connectToMongo = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      "auth": { "authSource": "admin" },
      "user": process.env.MONGODB_USER,
      "pass": process.env.MONGODB_PASS,
    })

    const db = mongoose.connection;
    db.on('error', (err) => {
      console.log('main db mongoose connection error', err);
      reject(err);
    });
    db.once('open', () => {
      console.log('connected to mongoDB')
      resolve(db);
    })
  })
}

(async () => {
  let saved = 0;
  let failedID = [];
  let bulkArray = [];
  const startedAt = Date.now();

  try {
    await createIndex();
    const mongo = await connectToMongo();
    const cursor = await mongo.collection('news').find().sort({"_id":1});

    // disable index refresh
    await client.indices.put_settings({
      index: INDEX_NAME,
      body: {
        refresh_interval: -1
      }
    })

    // save one by one
    // const handleOne = async () => {
    //   const doc = await cursor.next();
    //   const isSaved = await saveDocToES(doc);
    //   isSaved ? saved++ : failedID.push(`${doc._id}`);
    //   if (saved % 1000 === 0) {
    //     console.log('saved: ', saved)
    //   }
    //   const hasNext = await cursor.hasNext();
    //   if (hasNext) {
    //     await handleOne()
    //   }
    //   return true
    // }
    // await handleOne();

    // save bulk
    const handleOne = async () => {
      const doc = await cursor.next();
      bulkArray.push(doc);
      saved++;
      const hasNext = await cursor.hasNext();
      if (bulkArray.length === 5000 || !hasNext) {
        await bulkSave(bulkArray);
        bulkArray = [];
        console.log('saved: ', saved)
      }
      if (hasNext) {
        await handleOne()
      }
      return true
    }
    await handleOne();

    // refresh after all saved
    await client.indices.refresh({
      index: INDEX_NAME
    });

    // restore normal refresh interval
    await client.indices.put_settings({
      index: INDEX_NAME,
      body: {
        refresh_interval: '1s'
      }
    })

    return true
  } catch (e) {
    console.log(e)
  } finally {
    console.log('saved: ', saved);
    console.log('failed: ', failedID);
    console.log('time elapsed in seconds: ', Math.round((Date.now() - startedAt) / 1000))
  }
})()