const express = require('express');
const app = express();
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

const connectToDBs = require('./api/db-connections/connect-to-dbs').connectToDBs;
const weatherAPI = require('./api/weather').weather;
const reverseGeoCodingAPI = require('./api/geocoding').reverseGeoCoding;
const searchCityName = require('./api/search-cityname').searchCityName;
const getNewsGraphQL = require('./api/news/scheme');
const searchNews = require('./api/news/search-news/search-news');
const newsAnalytics = require('./api/news/news-analytics');

const xiaoxihome = require('./routers/xiaoxihome/feedback');
const v2exAPI = require('./routers/v2ex/v2ex');
const webHooks = require('./routers/web-hooks/web-hooks');

app.use(helmet());

(async () => {
  try {
    const {
      cityNameDB,
      currentNewsCollection,
      newsCollection
    } = await connectToDBs();

    searchCityName(app, cityNameDB);
    weatherAPI(app);
    reverseGeoCodingAPI(app);
    getNewsGraphQL(app, currentNewsCollection);
    searchNews(app, newsCollection);
    newsAnalytics(app, newsCollection);

    app.use('/api/xiaoxihome', xiaoxihome);
    app.use('/api/v2ex', v2exAPI);
    app.use('/api/web-hooks', webHooks);

    app.use((err, req, res, next) => {
      if (res.headersSent) {
        return next(err)
      }
      return res.json({
        status: 'error',
        message: 'server error'
      })
    })

  } catch (e) {
    console.log(e)
  }
})();


const port = process.env.PORT || 5000;
app.listen(port);
