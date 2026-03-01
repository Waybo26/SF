// src/lib/snowflake.ts
import snowflake from 'snowflake-sdk';
import fs from 'fs'; // Node.js built-in module for file system operations

let connection: snowflake.Connection | null = null;

export async function getSnowflakeConnection(): Promise<snowflake.Connection> {
  if (connection) {
    return connection;
  }

  // Ensure environment variables are set
  const {
    SNOWFLAKE_ACCOUNT,
    SNOWFLAKE_USER,
    SNOWFLAKE_PRIVATE_KEY_PATH,
    SNOWFLAKE_WAREHOUSE,
    SNOWFLAKE_DATABASE,
    SNOWFLAKE_ROLE,
  } = process.env;

  if (!SNOWFLAKE_ACCOUNT || !SNOWFLAKE_USER || !SNOWFLAKE_PRIVATE_KEY_PATH || !SNOWFLAKE_WAREHOUSE || !SNOWFLAKE_DATABASE || !SNOWFLAKE_ROLE) {
    throw new Error('Missing Snowflake environment variables.');
  }

  // Read the private key file
  // Ensure the path is correct relative to where the Node.js process is run
  const privateKey = fs.readFileSync(SNOWFLAKE_PRIVATE_KEY_PATH, 'utf8');

  try {
    connection = snowflake.createConnection({
      account: SNOWFLAKE_ACCOUNT,
      username: SNOWFLAKE_USER,
      privateKey: privateKey,
      warehouse: SNOWFLAKE_WAREHOUSE,
      database: SNOWFLAKE_DATABASE,
      role: SNOWFLAKE_ROLE,
    });

    await new Promise<void>((resolve, reject) => {
      connection!.connect((err) => {
        if (err) {
          console.error('Error connecting to Snowflake:', err);
          reject(err);
        } else {
          console.log('Successfully connected to Snowflake.');
          resolve();
        }
      });
    });

    return connection;

  } catch (error) {
    console.error('Failed to establish Snowflake connection:', error);
    throw error;
  }
}

export async function closeSnowflakeConnection() {
  if (connection) {
    await new Promise<void>((resolve, reject) => {
      connection!.destroy((err) => {
        if (err) {
          console.error('Error closing Snowflake connection:', err);
          reject(err);
        } else {
          console.log('Snowflake connection closed.');
          connection = null;
          resolve();
        }
      });
    });
  }
}
