import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Behind a hosting proxy (Render, Railway, ...) set TRUST_PROXY=1 so
    // req.ip is the visitor's IP. Without it every request appears to come
    // from the proxy and rate limiting would block all users together.
    const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
    if (trustProxy > 0) {
      app.set('trust proxy', trustProxy);
    }

    // Security headers. CSP is off because this is a JSON API and
    // Swagger UI needs inline scripts.
    app.use(helmet({ contentSecurityPolicy: false }));

    // 1. Global API prefix
    app.setGlobalPrefix('api/v1');

    // 2. CORS configuration
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // 3. Global request validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // 4. Global exception handling
    app.useGlobalFilters(new HttpExceptionFilter());

    // 5. Swagger documentation and JWT authentication
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LearnLoop AI API')
      .setDescription(
        'API documentation for the LearnLoop AI learning platform',
      )
      .setVersion('1.0.0')
.addBearerAuth(
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
  'bearer',
)
      .build();

    const swaggerDocument = SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // 6. Start the server
    const port = Number(process.env.PORT) || 3002;

    await app.listen(port);

    logger.log(`LearnLoop AI is running at http://localhost:${port}`);
    logger.log(`API base URL: http://localhost:${port}/api/v1`);
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  } catch (error: unknown) {
    logger.error(
      'Failed to start LearnLoop AI',
      error instanceof Error ? error.stack : String(error),
    );

    process.exitCode = 1;
  }
  
}

void bootstrap();