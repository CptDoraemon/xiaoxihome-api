const router = require('express').Router();
const axios = require('axios');
const cloneDeep = require('lodash/cloneDeep');
const cors = require('cors');
const corsOptions = {
  origin: ['http://localhost:8080', 'https://cptdoraemon.github.io'],
  maxAge: 31536000,
  methods: 'GET'
};

const NEW_CACHE = {data: null};
const NEW_LAST_REQUESTED = {time: 0};
const NEW_URL = 'https://www.v2ex.com/api/topics/latest.json';
const POPULAR_CACHE = {data: null};
const POPULAR_LAST_REQUESTED = {time: 0};
const POPULAR_URL = 'https://www.v2ex.com/api/topics/hot.json';
const THROTTLER = 60 * 1000; // 1 min

// middleware that is specific to this router
router.use(cors(corsOptions));
router.get('/new', async (req, res) => {
  await controller(req, res, NEW_URL, NEW_CACHE, NEW_LAST_REQUESTED)
});
router.get('/popular', async (req, res) => {
  await controller(req, res, POPULAR_URL, POPULAR_CACHE, POPULAR_LAST_REQUESTED)
});

async function controller(req, res, url, cache, lastCalled) {
  try {
    const now = Date.now();
    const isRecentlyCalled = now - lastCalled.time < THROTTLER;
    if (!isRecentlyCalled) {
      const res = await axios.get(url);
      cache.data = cloneDeep(res.data);
      lastCalled.time = now;
    }
    return await res.json({
      data: cache.data
    })
  } catch (e) {
    return await res.status(503).json({
      message: 'v2ex\'s API is not working at the moment'
    })
  }
}

module.exports = router;
