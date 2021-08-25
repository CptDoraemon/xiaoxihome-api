const express = require('express');
const app = express();
const helmet = require('helmet');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

// const searchNews = require('./api/news/search-news/search-news');
// const newsAnalytics = require('./api/news/news-analytics');
//
const MongoDBService = require('./services/mongoDB/mongodb');
const searchNewsRouter = require('./routers/search-news/search-news');
const getNewsGraphQL = require('./routers/news/news');
const xiaoxihomeRouter = require('./routers/xiaoxihome/feedback');
const weatherRouter = require('./routers/weather/weather');
const reverseGeocodingRouter = require('./routers/weather/reverse-geocoding');
const v2exRouter = require('./routers/v2ex/v2ex');
const webHooks = require('./routers/web-hooks/web-hooks');

app.use(helmet());

(async () => {
  try {
    const mongoDBService = new MongoDBService();
    await mongoDBService.connect();
    mongoDBService.finishSetUp();
    await mongoDBService.newsService.update();

    const newsServiceMiddleware = (req, res, next) => {
      req.services = {
        newsService: mongoDBService.newsService
      };
      next()
    }

    // newsAnalytics(app, newsCollection);

    getNewsGraphQL('/api/news', app, mongoDBService);
    app.use('/api/search-news', newsServiceMiddleware, searchNewsRouter);
    // app.use('/api/reversegeocoding', reverseGeocodingRouter);
    // app.use('/api/weather', weatherRouter);
    // app.use('/api/xiaoxihome', xiaoxihomeRouter);
    // app.use('/api/v2ex', v2exRouter);
    // app.use('/api/web-hooks', webHooks);

    app.use((err, req, res, next) => {
      console.log(err);
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
