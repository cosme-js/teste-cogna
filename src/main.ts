import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  dotenv.config({ path: join(__dirname, '..', '.env') });
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));

  app.use(helmet());

  if (!(process.env.IS_PROD == 'true')) {
    const config = new DocumentBuilder()
      .setTitle('To´do List')
      .setDescription('API to create ')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
