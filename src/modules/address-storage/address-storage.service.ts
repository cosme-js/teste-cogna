import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressStorage } from './address-storage.entity';
import { CreateAddressStorageDto } from './dto/create-address-storage.dto';
import { DATA_PROVIDERS_TOKEN, IDataProvider } from './interfaces/data.provider.interface';

@Injectable()
export class AddressStorageService {
    constructor(
        @InjectRepository(AddressStorage)
        private readonly addressStorageRepository: Repository<AddressStorage>,
        @Inject(DATA_PROVIDERS_TOKEN)
        private readonly dataProviders: IDataProvider<CreateAddressStorageDto>[],
    ) { }

    async create(data: CreateAddressStorageDto): Promise<AddressStorage> {
        const exist = await this.addressStorageRepository.existsBy({
            zip_code: data.zip_code,
        });

        if (exist) {
            throw new ConflictException(
                'There is already a city registered with the same zip code',
            );
        }

        const newAddressStorage = this.addressStorageRepository.create(data);
        return this.addressStorageRepository.save(newAddressStorage);
    }

    async getByZipCode(zipCode: string): Promise<AddressStorage> {
        const existing = await this.addressStorageRepository.findOneBy({
            zip_code: zipCode,
        });

        if (existing) return existing;

        for (const provider of this.dataProviders) {
            const data = await provider.getData(zipCode);
            if (data) {
                const newAddress = await this.create(data);
                return newAddress;
            }
        }

        throw new NotFoundException('Invalid or unavailable zip code');
    }

}
