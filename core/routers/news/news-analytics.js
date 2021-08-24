const getSummaryStatistics = require('./analytics/summary-statistics').getSummaryStatistics;
const cors = require('cors');
const corsOptions = {
    // origin: ['https://cptdoraemon.github.io', 'http://localhost:3000'],
    origin: '*',
    maxAge: 31536000,
    methods: 'POST'
};

function newsAnalytics(app, newsCollection) {
    app.get('/api/news-analytics', cors(corsOptions), async (req, res) => {
        try {
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
    getNewsAnalytics(newsCollection)
}

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

module.exports = newsAnalytics;
