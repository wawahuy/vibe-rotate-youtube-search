import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserApiKeyStatus } from '../schemas/user-api-key.schema';

export class UpdateUserKeyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserApiKeyStatus })
  @IsOptional()
  @IsEnum(UserApiKeyStatus)
  status?: UserApiKeyStatus;

  @ApiPropertyOptional({ description: 'Rate limit per hour (0 = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateLimit?: number;
}
