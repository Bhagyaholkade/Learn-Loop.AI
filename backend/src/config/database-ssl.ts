/**
 * SSL options for MySQL connections.
 *
 * Hosted MySQL (e.g. Aiven) requires TLS. Set:
 *   DB_SSL=true
 *   DB_SSL_CA=<the provider's CA certificate, PEM>
 * DB_SSL_CA may be pasted with real line breaks or with "\n" escapes
 * (some hosting dashboards only accept a single line).
 *
 * Locally (DB_SSL unset) no SSL is used.
 */
export function buildDatabaseSsl(env: {
  DB_SSL?: string;
  DB_SSL_CA?: string;
}): { ca?: string; rejectUnauthorized: boolean } | undefined {
  if (env.DB_SSL?.trim().toLowerCase() !== 'true') {
    return undefined;
  }

  const ca = env.DB_SSL_CA?.replace(/\\n/g, '\n').trim();

  // Always verify the server certificate; the CA lets us trust
  // providers whose certificate is not in the system store.
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}
