import caxa from "caxa";
import path from "path";
import fs from "fs";

/*
 * 复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
function copyDir(src, dist, callback) {
  if (callback == undefined) {
    callback = () => {};
  }
  fs.access(dist, function (err) {
    if (err) {
      // 目录不存在时创建目录
      fs.mkdirSync(dist);
    }
    _copy(null, src, dist);
  });

  function _copy(err, src, dist) {
    if (err) {
      callback(err);
    } else {
      fs.readdir(src, function (err, paths) {
        if (err) {
          callback(err);
        } else {
          paths.forEach(function (path) {
            var _src = src + "/" + path;
            var _dist = dist + "/" + path;
            fs.stat(_src, function (err, stat) {
              if (err) {
                callback(err);
              } else {
                // 判断是文件还是目录
                if (stat.isFile()) {
                  fs.writeFileSync(_dist, fs.readFileSync(_src));
                } else if (stat.isDirectory()) {
                  // 当是目录是，递归复制
                  copyDir(_src, _dist, callback);
                }
              }
            });
          });
        }
      });
    }
  }
}

const pkg = fs.readFileSync("package.json");
const pkgjson = JSON.parse(pkg);

let suffix = "";
if (process.platform === "darwin") {
  suffix = ".app";
} else if (process.platform === "win32") {
  suffix = ".exe";
}
const outDir = `build/${pkgjson.name}${suffix}`;
const pathcmd = process.platform === "win32" ? "set" : "env";

copyDir("public", "dist/public");
delete pkgjson["devDependencies"];
delete pkgjson["scripts"];
fs.writeFileSync("dist/package.json", JSON.stringify(pkgjson));
await caxa.default({
  directory: "dist",
  command: [
    pathcmd,
    "NODE_OPTIONS=--experimental-loader={{caxa}}/public/https-loader.js",
    `{{caxa}}/node_modules/.bin/node`,
    "{{caxa}}/src/index.js",
  ],
  output: outDir,
});

console.log(`Build output to ${path.resolve(outDir)}`);
