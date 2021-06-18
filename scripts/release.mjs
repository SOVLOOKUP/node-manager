// eslint-disable-next-line node/no-unpublished-import
import requireResolver from 'dependencies-resolver';
// eslint-disable-next-line node/no-unpublished-import
import caxa from 'caxa';
import { resolve } from 'path';

let suffix = '-x86_64-unknown-linux-gnu';
if (process.platform === 'darwin') {
  suffix = '-x86_64-apple-darwin';
} else if (process.platform === 'win32') {
  suffix = '-x86_64-pc-windows-msvc.exe';
}
const output = 'release/starry' + suffix;

(async () => {
  console.log('Resolve dependencies...');
  await requireResolver.default('build');

  console.log('Building dist...');
  await caxa.default({
    input: 'build',
    command: [
      // pathcmd,
      // 'NODE_OPTIONS=--experimental-loader={{caxa}}/public/https-loader.js',
      '{{caxa}}/node_modules/.bin/node',
      '{{caxa}}/index.js',
      '{{caxa}}',
    ],
    output: output,
  });

  console.log(`Dist output to ${resolve(output)}`);
})();
