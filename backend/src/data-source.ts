
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseSsl } from './config/database-ssl';

const dataSource = new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || '',

  entities: [__dirname + '/**/*.entity{.ts,.js}'],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  ssl: buildDatabaseSsl(process.env),

  synchronize: false,
  migrationsRun: false,
});

export default dataSource;
