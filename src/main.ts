import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // 🔥 Stripe webhook — RAW body only
  // app.use('/billing/webhook', bodyParser.raw({ type: '*/*' }));
  app.use('/billing/webhook', bodyParser.raw({ type: 'application/json' }));

  // ✅ Normal routes
  app.enableCors({
    origin: true, // 🌍 allow all URLs
    credentials: true, // cookies / auth headers
  });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // ✅ Serve uploaded files (DigitalOcean server)

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(new ValidationPipe());
  //! remove krte hbe
  // app.useStaticAssets(join(process.cwd(), 'public'));

  await app.listen(process.env.PORT || 8800);
  console.log('🚀 Server running');
}

bootstrap();
