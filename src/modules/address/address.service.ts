import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {

    constructor(@InjectRepository(Address) private readonly addressRepository: Repository<Address>) { }

    async create(data: CreateAddressDto): Promise<Address> {
        const newAddress = this.addressRepository.create(data);

        return this.addressRepository.save(newAddress);
    }

    async getById(id: string): Promise<Address> {
        const addressStorage = await this.addressRepository.findOneBy({ id });

        if (!addressStorage) throw new NotFoundException('There is no address with that zip code');

        return addressStorage;
    }


    async update(id: string, data: UpdateAddressDto): Promise<Address> {
        const addressStorage = await this.getById(id);

        const updated = this.addressRepository.merge(addressStorage, data)

        try {
            await this.addressRepository.update({ id: addressStorage.id }, updated)
        } catch (error) {
            throw new Error("Error when try update an existent address");
        }

        return updated;
    }

}
