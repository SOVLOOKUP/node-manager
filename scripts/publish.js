// eslint-disable-next-line node/no-unpublished-require
const detective = require('detective');
const fs = require('fs');
const join = require('path').join;
const resolve = require('path').resolve;
const https = require('https');
const url = 'https://nodejs.org/docs/latest/api/documentation.json';
const exec = require('child_process');
// eslint-disable-next-line node/no-unpublished-require
const caxa = require('caxa');

/**
 * 文件遍历方法
 * @param {string} filePath 需要遍历的文件路径
 * @returns {Array<string>} fileList 文件列表
 */
function getFiles(filePath) {
  const fileList = [];
  function findFile(path) {
    const files = fs.readdirSync(path);
    files.forEach(item => {
      const fPath = join(path, item);
      const stat = fs.statSync(fPath);
      if (stat.isDirectory() === true && item === 'node_modules') {
        findFile(fPath);
      }
      if (stat.isFile() === true) {
        fileList.push(fPath);
      }
    });
  }

  findFile(filePath);
  return fileList;
}

function getDepends(path) {
  const depends = [];
  const files = getFiles(path);
  files.forEach(item => depends.push(...detective(fs.readFileSync(item))));
  return Array.from(new Set(depends));
}

/**
 * 找出需要安装的包
 * @param {string} path 需要检索的文件路径
 * @param {Object<string,string>} attach 附加的依赖
 */
const requireDependsResovler = (path, attach = {}) =>
  https
    .get(url, res => {
      const datas = [];
      let size = 0;
      res.on('data', data => {
        datas.push(data);
        size += data.length;
      });
      res.on('end', () => {
        const buff = Buffer.concat(datas, size);
        const result = buff.toString();
        const content = JSON.parse(result);
        const table = content.miscs[0].miscs.filter(
          item => item.name === 'stability_overview'
        )[0].desc;

        const internelModules = table
          .match(/<a href=(.*?)>/g)
          .map(item => item.slice(9, -7));

        const toinstall = getDepends(path)
          .filter(item => !(item.startsWith('./') || item.startsWith('../')))
          .filter(item => !internelModules.includes(item));

        const pkgJsonPath = resolve(path, 'package.json');
        let pkgJson = new Object();
        if (fs.existsSync(pkgJsonPath)) {
          pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath));
          if (pkgJson['dependencies']) {
            delete pkgJson['dependencies'];
          }
          if (pkgJson['devDependencies']) {
            delete pkgJson['devDependencies'];
          }
          if (pkgJson['scripts']) {
            delete pkgJson['scripts'];
          }
        }
        const dependencyJson = new Object();
        toinstall.forEach(item => {
          dependencyJson[item] = '*';
        });
        Object.keys(attach).forEach(dependency => {
          dependencyJson[dependency] = attach[dependency];
        });

        pkgJson['dependencies'] = dependencyJson;

        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson));
        const currentDir = resolve('./');
        process.chdir(path);
        console.log('Installing dependencies...');
        exec.exec('npm install', (err, stdout, stderr) => {
          if (err) {
            console.error(err);
          }
          console.log(stdout);
          console.log(stderr);

          let suffix = '';
          if (process.platform === 'darwin') {
            suffix = '';
          } else if (process.platform === 'win32') {
            suffix = '.exe';
          }

          // const pathcmd = process.platform === 'win32' ? 'set' : 'env';
          const outDir = 'publish';
          //   console.log(fs.existsSync(resolve(currentDir, 'build')));
          const output = resolve(currentDir, outDir, 'app' + suffix);

          console.log('Building dist...');
          caxa
            .default({
              input: resolve(currentDir, 'build'),
              command: [
                // pathcmd,
                // 'NODE_OPTIONS=--experimental-loader={{caxa}}/public/https-loader.js',
                '{{caxa}}/node_modules/.bin/node',
                '{{caxa}}/index.js',
                '{{caxa}}',
              ],
              output: output,
            })
            .then(() => {
              if (process.platform === 'darwin') {
                fs.renameSync(output, output + '.app');
                console.log(`Dist output to ${output + '.app'}`);
              } else console.log(`Dist output to ${output}`);
            });
        });
      });
    })
    .on('error', err => {
      console.log(err);
    });

requireDependsResovler('build');
