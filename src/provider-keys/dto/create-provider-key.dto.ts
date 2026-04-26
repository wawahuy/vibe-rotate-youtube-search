import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType } from '../schemas/api-key.schema';

export class CreateProviderKeyDto {
  @ApiProperty({ description: 'Plain-text API key (will be encrypted)' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.YOUTUBE })
  @IsEnum(ProviderType)
  provider: ProviderType;

  @ApiPropertyOptional({ description: 'Friendly label for this key' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Quota limit (default 10000)', default: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quotaLimit?: number;
}
