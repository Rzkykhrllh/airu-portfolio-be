import dotenv from 'dotenv';
import no from 'zod/v4/locales/no.js';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.Node_ENV || 'development',
};

export default config;