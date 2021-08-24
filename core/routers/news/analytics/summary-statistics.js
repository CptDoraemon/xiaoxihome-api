const getDailyBinFromEarliestToLatest = require('./reusables/get-daily-bin').getDailyBinFromEarliestToLatest;
const getDocumentsCount = require('../analytics/reusables/get-documents-count').getDocumentsCount;
const getDocumentDate = require('../analytics/reusables/get-earliest-and-latest-document-date').getDocumentDate;
const getFrequencyAnalytics = require('./frequency-by-day').getFrequencyAnalytics;
const getDocumentsCountByCategory = require('./reusables/get-documents-count-by-category').getDocumentsCountByCategory;
const getWordCloud = require('./word-cloud').getWordCloud;
const getDocumentsCountByDayAndCategory = require('./reusables/get-documents-count-by-day-and-category').getDocumentsCountByDayAndCategory;

let cache = null;

function getSummaryStatistics(newsCollection) {
    return new Promise(async (resolve, reject) => {
        try {
            if (cache) {
                resolve(cache);
                return
            }

            const dailyBin = await getDailyBinFromEarliestToLatest(newsCollection);
            const series = dailyBin.map(obj => obj.ISOString);
            const totalDocuments = await getDocumentsCount(newsCollection, '', -1);
            const earliestDocumentDate = await getDocumentDate('earliest', newsCollection);
            const latestDocumentDate = await getDocumentDate('latest', newsCollection);
            const documentsCountByDay = await getFrequencyAnalytics('', newsCollection);
            const documentsCountByCategory = await getDocumentsCountByCategory(newsCollection);
            const wordCloud = await getWordCloud(newsCollection);
            const documentsCountByDayAndCategory = await getDocumentsCountByDayAndCategory(newsCollection);

            cache = {
                series,
                totalDocuments,
                earliestDocumentDate,
                latestDocumentDate,
                documentsCountByDay,
                documentsCountByCategory,
                wordCloud,
                documentsCountByDayAndCategory
            };

            resolve(cache)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    getSummaryStatistics
};