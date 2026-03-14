import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptor/global-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;

  app.setGlobalPrefix('/api/v1');

  // Configure pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // This removes any property not defined in dto
      forbidNonWhitelisted: false,
      transform: true, // transform plain obj to dto classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? 'http://localhost:3000',
    credential: true,
    methods: ['GET', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalInterceptors(new GlobalResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new MongoExceptionFilter());

  // Enable Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('Q and A API Documentation')
    .setDescription('API documentation for questions and answers application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication related endpoints.')
    .addTag('users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter refresh JWT token',
        in: 'header',
      },
      'JWT-refresh',
    )
    .addServer(`http://localhost:${port}`, 'Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customfavIcon: 'httpd://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar {display: none},
      .swagger-ui .info {margin: 50px, 0, }
      .swagger-ui .info .title {color: #fc0606}
      `,
  });

  await app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
  });
}
bootstrap().catch((error) => {
  Logger.error('Error starting server:', error);
  process.exit(1);
});
