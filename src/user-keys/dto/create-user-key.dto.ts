import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserKeyDto {
  @ApiPropertyOptional({ description: 'Friendly name for the API key' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Max requests per hour (0 = unlimited)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateLimit?: number;
}
