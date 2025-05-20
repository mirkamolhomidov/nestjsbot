import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  await app.listen(3000);

  console.log('🤖 Telegram bot ishga tushdi...');
}
bootstrap();
