import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from '../apps/api/src/app.module';

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  return cachedApp(req, res);
}
