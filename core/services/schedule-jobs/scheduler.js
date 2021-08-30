const schedule = require('node-schedule');
const getNews = require('../messageQ/producers/get-news');
const backupNewsData = require('./back-up-mongo');

// fetch news from API every 3 hours
// flow:
// 1. push a message to queue
// 2. consumer send call to API, with up to 3 attempts
// 3. upon successful API call, push collected news into another queue
// 4. consumer clean the data, write to mongoDB
// 5. mongoDB date stream event push a message to queue
// 6. consumer write mongoDB data to elasticsearch
const fetchNewsJob = () => {
  const job = schedule.scheduleJob('0 0 */3 * * *', function(){
    getNews();
    console.log('scheduled fetching news invoked', new Date());
  });
  const ms = job.nextInvocation()._date.ts;
  console.log('fetchNewsJob registered, next invocation is ', new Date(ms));
}

const backupNewsDataJob = () => {
  const job = schedule.scheduleJob('0 0 2 * * *', function(){
    backupNewsData();
    console.log('scheduled dump news backup invoked', new Date());
  });
  const ms = job.nextInvocation()._date.ts;
  console.log('backupNewsDataJob registered, next invocation is ', new Date(ms));
}

const scheduleJobs = () => {
  fetchNewsJob();
  backupNewsDataJob();
}

module.exports = scheduleJobs
