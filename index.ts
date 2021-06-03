process.chdir(process.argv[2]);
import { Framework as WebFramework } from '@midwayjs/web';
import { Bootstrap } from '@midwayjs/bootstrap';
const web = new WebFramework().configure({
  port: 7001,
});

Bootstrap.load(web).run();
