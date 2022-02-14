const router = require('express').Router();
const crypto = require('crypto');
const secret = process.env.DJANGO_DISCUSSION_BOARD_WEB_HOOK_SECRET;
const axios = require('axios');

router.post('/django-discussion-board', (req, res) => {
  const hmac = crypto.createHmac('sha256', secret);
  const body = req.rawBody;
  const requestSignature = req.get('Heroku-Webhook-Hmac-SHA256');
  if (!requestSignature) {
    return res.status(403).end()
  }

  const calculatedSignature = hmac.update(body).digest('base64');
  if (!crypto.timingSafeEqual(
      Buffer.from(requestSignature),
      Buffer.from(calculatedSignature))
  ) {
    return res.status(403).end()
  }

  process.nextTick(() => {
    axios
        .get('https://django-api-xiaoxihome.herokuapp.com/api/discussion_board/post/all/')
        .catch()
  });

  return res.status(204).end();
});

module.exports = router;
