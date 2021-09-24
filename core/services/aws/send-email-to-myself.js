const AWS = require('./init');

const ses = new AWS.SES({apiVersion: '2010-12-01', region: process.env.AWS_SES_REGION});

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

module.exports = sendEmailToMyself
