import { IsString, IsOptional } from 'class-validator';

export class CreateUserKeyDto {
  @IsString()
  label: string;
}

export class UpdateUserKeyDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
