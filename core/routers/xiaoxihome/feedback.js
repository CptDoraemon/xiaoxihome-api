const mongoose = require ("mongoose");
const router = require('express').Router();
const {sendXiaoxihomeFeedbackEmail} = require('../../services/aws/ses');
const cors = require("cors");

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://www.xiaoxihome.com',
    'https://xiaoxihome.com',
    'https://xiaoxihome-202108.vercel.app/'
  ],
  maxAge: 31536000,
  methods: 'POST'
};
router.use(cors(corsOptions));

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
    sendXiaoxihomeFeedbackEmail({name, email, message, date});

    return res.json({
      status: 'ok'
    });
  } catch (e) {
    let message = 'Server error, please try again later';

    if (e instanceof mongoose.Error) {
      if (e.message) {
        message = e.message;
      }
    }

    return res.json({
      status: 'error',
      message
    });
  }
});

module.exports = router;
