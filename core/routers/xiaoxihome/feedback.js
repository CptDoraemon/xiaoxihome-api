const mongoose = require ("mongoose");
const router = require('express').Router();
const sendEmailToMyself = require('../../services/send-email-to-myself').sendEmailToMyself;

const Feedback = mongoose.model('Feedback', new mongoose.Schema({
  name: {
    type: String,
    minlength: 1,
    maxlength: 200,
    required: true
  },
  email: {
    type: String,
    minlength: 1,
    maxlength: 200,
    validate: {
      validator: v => v.indexOf('@') !== -1,
      message: props => `Invalid ${props.path}`
    },
    required: true
  },
  message: {
    type: String,
    minlength: 1,
    maxlength: 2000,
    required: true
  },
  date: Date
}));

router.post('/feedback', async (req, res) => {
  try {
    const {name, email, message} = req.body;

    const date = new Date().toISOString();
    const feedback = new Feedback({name, email, message, date});
    await feedback.save();
    // don't wait for sending email
    sendEmailToMyself({name, email, message, date});

    return res.json({
      response: 'Thank you for your message, I\'ll get back to you soon.'
    });
  } catch (e) {
    let message = 'Server error, please try again later';

    if (e instanceof mongoose.Error) {
      if (e.message) {
        message = e.message
      }
    }

    return res.json({response: message});
  }
});

module.exports = router;
