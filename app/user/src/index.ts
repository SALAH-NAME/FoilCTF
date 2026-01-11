// TODO :
// -[ ] POST /api/auth/register
// -[ ] POST /api/auth/login
// -[ ] POST /api/auth/logout
// -[ ] POST /api/auth/refresh


import express, { Request, Response } from 'express';
import 'dotenv/config';

const app = express();
const port: number = 3001;

app.use(express.json());


app.get('/user/config', (req: Request, res: Response) => {
  const dbConfig = `
    <ul>
      <li><strong>DB_HOST:</strong> ${process.env.DB_HOST || 'Not set (use default)'}</li>
      <li><strong>DB_PORT:</strong> ${process.env.DB_PORT || 'Not set (use default)'}</li>
      <li><strong>DB_NAME:</strong> ${process.env.DB_NAME || 'Not set (use default)'}</li>
      <li><strong>DB_USER:</strong> ${process.env.DB_USER || 'Not set (use default)'}</li>
      <li><strong>DB_PASSWORD:</strong> ${process.env.DB_PASSWORD || 'Not set (use default)'}</li>
    </ul>
  `;

  const userConfig = `
    <ul>
      <li><strong>PORT:</strong> ${process.env.PORT || 'Not set (use default)'}</li>
      <li><strong>JWT_SECRET:</strong> ${process.env.JWT_SECRET || 'Not set (use default)'}</li>
      <li><strong>SERVICE_NAME:</strong> ${process.env.SERVICE_NAME || 'Not set (use default)'}</li>
      <li><strong>LOG_LEVEL:</strong> ${process.env.LOG_LEVEL || 'Not set (use default)'}</li>
      <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'Not set (use default)'}</li>
    </ul>
  `;

  res.send(`
    <h1>USER SERVICE ON -_-</h1>
    <h2>User Configuration</h2>
    ${userConfig}
    <h2>Database Configuration</h2>
    ${dbConfig}
  `);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});