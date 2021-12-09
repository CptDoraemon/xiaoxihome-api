const router = require('express').Router();
const backupDB = require('../../services/schedule-jobs/back-up-mongo')

let counter = 0;

router.post('/', async (req, res) => {
  if (counter > 0) {
    return res.json({
      status: 'error'
    })
  }

  counter++;
  backupDB();
  return res.json({
    status: 'ok'
  })
});

module.exports = router;
