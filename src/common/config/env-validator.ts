import { plainToInstance } from 'class-transformer';
import { IsNumber, validateSync } from 'class-validator';

class EnvVariable {
  @IsNumber()
  PORT: number;
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
