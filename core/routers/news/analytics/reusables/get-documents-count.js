const ObjectID = require('mongodb').ObjectID;

// @param {string} keyword - empty to count all
// @date {number} - -1 to count all
function getFindArg(keyword, date) {
    let findArg = {};

    if (keyword.length > 0) {
        findArg = Object.assign(findArg, {$text: { $search : keyword }})
    }

    if (date !== -1) {
        const dateObj = new Date(date);
        const beginningOfDay = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
        const endOfDay = beginningOfDay + 1000 * 60 * 60 * 24 - 1;
        const idMin = ObjectID(Math.floor((new Date(beginningOfDay))/1000).toString(16) + "0000000000000000");
        const idMax = ObjectID(Math.floor((new Date(endOfDay))/1000).toString(16) + "0000000000000000");

        findArg = Object.assign(findArg, {_id: {$gt: idMin, $lt: idMax}});
    }

    return findArg
}

// @param {string} keyword - empty to count all
// @date {number} - -1 to count all
function getDocumentsCount(collection, keyword, date) {
    const findArg = getFindArg(keyword, date);
    return new Promise((resolve, reject) => {
        collection.countDocuments(findArg, null, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

module.exports = {
    getDocumentsCount,
    getFindArg
};