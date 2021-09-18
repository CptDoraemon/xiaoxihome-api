const schedule = require('node-schedule');
const requestNewsApiCall = require('../messageQ/producers/request-news-api-call');

// fetch news from API every 3 hours
// flow:
// 1. push a message to queue
// 2. consumer send call to API, with up to 3 attempts
// 3. upon successful API call, push collected news into another queue
// 4. consumer clean the data, write to mongoDB
// 5. mongoDB date stream event push a message to queue
// 6. consumer write mongoDB data to elasticsearch
const fetchNewsJob = () => {
  requestNewsApiCall();
  // const job = schedule.scheduleJob('0 */1 * * * *', function(){
  //   requestNewsApiCall();
  //   console.log('scheduled fetching news invoked', new Date());
  // });
  // const ms = job.nextInvocation()._date.ts;
  // console.log('fetchNewsJob registered, next invocation is ', new Date(ms));
}

const scheduleJobs = () => {
  fetchNewsJob()
}

module.exports = scheduleJobs
