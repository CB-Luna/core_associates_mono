import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3501),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6382),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  // MinIO / Storage
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9002),
  MINIO_USE_SSL: Joi.string().valid('true', 'false').default('false'),
  MINIO_ACCESS_KEY: Joi.string().default(''),
  MINIO_SECRET_KEY: Joi.string().default(''),

  // Twilio (opcional en dev)
  TWILIO_ACCOUNT_SID: Joi.string().optional().allow(''),
  TWILIO_AUTH_TOKEN: Joi.string().optional().allow(''),
  TWILIO_PHONE_NUMBER: Joi.string().optional().allow(''),

  // Firebase (opcional en dev — necesario en producción para push notifications)
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional().allow(''),
  FIREBASE_SERVICE_ACCOUNT_BASE64: Joi.string().optional().allow(''),

  // Cupones
  HMAC_SECRET: Joi.string().optional().default('secret'),
});
