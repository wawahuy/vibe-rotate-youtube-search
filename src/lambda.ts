import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express = require('express');
import { AppModule } from './app.module';

const server = express();
let app: any = null;

async function bootstrap(): Promise<express.Express> {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.setGlobalPrefix('api', { exclude: ['/'] });
    app.enableCors({ origin: '*', credentials: true });

    await app.init();
  }
  return server;
}

export default async (req: any, res: any) => {
  const expressApp = await bootstrap();
  expressApp(req, res);
};
