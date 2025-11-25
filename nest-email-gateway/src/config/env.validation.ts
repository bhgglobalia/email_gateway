import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: [/https?/, /postgres/] })
    .required(),
  JWT_SECRET: Joi.string().min(8).required(),
  REDIS_URL: Joi.string().uri().required(),
  FRONTEND_ORIGIN: Joi.string().required(),

  JWT_EXPIRATION: Joi.string().default('7d'),

  PUBLIC_URL: Joi.string().uri().optional(),

  GMAIL_CLIENT_ID: Joi.string().optional(),
  GMAIL_CLIENT_SECRET: Joi.string().optional(),
  MS_CLIENT_ID: Joi.string().optional(),
  MS_CLIENT_SECRET: Joi.string().optional(),

  GMAIL_TOKEN_EXPIRY: Joi.string().isoDate().optional(),
  OUTLOOK_TOKEN_EXPIRY: Joi.string().isoDate().optional(),

  EVENTS_SHARED_SECRET: Joi.string().optional(),
  WEBHOOK_SECRET: Joi.string().optional(),

  DEFAULT_ADMIN_EMAIL: Joi.string().email().optional(),
  DEFAULT_ADMIN_PASSWORD: Joi.string().optional(),
});
