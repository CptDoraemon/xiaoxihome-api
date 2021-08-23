const AWS = require('aws-sdk');

AWS.config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_SES_REGION
});
const ses = new AWS.SES({apiVersion: '2010-12-01'});

const getEmailParam = ({name, email, message, date}) => {
  return {
    Destination: {
      ToAddresses: [
        process.env.XIAOXIHOME_FEEDBACK_RECIPIENT,
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <p>Name: ${name}</p>
          <p>Email: ${email}</p>
          <p>Message: ${message}</p>
          <p>Date: ${new Date(date).toLocaleString('en-US', { timeZone: 'America/Toronto' })}</p>
          `
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "New feedback from XiaoxiHome"
      }
    },
    Source: "noreply@xiaoxihome.com",
  }
};

const sendEmailToMyself = ({name, email, message, date}) => {
  return new Promise(resolve => {
    ses.sendEmail(getEmailParam({name, email, message, date}), function(err, data) {
      if (err) {
        console.log('sendEmail', err)
      }
      resolve(true)
    })
  })
};

module.exports = {
  sendEmailToMyself
}
