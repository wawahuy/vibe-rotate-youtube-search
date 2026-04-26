import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Provider } from '../database/api-key.schema';

export class CreateApiKeyDto {
  @IsString()
  key: string;

  @IsEnum(Provider)
  provider: Provider;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;

  @IsOptional()
  @IsString()
  label?: string;
}
