import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as os from 'os';
const cluster = require('node:cluster');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking worker ${process.pid}`);
    cluster.fork();
  }
} else {
  async function bootstrapWorker() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Worker ${process.pid} is running on port ${process.env.PORT ?? 3000}`);
  }
  bootstrapWorker();
}
