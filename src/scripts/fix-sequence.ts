// src/scripts/fix-sequence.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Sequelize } from 'sequelize-typescript';

export async function fixUserSequence() {
  const app = await NestFactory.create(AppModule);
  const sequelize = app.get(Sequelize);

  // 1. Encontrar el máximo ID actual
  const [results] = await sequelize.query('SELECT MAX(id) as max_id FROM users') as any[];
  const maxId = results[0]?.max_id || 0;

  console.log(`📊 Current max ID: ${maxId}`);

  // 2. Resetear la secuencia al siguiente valor
  const nextId = maxId + 1;
  await sequelize.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${nextId}`);

  console.log(`✅ Sequence reset to: ${nextId}`);
}
fixUserSequence()
  .then(() => {
    console.log('🎉 User ID sequence fixed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fixing user ID sequence:', error);
    process.exit(1);
  });