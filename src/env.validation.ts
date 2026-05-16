import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DB_HOST: string;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validateConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validateConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validateConfig;
}
