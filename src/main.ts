import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import cookieParser from 'cookie-parser';
import pJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  // Habilitar parsing de cookies
  app.use(cookieParser());
  
  // Configurar CORS
  app.enableCors(configService.get('cors'));
  
  // Habilitar validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar Guard JWT global (opcional)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('Sistema de autenticación con JWT y Sequelize')
    .setVersion(pJson.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su JWT token',
        in: 'header',
      },
      'JWT-auth', // Este nombre debe coincidir con @ApiBearerAuth() en los controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token entre recargas
    },
  });

  const port = process.env.SERVER_PORT ?? 4000;
  await app.listen(port);
  
  logger.log(`🚀 Server running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API docs: http://localhost:${port}/api`);
  logger.log(`📊 Version: ${pJson.version} (${process.env.NODE_ENV})`);
}
bootstrap();
