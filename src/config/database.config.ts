import { registerAs } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

export default registerAs(
  'database',
  (): SequelizeModuleOptions => ({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE_NAME || 'test-w',
    autoLoadModels: true,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+00:00',
    dialectOptions: {
      connectTimeout: 60000,
      ssl: process.env.NODE_ENV === 'production' 
        ? { require: true, rejectUnauthorized: false } 
        : false,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      paranoid: true,
      underscored: false,
      freezeTableName: false,
    },
  }),
);
