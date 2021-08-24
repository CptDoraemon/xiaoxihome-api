const getDailyBinFromEarliestToLatest = require('./reusables/get-daily-bin').getDailyBinFromEarliestToLatest;
const matchValueArrayToDailyBin = require('./reusables/match-value-array-to-daily-bin').matchValueArrayToDailyBin;

function getKeywordFrequencyByDay(keyword, collection) {
    const pipeline = [
        { $group: {
                _id: {
                    year: {$year: "$_id"},
                    dayOfYear: {$dayOfYear: "$_id"}
                },
                count: {
                    $sum: 1
                }
            }
        },
        { $project: {
                _id: 0,
                year: "$_id.year",
                dayOfYear: "$_id.dayOfYear",
                count: 1,
            }
        }
    ];

    if (keyword.length > 0) {
        pipeline.unshift(        { $match: { $text: { $search : keyword } } })
    }

    return new Promise((resolve, reject) => {
        collection.aggregate(pipeline)
            .toArray((err, result) => {
                if (err) reject(err);
                resolve(result);
            })
    })
}

async function getFrequency(keyword, collection, bin) {
    try {
        const rawFrequency = await getKeywordFrequencyByDay(keyword, collection);
        return matchValueArrayToDailyBin(bin, rawFrequency, 'count', 0)
    } catch (e) {
        throw(e)
    }
}

async function getFrequencyAnalytics(keyword, collection) {
    try {
        const bin = await getDailyBinFromEarliestToLatest(collection);
        const frequency = await getFrequency(keyword, collection, bin);

        return frequency
    } catch (e) {
        throw(e)
    }
}

module.exports = {
    getFrequencyAnalytics,
};