const getUTCDayOfYear = require('./get-utc-day-of-year').getUTCDayOfYear;
const getDocumentDate = require('./get-earliest-and-latest-document-date').getDocumentDate;

const DAY = 1000 * 60 * 60 * 24; // a day in ms
let DAILY_BIN = null;

function getDailyBinInRange(start, end) {
    if (DAILY_BIN) return DAILY_BIN;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDay = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const endDay = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    const bin = [];
    let i = startDay;
    while (i <= endDay) {
        bin.push((new Date(i)).toISOString());
        i += DAY;
    }

    // date from earliest to latest now

    bin.forEach((ISOString, i, array) => {
        const date = new Date(ISOString);
        const year = date.getUTCFullYear();
        const dayOfYear = getUTCDayOfYear(date);
        array[i] = {
            year,
            dayOfYear,
            ISOString
        }
    });

    DAILY_BIN = bin;
    return bin
}

function getDailyBinFromEarliestToLatest(collection) {
    return new Promise(async (resolve, reject) => {
        try {
            const earliestDocumentDate = await getDocumentDate('earliest', collection);
            const latestDocumentDate = await getDocumentDate('latest', collection);

            resolve(getDailyBinInRange(earliestDocumentDate, latestDocumentDate))
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    getDailyBinInRange,
    getDailyBinFromEarliestToLatest
};