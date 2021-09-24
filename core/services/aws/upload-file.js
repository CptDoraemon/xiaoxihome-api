const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'ca-central-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3DisableBodySigning: true
});

const putObject = async (bucket, key, filepath) => {
  const stream = fs.createReadStream(filepath);
  await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: stream
  }).promise();
}

const saveNewsBackup = async (filename, filepath) => {
  await putObject('xiaoxihome-news-data-backup', filename, filepath)
}

module.exports = {
  saveNewsBackup
}
