import { exec } from 'child_process'

if (process.argv.length === 2) {
  console.log('不支持交互')
} else {
  exec(`node ${process.argv.slice(2).join(' ')}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return
    }
    console.log(`${stdout}`)
    // console.log(`stderr: ${stderr}`);
  })
}
