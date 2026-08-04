import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // app.use(compression());

  // app.use(cookieParser());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('TeamHub API')
    .setDescription(
      `API for TeamHub Project Management and Collaboration Platform.
      
      ## Features
      - User authentication with JWT
      - Creation and Manamgement of Projects
      - Assign task to members
      - See sctivity Workflow
      - See how your team performs
      
      ## Authentication
      Use the /auth/login endpoints to get a JWT token.
      Then include the token in the Authorization header: \`Bearer <token>\`
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3001);

  console.log('Server running on http://localhost:3001');
  console.log('Swagger available at http://localhost:3001/api');
}

bootstrap();
