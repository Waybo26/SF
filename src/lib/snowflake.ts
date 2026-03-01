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
    SNOWFLAKE_PASSWORD,
    SNOWFLAKE_PRIVATE_KEY_PATH,
    SNOWFLAKE_PRIVATE_KEY_PASSPHRASE,
    SNOWFLAKE_WAREHOUSE,
    SNOWFLAKE_DATABASE,
    SNOWFLAKE_ROLE,
  } = process.env;

  const missingVars = [
    ['SNOWFLAKE_ACCOUNT', SNOWFLAKE_ACCOUNT],
    ['SNOWFLAKE_USER', SNOWFLAKE_USER],
    ['SNOWFLAKE_WAREHOUSE', SNOWFLAKE_WAREHOUSE],
    ['SNOWFLAKE_DATABASE', SNOWFLAKE_DATABASE],
    ['SNOWFLAKE_ROLE', SNOWFLAKE_ROLE],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing Snowflake environment variables: ${missingVars.join(', ')}`);
  }

  const account = SNOWFLAKE_ACCOUNT as string;
  const username = SNOWFLAKE_USER as string;
  const warehouse = SNOWFLAKE_WAREHOUSE as string;
  const database = SNOWFLAKE_DATABASE as string;
  const role = SNOWFLAKE_ROLE as string;

  const hasPrivateKeyAuth = !!SNOWFLAKE_PRIVATE_KEY_PATH;
  const hasPasswordAuth = !!SNOWFLAKE_PASSWORD;

  if (!hasPrivateKeyAuth && !hasPasswordAuth) {
    throw new Error(
      'Snowflake auth not configured. Set SNOWFLAKE_PRIVATE_KEY_PATH (JWT) or SNOWFLAKE_PASSWORD (password).'
    );
  }

  const connect = async (config: Parameters<typeof snowflake.createConnection>[0]) => {
    connection = snowflake.createConnection(config);
    await new Promise<void>((resolve, reject) => {
      connection!.connect((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    return connection;
  };

  try {
    if (hasPrivateKeyAuth) {
      const privateKeyPath = SNOWFLAKE_PRIVATE_KEY_PATH as string;

      if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`Snowflake private key file not found at path: ${privateKeyPath}`);
      }

      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      if (
        !privateKey.includes('BEGIN PRIVATE KEY') &&
        !privateKey.includes('BEGIN ENCRYPTED PRIVATE KEY')
      ) {
        throw new Error(
          'Snowflake private key file is not a valid PEM private key. Expected BEGIN PRIVATE KEY or BEGIN ENCRYPTED PRIVATE KEY.'
        );
      }

      try {
        const jwtConnection = await connect({
          authenticator: 'SNOWFLAKE_JWT',
          account,
          username,
          privateKey,
          privateKeyPass: SNOWFLAKE_PRIVATE_KEY_PASSPHRASE,
          warehouse,
          database,
          role,
        });
        console.log('Successfully connected to Snowflake using JWT auth.');
        return jwtConnection;
      } catch (jwtError) {
        const message = jwtError instanceof Error ? jwtError.message : String(jwtError);
        console.error('Snowflake JWT authentication failed:', jwtError);

        if (!hasPasswordAuth) {
          throw new Error(
            `Snowflake JWT authentication failed: ${message}. Verify that this private key matches the public key configured on user ${username}.`
          );
        }
      }
    }

    if (hasPasswordAuth) {
      const passwordConnection = await connect({
        authenticator: 'SNOWFLAKE',
        account,
        username,
        password: SNOWFLAKE_PASSWORD,
        warehouse,
        database,
        role,
      });
      console.log('Successfully connected to Snowflake using password auth.');
      return passwordConnection;
    }

    throw new Error('Unable to establish Snowflake connection.');

  } catch (error) {
    connection = null;
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
