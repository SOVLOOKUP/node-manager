import { Framework as WebFramework } from '@midwayjs/web';
const web = new WebFramework().configure({
  port: 7001,
});

import { Bootstrap } from '@midwayjs/bootstrap';
Bootstrap.load(web).run();
