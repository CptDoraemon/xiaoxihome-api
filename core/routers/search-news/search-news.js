const router = require('express').Router();
const cors = require('cors');
const corsOptions = {
  origin: '*',
  maxAge: 31536000,
  methods: 'GET'
};
//
const getFindArg = require('../news/analytics/reusables/get-documents-count').getFindArg;
const getDocumentsCount = require('../news/analytics/reusables/get-documents-count').getDocumentsCount;
const getDailyBinFromEarliestToLatest = require('../news/analytics/reusables/get-daily-bin').getDailyBinFromEarliestToLatest;
// validators
const validateKeyword = require('./query-validation').validateKeyword;
const validateSkip = require('./query-validation').validateSkip;
const validateDate = require('./query-validation').validateDate;
const validateSort = require('./query-validation').validateSort;
const sortTypes = require('./query-validation').sortTypes;

// Analytics imports
const getFrequencyAnalytics = require('../news/analytics/frequency-by-day').getFrequencyAnalytics;
// Analytics imports end

router.get('/', cors(corsOptions), async (req, res) => {
  try {
    const newsCollection = req.services.newsService.collections.news;
    let isError = false;
    const setIsError = () => isError = true;

    const keyword = validateKeyword(req.query.keyword, res, setIsError);
    const sort = validateSort(req.query.sort, res, setIsError);
    const skip = validateSkip(req.query.skip, res, setIsError);
    const isFrequency = req.query.frequency;
    const date = validateDate(req.query.date, res, setIsError);

    if (isError) return;

    const docs = await searchNewsInDB(newsCollection,`${keyword}`, sort, skip, date);
    const totalCount = await getDocumentsCount(newsCollection, `${keyword}`, date);
    const baseResponse = {
      status: 'ok',
      totalCount,
      data: docs
    };

    // Response with frequency
    if (isFrequency) {
      const frequencyAnalytics = await getFrequencyAnalytics(keyword, newsCollection);
      const dailyBin = await getDailyBinFromEarliestToLatest(newsCollection);
      const series = dailyBin.map(obj => obj.ISOString);
      baseResponse.frequency = frequencyAnalytics;
      baseResponse.series = series;
    }

    // Base response
    res.json(baseResponse)

  } catch (e) {
    console.log(e);
    res.json({
      status: 'error',
      message: 'unknown error'
    });
  }
})

function searchNewsInDB(collection, keyword, sortBy, skipper, date) {
  const sortArg = sortBy === sortTypes.relevance ?
      { score: {$meta: 'textScore'}, _id: -1 } :
      { _id: -1, score: {$meta: 'textScore'} };

  const findArg = getFindArg(keyword, date);

  return new Promise((resolve, reject) => {
    collection
        .find(findArg)
        .project({score: {$meta: 'textScore'}})
        .sort(sortArg)
        .skip(skipper)
        .limit(20)
        .toArray((err, docs) => {
          // client.close();
          if (err) reject(err);
          resolve(docs)
        });
  });
}

module.exports = router;
