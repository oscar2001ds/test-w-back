import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { DatabaseMutationModule } from './database-mutation.module';

/**
 * Función que alimenta la base de datos con información predefinida.
 *
 * Pasos:
 * - Construye la aplicación NEST y obtiene el servicio de base de datos.
 * - Ejecuta la función para alimentar la base de datos.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    DatabaseMutationModule,
  );
  const dataPopulationService = app.get(DatabaseService);

  try {
    await dataPopulationService.populateAll();
    await app.close();
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    const logger = new Logger('populate');
    logger.error(error);
    process.exit(1);
  });
