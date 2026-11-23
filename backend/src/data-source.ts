
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseSsl } from './config/database-ssl';

const dataSource = new DataSource({
  type: 'mysql',

  // TiDB Cloud connection
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 4000),
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || '',

  // Entity discovery
  entities: [__dirname + '/**/*.entity{.ts,.js}'],

  // Migration discovery
  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  // SSL configuration
  ssl: buildDatabaseSsl(process.env),

  synchronize: false,
  migrationsRun: false,
});

export default dataSource;
