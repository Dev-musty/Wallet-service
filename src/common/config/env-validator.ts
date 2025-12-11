import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

class EnvVariable {
  @IsNumber()
  PORT: number;

  @IsString()
  DB_TYPE: string;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_HOST: string;

  @IsString()
  DB_PORT: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  PAYSTACK_KEY: string;

  @IsString()
  SIG_SECRET: string;
}

export const validate = (configs: Record<string, unknown>) => {
  const validateEnv = plainToInstance(EnvVariable, configs, {
    enableImplicitConversion: true,
  });
  const err = validateSync(validateEnv);
  if (err.length > 0) {
    throw new Error(err.toString());
  }
  return validateEnv;
};
