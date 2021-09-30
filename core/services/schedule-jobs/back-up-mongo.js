const util = require('util');
const path = require('path');
const fs = require('fs');
const {saveNewsBackup, listNewsBackups, deleteNewsBackup} = require('../aws/s3');
const {sendNotification} = require('../aws/ses');
const mongoService = require('../mongoDB/mongodb');

const deleteLocal = async (dir) => {
  try {
    await fs.promises.rmdir(dir, {recursive: true});
  } catch (e) {
    console.log('failed to delete local dir ', path, e);
    throw e
  }
}

const deleteS3Old = async () => {
  try {
    const list = await listNewsBackups();
    const deletePromise = [];
    const keys = [];
    list.Contents.forEach(obj => {
      const lastMod = new Date(obj.LastModified).getTime();
      const now = Date.now();
      const expiration = 1000 * 60 * 60 * 24 * 3;
      if (now - lastMod > expiration) {
        keys.push(obj.Key);
        deletePromise.push(deleteNewsBackup(obj.Key))
      }
    })
    await Promise.all(deletePromise);
    return keys;
  } catch (e) {
    console.log('failed to delete old s3 objects ', e);
    throw e
  }
}

const mongoDump = async (filepath) => {
  const writeOneDoc = async (cursor) => {
    const doc = await cursor.next();
    await fs.promises.appendFile(filepath, JSON.stringify(doc) + "\r\n");
    const hasNext = await cursor.hasNext();
    if (hasNext) {
      await writeOneDoc(cursor)
    }
  }
  try {
    const cursor = await mongoService.newsService.collections['news'].find().sort({"_id":1});
    await writeOneDoc(cursor);
    console.log('mongo dump succeeded: ', filepath);
  } catch (e) {
    console.log('failed to dump mongo ', e);
    throw e
  }
}

const prepareDir = async () => {
  const getCleanDir = async (path) => {
    try {
      await fs.promises.stat(path);
      await fs.promises.rmdir(path, {recursive: true});
      await fs.promises.mkdir(path);
    } catch (e) {
      await fs.promises.mkdir(path)
    }
  }

  try {
    const now = new Date();
    const filename = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .split("T")[0];
    const fileDir = path.join(__dirname, 'temp');
    const filepath = path.join(fileDir, filename);
    await getCleanDir(fileDir);
    return {
      filename,
      filepath,
      fileDir
    }
  } catch (e) {
    console.log('prepareDir ', e);
    throw e
  }
}

const main = async () => {
  let filename = '';
  let filepath = '';
  let fileDir = '';

  try {
    ({filename, filepath, fileDir} = await prepareDir());
    await mongoDump(filepath);
    await saveNewsBackup(filename, filepath);
    const deletedKeys = await deleteS3Old();
    await sendNotification(
      `file saved: ${filename},\n s3 files deleted: ${JSON.stringify(deletedKeys)}`,
      'News Data Backup Succeeded'
    );
  } catch (e) {
    console.log(e);
    await sendNotification(
      JSON.stringify(e, null, 2),
      'News Data Backup Failed'
    );
  } finally {
    if (fileDir) {
      await deleteLocal(fileDir);
    }
  }
}

module.exports = main
