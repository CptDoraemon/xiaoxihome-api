const AWS = require('./init');

const ses = new AWS.SES({apiVersion: '2010-12-01', region: process.env.AWS_SES_REGION});

const getXiaoxihomeFeedbackEmailParam = ({name, email, message, date}) => {
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

const sendEmail = async (params) => {
  try {
    await ses.sendEmail(params).promise()
  } catch (e) {
    console.log('sendEmail', e)
  }
}

const sendXiaoxihomeFeedbackEmail = async ({name, email, message, date}) => {
  await sendEmail(getXiaoxihomeFeedbackEmailParam({name, email, message, date}))
}

const sendNotification = async (message, subject) => {
  await sendEmail({
    Destination: {
      ToAddresses: [
        process.env.XIAOXIHOME_FEEDBACK_RECIPIENT,
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: message
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject || "XiaoxiHome API Notification"
      }
    },
    Source: "noreply@xiaoxihome.com",
  })
}

module.exports = {
  sendXiaoxihomeFeedbackEmail,
  sendNotification
}
