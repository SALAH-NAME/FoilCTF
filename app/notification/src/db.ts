import { Pool } from 'pg';
import dotenv from  'dotenv';

dotenv.config();// active dotenv to scans .env file

// initializes the connection pool with specific setting
const pool = new Pool({
  user: process.env.DB_ADMIN_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'my_ctf_db',
  password: process.env.DB_ADMIN_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const db = {
  query: (text: string, params?: any[]) => {
    return pool.query(text, params);
  },
};