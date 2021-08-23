const ObjectId = require('mongodb').ObjectId;
let EARLIEST_DOCUMENT_DATE = null;
let LATEST_DOCUMENT_DATE = null;

function getDocumentDate(which, collection) {
    return new Promise((resolve, reject) => {
        let sortBy;
        if (which === 'latest') {
            if (LATEST_DOCUMENT_DATE) {
                resolve(LATEST_DOCUMENT_DATE);
                return
            }
            sortBy = -1
        } else if (which === 'earliest') {
            if (EARLIEST_DOCUMENT_DATE) {
                resolve(EARLIEST_DOCUMENT_DATE);
                return
            }
            sortBy = 1
        } else {
            reject('wrong "which" param');
            return
        }

        collection.aggregate([
            {$sort: {_id: sortBy}},
            {$limit: 1}
        ])
            .toArray((err, result) => {
                if (err) reject(err);
                const doc = result[0];
                const time = ObjectId(doc._id).getTimestamp();
                const ISOString = (new Date(time)).toISOString();

                if (sortBy === -1) {
                    LATEST_DOCUMENT_DATE = ISOString
                } else if (sortBy === 1) {
                    EARLIEST_DOCUMENT_DATE = ISOString
                }
                resolve(ISOString);
            });
    })
}

module.exports = {
    getDocumentDate
};
