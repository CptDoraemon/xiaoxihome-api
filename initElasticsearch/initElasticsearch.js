require('dotenv').config();
const {
  client,
  connectToMongo
} = require('./connect');
const deleteIndicesIfExists = require('./reset')

const Indices = {
  'NEWS': 'news',
  'SEARCHED_KEYWORDS': 'searched-keywords'
}

const createNewsIndex = async () => {
  await client.indices.create({
    index: Indices.NEWS,
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
          url: {type: 'keyword', index: false},
          urlToImage: {type: 'keyword', index: false}
        }
      }
    }
  });
  console.log(`${Indices.NEWS} index created with mapping`);
}

const createSearchedKeywordIndex = async () => {
  await client.indices.create({
    index: Indices.SEARCHED_KEYWORDS,
    body: {
      mappings: {
        properties: {
          timestamp: {type: 'date'},
          keyword: {
            type: 'keyword',
            normalizer: "lowercase"
          }
        }
      }
    }
  });
  console.log(`${Indices.SEARCHED_KEYWORDS} index created with mapping`);
}

const bulkSave = async (array) => {
  try {
    const body = array.flatMap(doc => [
      {
        index: {
          _index: Indices.NEWS,
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

(async () => {
  let saved = 0;
  let failedID = [];
  let bulkArray = [];
  const startedAt = Date.now();

  try {
    const mongo = await connectToMongo();
    await deleteIndicesIfExists(client, Object.values(Indices))
    const cursor = await mongo.collection('news').find().sort({"_id":1});

    // create indices
    await createNewsIndex();
    await createSearchedKeywordIndex();

    // disable index refresh
    await client.indices.put_settings({
      index: Indices.NEWS,
      body: {
        refresh_interval: -1
      }
    })

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
      index: Indices.NEWS,
    });

    // restore normal refresh interval
    await client.indices.put_settings({
      index: Indices.NEWS,
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
