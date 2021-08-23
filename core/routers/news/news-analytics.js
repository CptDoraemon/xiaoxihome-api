const getSummaryStatistics = require('./analytics/summary-statistics').getSummaryStatistics;
const router = require('express').Router();
const cors = require('cors');
const corsOptions = {
  origin: '*',
  maxAge: 31536000,
  methods: 'POST'
};

router.get('/', cors(corsOptions), async (req, res) => {
  try {
    const newsCollection = req.services.newsService.collections.news;
    const newsAnalytics = await getNewsAnalytics(newsCollection);
    res.json(Object.assign(
        {},
        {
          status: 'ok'
        },
        newsAnalytics
    ))
  } catch (e) {
    await res.json({
      status: 'error',
      message: 'server error'
    });
    throw (e)
  }
});

// getNewsAnalytics is time consuming
// exec it when server starts and cache the result
async function getNewsAnalytics(newsCollection) {
  try {
    const summaryStatistics = await getSummaryStatistics(newsCollection);
    return {
      summaryStatistics
    }
  } catch (e) {
    throw (e)
  }
}

module.exports = {
  router,
  getNewsAnalytics
};
