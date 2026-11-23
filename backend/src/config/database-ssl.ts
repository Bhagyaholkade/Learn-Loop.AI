
/**
 * SSL options for MySQL connections.
 *
 * Hosted MySQL / TiDB:
 *   DB_SSL=true
 *   DB_SSL_CA=<provider CA certificate in PEM format>
 *
 * DB_SSL_CA supports actual line breaks or escaped "\n".
 *
 * Locally, when DB_SSL is unset, SSL is disabled.
 */
export function buildDatabaseSsl(env: {
  DB_SSL?: string;
  DB_SSL_CA?: string;
}): { ca?: string; rejectUnauthorized: boolean } | undefined {
  if (env.DB_SSL?.trim().toLowerCase() !== 'true') {
    return undefined;
  }

  const ca = env.DB_SSL_CA?.replace(/\\n/g, '\n').trim();

  return ca
    ? {
        ca,
        rejectUnauthorized: true,
      }
    : {
        rejectUnauthorized: true,
      };
}
