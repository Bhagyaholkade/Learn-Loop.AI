import { buildDatabaseSsl } from './database-ssl';

describe('buildDatabaseSsl', () => {
  it('uses no SSL unless DB_SSL=true', () => {
    expect(buildDatabaseSsl({})).toBeUndefined();
    expect(buildDatabaseSsl({ DB_SSL: 'false' })).toBeUndefined();
  });

  it('verifies the server certificate when SSL is on', () => {
    expect(buildDatabaseSsl({ DB_SSL: 'true' })).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('accepts a CA pasted on one line with \\n escapes', () => {
    const ssl = buildDatabaseSsl({
      DB_SSL: 'TRUE',
      DB_SSL_CA: '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----',
    });

    expect(ssl?.ca).toBe(
      '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----',
    );
    expect(ssl?.rejectUnauthorized).toBe(true);
  });
});
