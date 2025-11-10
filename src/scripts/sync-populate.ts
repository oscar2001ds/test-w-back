import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { DatabaseMutationModule } from './database-mutation.module';

/**
 * Función que inicializa la base de datos y la alimenta.
 *
 * Pasos:
 * - Construye la aplicación NEST y obtiene el servicio de base de datos.
 * - Ejecuta la función para inicializar la base de datos.
 * - Si la variable de entorno booleana DROP_DATABASE es true, elimina la bd anterior.
 * - Ejecuta la función para alimentar la base de datos.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    DatabaseMutationModule,
  );
  const dataPopulationService = app.get(DatabaseService);

  try {
    await dataPopulationService.syncAndPopulate(
      process.env.NODE_ENV !== 'production',
    );
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
    const logger = new Logger('sync-populate');
    logger.error(error);
    process.exit(1);
  });
