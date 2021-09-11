const router = require('express').Router();
const cors = require('cors');
const corsOptions = {
  origin: '*',
  maxAge: 31536000,
  methods: 'POST'
};

router.use(cors(corsOptions));

router.get('/', async (req, res) => {
  try {
    const analyticsService = req.services.elasticsearchService.newsService.newsAnalytics;
    const data = await Promise.all([
      analyticsService.getSummary(),
      analyticsService.getCountByCategory()
    ])

    if (data.filter(obj => obj === null).length > 0) {
      throw new Error()
    }

    return res.json({
      status: 'ok',
      data: {
        summary: data[0],
        countByCategory: data[1]
      }
    });

  } catch (e) {
    return res.json({
      status: 'error',
      message: 'server error'
    });
  }
});

module.exports = router;
