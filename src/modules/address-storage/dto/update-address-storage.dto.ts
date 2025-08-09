import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressStorageDto } from './create-address-storage.dto';

export class UpdateAddressStorageDto extends PartialType(CreateAddressStorageDto) { }
