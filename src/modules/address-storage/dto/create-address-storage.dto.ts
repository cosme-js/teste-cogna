import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressStorageDto {
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  zip_code: string;

  @IsString()
  @IsNotEmpty()
  region: string;
}
