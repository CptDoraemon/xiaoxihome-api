const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs');
const {saveNewsBackup} = require('../aws/upload-file');

const deleteLocal = () => {
  
}

const deleteOld = () => {

}

const mongoDump = async (filepath) => {
  try {
    const cmd = `
      mongoexport
      --uri ${process.env.MONGODB_URI}
      --username ${process.env.MONGODB_USER}
      --password ${process.env.MONGODB_PASS}
      --collection news
      --type json
      --out ${filepath}
      --authenticationDatabase admin`;
    await exec(cmd.replace(/\n/g, "\\\n"));
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
      filepath
    }
  } catch (e) {
    console.log('prepareDir ', e);
    throw e
  }
}

const main = async () => {
  try {
    const {
      filename,
      filepath
    } = await prepareDir();
    await mongoDump(filepath);
    await saveNewsBackup(filename, filepath);

  } catch (e) {
    console.log(e);
  }
}

module.exports = main
