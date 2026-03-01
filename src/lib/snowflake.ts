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
    SNOWFLAKE_PRIVATE_KEY_PASSPHRASE,
    SNOWFLAKE_WAREHOUSE,
    SNOWFLAKE_DATABASE,
    SNOWFLAKE_ROLE,
  } = process.env;

  const missingVars = [
    ['SNOWFLAKE_ACCOUNT', SNOWFLAKE_ACCOUNT],
    ['SNOWFLAKE_USER', SNOWFLAKE_USER],
    ['SNOWFLAKE_PRIVATE_KEY_PATH', SNOWFLAKE_PRIVATE_KEY_PATH],
    ['SNOWFLAKE_WAREHOUSE', SNOWFLAKE_WAREHOUSE],
    ['SNOWFLAKE_DATABASE', SNOWFLAKE_DATABASE],
    ['SNOWFLAKE_ROLE', SNOWFLAKE_ROLE],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing Snowflake environment variables: ${missingVars.join(', ')}`);
  }

  const account = SNOWFLAKE_ACCOUNT as string;
  const username = SNOWFLAKE_USER as string;
  const privateKeyPath = SNOWFLAKE_PRIVATE_KEY_PATH as string;
  const warehouse = SNOWFLAKE_WAREHOUSE as string;
  const database = SNOWFLAKE_DATABASE as string;
  const role = SNOWFLAKE_ROLE as string;

  // Read the private key file
  // Ensure the path is correct relative to where the Node.js process is run
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Snowflake private key file not found at path: ${privateKeyPath}`);
  }

  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

  try {
    connection = snowflake.createConnection({
      account,
      username,
      privateKey: privateKey,
      privateKeyPass: SNOWFLAKE_PRIVATE_KEY_PASSPHRASE,
      warehouse,
      database,
      role,
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
