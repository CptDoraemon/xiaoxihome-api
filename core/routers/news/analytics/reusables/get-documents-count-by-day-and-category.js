const getDailyBinFromEarliestToLatest = require('./get-daily-bin').getDailyBinFromEarliestToLatest;
const matchValueArrayToDailyBin = require('./match-value-array-to-daily-bin').matchValueArrayToDailyBin;

let cache = null;
const categoryOrder = ['headline', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'];


/*
*  type doc = {
*       count: number,
*       year: number,
*       dayOfYear: number,
*       category: string
*   }[]
* */
// returns {
//     documentCount: number[][], // documents count each day grouped by category in the order specified by categoryOrder
//     series: string[], // array of ISO dat string
//     category: string[] // copy of categoryOrder
// }
async function processDoc(doc, newsCollection) {
    try {
        let lastDay = -1;
        let lastYear = -1;
        const documentCountArray = []; // array of object
        let currentDayDocumentCountArray = null; // array of numbers
        const dailyBin = await getDailyBinFromEarliestToLatest(newsCollection);
        const category = categoryOrder.slice();

        const pushDay = () => {
            documentCountArray.push({
                year: lastYear,
                dayOfYear: lastDay,
                documentCount: currentDayDocumentCountArray.slice()
            });
        };

        for (let i=0; i<doc.length; i++) {
            const obj = doc[i];
            if (obj.dayOfYear !== lastDay) {
                if (currentDayDocumentCountArray) {
                    pushDay();
                }
                lastDay = obj.dayOfYear;
                lastYear = obj.year;
                currentDayDocumentCountArray = (new Array(categoryOrder.length)).fill(0);
            }
            const index = categoryOrder.indexOf(obj.category);
            currentDayDocumentCountArray[index] = obj.count;
        }
        pushDay();

        const matched = matchValueArrayToDailyBin(dailyBin, documentCountArray, 'documentCount', (new Array(categoryOrder.length)).fill(0));

        return {
            documentCount: matched.slice(),
            category
        }
    } catch (e) {
        throw(e)
    }
}

function getDocumentsCountByDayAndCategory(newsCollection) {
    return new Promise( (resolve, reject) => {
        if (cache) {
            resolve(cache);
            return
        }

        newsCollection.aggregate([
            { $group: {
                    _id: {
                        year: {$year: '$_id'},
                        dayOfYear: {$dayOfYear: '$_id'},
                        category: "$category",
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
                    category: "$_id.category",
                    count: 1,
                }
            },
            {
                $sort: {
                    year: 1,
                    dayOfYear: 1,
                    category: 1
                }
            }
        ]).toArray(async (err, doc) => {
            try {
                if (err) {
                    reject(err);
                } else {
                    cache = await processDoc(doc, newsCollection);
                    resolve(cache);
                }
            } catch (e) {
                reject(e)
            }
        })
    })
}

module.exports = {
    getDocumentsCountByDayAndCategory
};