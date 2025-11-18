import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createNamespace } from 'cls-hooked';
import { Client } from 'pg';
import { Options, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { seeds } from './seeds';

/**
 * Servicio que contiene funciones para el inicio y mantenimiento de la base de datos,
 */
@Injectable()
export class DatabaseService {
  /**
   * Objeto que permite formatear e imprimir mensajes que se generen,
   */
  private readonly logger = new Logger(DatabaseService.name);

  /**
   * Inicializa la clase para la administración de la base de datos.
   *
   * @param configService Servicio que obtiene variables de entorno.
   * @param cacheManager Servicio que sirve para administrar la cache de Redis.
   * @param sequelize Conexión con la base de datos.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Despliega el mensaje en consola y lo almacena en un arreglo de mensajes para futuro uso.
   *
   * @param logs Arreglo de mensajes generados en el proceso de sincronización de base de datos.
   * @param msg Nuevo mensaje a añadir.
   * @param error Indica si el mensaje es un error.
   */
  appendLog(logs: string[], msg: Error, error: true): void;
  appendLog(logs: string[], msg: string, error?: false): void;
  appendLog(logs: string[], msg: string | Error, error?: boolean) {
    if (error) {
      logs.push(msg.toString());
      this.logger.error(msg);
    } else {
      logs.push(msg as string);
      this.logger.log(msg);
    }
  }

  /**
   * Función que realiza la sincronización de la base de datos
   * de acuerdo a los modelos definidos por sequelize en la carpeta `models`.
   *
   * @param drop Elimina la base de datos si es necesario.
   * @returns Listado de registros de la operación.
   */
  async syncDatabase(drop = false): Promise<string[]> {
    const logs: string[] = [];
    const dbConfig = this.configService.get<Options>('database') ?? {};
    this.appendLog(logs, `Iniciando sincronización ${dbConfig.database}`);

    try {
      // Conexión a PostgreSQL (sin especificar base de datos para poder crearla)
      const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port as number,
        user: dbConfig.username,
        password: dbConfig.password,
        // Conectamos a la base de datos por defecto 'postgres'
        database: 'postgres',
      });

      await client.connect();

      if (drop) {
        this.appendLog(logs, 'Eliminando base de datos');
        // Terminar conexiones existentes antes de eliminar la BD
        await client.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity 
          WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid()
        `);
        await client.query(`DROP DATABASE IF EXISTS "${dbConfig.database}"`);
        this.appendLog(logs, 'Creando base de datos');
      }
      
      // Verificar si la base de datos existe
      const dbExists = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbConfig.database]
      );

      if (dbExists.rows.length === 0) {
        this.appendLog(logs, `Creando base de datos: ${dbConfig.database}`);
        await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      } else {
        this.appendLog(logs, `Base de datos ${dbConfig.database} ya existe`);
      }

      await client.end();

      // Sincronizar modelos con Sequelize
      await this.sequelize.sync({ force: false, alter: true });
      this.appendLog(logs, 'Base de datos sincronizada correctamente');
    } catch (error) {
      if (error instanceof Error) this.appendLog(logs, error, true);
      throw error;
    }

    return logs;
  }

  /**
   * Realiza el llenado de la base de datos en base a semillas predefinidas.
   *
   * Pasos:
   * - Realiza la búsqueda de cada semilla en el arreglo de semillas y valida si cada registro ya se encuentra en la db.
   * - Si el registro ya se encuentra, lo ignora. Si no, lo agrega a una cola.
   * - La cola de registros por añadir se agrega a la tabla.
   *
   * @returns Mensajes generados en el proceso
   */
  async populateAll(): Promise<string[]> {
    const dbConfig = this.configService.get<Options>('database') ?? {};
    const logs: string[] = [];
    let seedIndex = 0;

    const nextSeed = async () => {
      if (seedIndex >= seeds.length) return;
      const seed = seeds[seedIndex];
      const newData: typeof seed.data = [];
      let dataIndex = 0;

      const insertData = async () => {
        await seed.model.bulkCreate(newData);
        this.appendLog(
          logs,
          `Se insertaron ${newData.length} registro(s) en ${seed.model.name}`,
        );
        seedIndex += 1;
        await nextSeed();
      };

      const iterateData = async () => {
        if (dataIndex >= seed.data.length) {
          await insertData();
          return;
        }
        const item = seed.data[dataIndex];
        
        // Create a where clause based on available fields

        let whereClause: Record<string, any> = {};

        if (item.id !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          whereClause = { id: item.id };
        } else if (item.name !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          whereClause = { name: item.name };
        } else {
          // If no id or name, skip this item
          dataIndex += 1;
          await iterateData();
          return;
        }

        const response = await seed.model.findOne({
          where: whereClause,
        });
        if (!response) newData.push(item);
        dataIndex += 1;
        await iterateData();
      };

      await iterateData();
    };

    this.appendLog(logs, `Creando registros en: ${dbConfig.database}`);
    try {
      await nextSeed();
      this.appendLog(logs, `Base de datos actualizada correctamente`);
    } catch (error) {
      if (error instanceof Error) this.appendLog(logs, error, true);
      return logs;
    }

    return logs;
  }

  /**
   * Función que realiza la sincronización y llenado de la base de datos.
   *
   * @param drop Elimina la base de datos si es necesario.
   * @returns Listado de registros de la operación.
   */
  async syncAndPopulate(drop = false): Promise<string[]> {
    const responseSync = await this.syncDatabase(drop);
    const populateSync = await this.populateAll();
    return [...responseSync, ...populateSync];
  }

  /**
   * Inicializa una transacción de Sequelize, inyectando la transacción en cada una de las solicitudes.
   *
   * @param namespace Nombre de la operación
   * @param fn Función a ejecutar
   * @returns Resultado de la función
   */
  async transaction<T>(
    namespace: string,
    fn: (transaction: Transaction) => Promise<T>,
  ) {
    const nameSpace = createNamespace(namespace);
    this.sequelize.Sequelize.useCLS(nameSpace);

    return this.sequelize.transaction(async (transaction) => fn(transaction));
  }
}
