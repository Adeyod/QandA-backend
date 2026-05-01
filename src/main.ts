import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import 'module-alias/register';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptor/global-response.interceptor';
import { QuestionsRepository } from './modules/questions/repositories/questions.repository';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;
  app.setGlobalPrefix('/api/v1');

  console.log('port:', port);

  const questionsQueue = app.get<Queue>(getQueueToken('questions-sync'));
  const mailQueue = app.get<Queue>(getQueueToken('mail'));

  // Bull Board Express adapter
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  // const examIds = [
  //   'waec-eng-2008-9',
  //   'waec-eng-2008-10',
  //   'waec-eng-2008-11',
  //   'waec-eng-2008-12',
  //   'waec-eng-2008-13',
  //   'waec-eng-2008-14',
  //   'waec-eng-2008-15',
  //   'waec-eng-2008-16',
  //   'waec-eng-2008-17',
  //   'waec-eng-2008-18',
  //   'waec-eng-2008-19',
  //   'waec-eng-2008-20',
  //   'waec-eng-2008-21',
  //   'waec-eng-2008-22',
  //   'waec-eng-2008-23',
  //   'waec-eng-2008-24',
  //   'waec-eng-2008-25',
  //   'waec-eng-2008-26',
  //   'waec-eng-2008-27',
  //   'waec-eng-2008-28',
  //   'waec-eng-2008-29',
  //   'waec-eng-2008-30',
  //   'waec-eng-2008-31',
  //   'waec-eng-2008-32',
  //   'waec-eng-2008-33',
  //   'waec-eng-2008-34',
  //   'waec-eng-2008-35',
  //   'waec-eng-2008-36',
  //   'waec-eng-2008-37',
  //   'waec-eng-2008-38',
  //   'waec-eng-2008-39',
  //   'waec-eng-2008-40',
  //   'waec-eng-2008-41',
  //   'waec-eng-2008-42',
  //   'waec-eng-2008-43',
  //   'waec-eng-2008-44',
  //   'waec-eng-2008-45',
  //   'waec-eng-2008-46',
  //   'waec-eng-2008-47',
  //   'waec-eng-2008-48',
  //   'waec-eng-2008-49',
  //   'waec-eng-2008-50',
  //   'waec-eng-2008-51',
  //   'waec-eng-2008-52',
  //   'waec-eng-2008-53',
  //   'waec-eng-2008-54',
  //   'waec-eng-2008-55',
  //   'waec-eng-2008-56',
  //   'waec-eng-2008-57',
  //   'waec-eng-2008-58',
  //   'waec-eng-2008-59',
  //   'waec-eng-2008-60',
  //   'waec-eng-2008-61',
  //   'waec-eng-2008-62',
  //   'waec-eng-2008-63',
  //   'waec-eng-2008-64',
  //   'waec-eng-2008-65',
  //   'waec-eng-2008-66',
  //   'waec-eng-2008-67',
  //   'waec-eng-2008-68',
  //   'waec-eng-2008-69',
  //   'waec-eng-2008-70',
  //   'waec-eng-2008-71',
  //   'waec-eng-2008-72',
  //   'waec-eng-2008-73',
  //   'waec-eng-2008-74',
  //   'waec-eng-2008-75',
  //   'waec-eng-2008-76',
  //   'waec-eng-2008-77',
  //   'waec-eng-2008-78',
  //   'waec-eng-2008-79',
  //   'waec-eng-2008-80',
  // ];
  const repo = app.get(QuestionsRepository);
  // await repo.changeExamYearByExamIds(examIds);

  // const repo = app.get(WalletsRepository);
  // await repo.createWallet('69b6e93307f1bf73531171cb');

  // Create Bull Board
  const { addQueue, removeQueue, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(mailQueue), new BullAdapter(questionsQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

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

  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || []).map(
    (origin) => origin.trim(),
  );

  // app.enableCors({
  //   origin: (
  //     origin: string | undefined,
  //     callback: (err: Error | null, allow?: boolean) => void,
  //   ) => {
  //     if (!origin) return callback(null, true);

  //     if (allowedOrigins.includes(origin)) {
  //       return callback(null, true);
  //     }

  //     return callback(new Error('Not allowed by CORS'), false);
  //   },
  //   credentials: true,
  // });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalInterceptors(new GlobalResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new MongoExceptionFilter());

  const serverUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://qanda-backend-1bj1.onrender.com'
      : `http://localhost:${port}`;

  // Enable Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('Q and A API Documentation')
    .setDescription('API documentation for questions and answers application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication related endpoints.')
    .addTag('users', 'User management endpoints')
    .addTag('subjects', 'Subject management endpoints')
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
    .addServer(serverUrl)
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
    console.log(
      `Bull Board available at http://localhost:${port}/admin/queues`,
    );
  });
}
bootstrap().catch((error) => {
  Logger.error('Error starting server:', error);
  process.exit(1);
});
