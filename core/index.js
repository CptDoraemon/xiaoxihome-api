const express = require('express');
const app = express();
const helmet = require('helmet');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

const mongoDBService = require('./services/mongoDB/mongodb');
const elasticsearchService = require('./services/elasticsearch/elasticsearch');
const scheduleJobs = require('./services/schedule-jobs/scheduler');
const initMessageQ = require('./services/messageQ/init');

const newsAnalyticsRouter = require('./routers/news/news-analytics');
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
    await mongoDBService.connect();
    mongoDBService.finishSetUp();
    // await mongoDBService.newsService.update();
    await initMessageQ();
    scheduleJobs();

    app.use((req, res, next) => {
      req.services = {};
      next();
    })

    const newsServiceMiddleware = (req, res, next) => {
      req.services.newsService = mongoDBService.newsService;
      next()
    }

    const elasticsearchServiceMiddleware = (req, res, next) => {
      req.services.elasticsearchService = elasticsearchService;
      next()
    }

    getNewsGraphQL('/api/news', app, elasticsearchService);
    app.use('/api/news-analytics', elasticsearchServiceMiddleware, newsAnalyticsRouter)
    app.use('/api/search-news', newsServiceMiddleware, elasticsearchServiceMiddleware, searchNewsRouter);
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
