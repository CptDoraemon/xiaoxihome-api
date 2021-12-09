const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'ca-central-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3DisableBodySigning: true,
  maxRetries: 3
});

const deleteObject = async (bucket, key) => {
  await s3.deleteObject({Bucket: bucket, Key: key}).promise();
}

const listObjects = async (bucket) => {
  return await s3.listObjects({Bucket: bucket}).promise()
}

// s3.upload vs s3.puObject
// https://github.com/aws/aws-sdk-js/issues/281
const upload = async (bucket, key, filepath) => {
  const stream = fs.createReadStream(filepath);
  await s3.upload({
    Bucket: bucket,
    Key: key,
    Body: stream
  }).promise();
}

/* News backup */
const newsBackupBucket = 'xiaoxihome-news-data-backup';

const listNewsBackups = async () => {
  return await listObjects(newsBackupBucket);
}

const saveNewsBackup = async (filename, filepath) => {
  await upload(newsBackupBucket, filename, filepath)
}

const deleteNewsBackup = async (key) => {
  await deleteObject(newsBackupBucket, key)
}

module.exports = {
  saveNewsBackup,
  listNewsBackups,
  deleteNewsBackup
}
