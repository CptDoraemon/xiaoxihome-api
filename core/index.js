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

const searchNews = require('./api/news/search-news/search-news');
const newsAnalytics = require('./api/news/news-analytics');

const connectToDB = require('./services/connect-to-db');
const newsRouter = require('./routers/news/news');
const xiaoxihomeRouter = require('./routers/xiaoxihome/feedback');
const weatherRouter = require('./routers/weather/weather');
const reverseGeocodingRouter = require('./routers/weather/reverse-geocoding');
const v2exRouter = require('./routers/v2ex/v2ex');
const webHooks = require('./routers/web-hooks/web-hooks');

app.use(helmet());

(async () => {
  try {
    const mongoDB = await connectToDB();

    searchNews(app, newsCollection);
    newsAnalytics(app, newsCollection);

    app.use('/api/news', newsRouter);
    app.use('/api/reversegeocoding', reverseGeocodingRouter);
    app.use('/api/weather', weatherRouter);
    app.use('/api/xiaoxihome', xiaoxihomeRouter);
    app.use('/api/v2ex', v2exRouter);
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
