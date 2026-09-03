import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module'; 

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  app.setGlobalPrefix(apiPrefix, {
    exclude: [':code'],
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('URL Shortener and Analytics API')
    .setDescription('Production like URL Shortener, Analytics and Redirect Service')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({type: 'apiKey', name: 'x-api-key', in: 'header'}, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);

}
bootstrap();
