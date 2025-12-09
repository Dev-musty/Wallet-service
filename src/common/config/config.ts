const env = () => ({
  port: Number(process.env.PORT) || 3000,
  db_type: process.env.DB_TYPE,
  db_user: process.env.DB_USERNAME,
  db_pass: process.env.DB_PASSWORD,
  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,
  db_name: process.env.DB_NAME,
  db_ssl: process.env.DB_SSL === 'true',
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL,
  jwt_secret: process.env.JWT_SECRET,
  jwt_expiration: process.env.JWT_EXPIRATION || '1d',
});

export default env;
