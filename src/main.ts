import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  //enabling cors - cross origin resource sharing
  app.enableCors();

  app.useGlobalPipes(new ZodValidationPipe());

  app.setGlobalPrefix(apiPrefix, {
    exclude: [':code', 'health'],
  });

  //swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('Production greade URL Shortener and Analytics Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger Docs available at: http://localhost:${port}/docs`);

}
bootstrap();
