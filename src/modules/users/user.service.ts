import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { AddressStorageService } from '@modules/address-storage/address-storage.service';
import { AddressService } from '@modules/address/address.service';
import { PasswordHelper } from '@helpers/password.helper';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { PaginatedResponse } from '@common/interfaces/list.response.interface';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly addressStorageService: AddressStorageService,
        private readonly addressService: AddressService,
        private readonly passwordHelper: PasswordHelper
    ) { }

    async create({ email, zipCode, password, ...data }: CreateUserDTO): Promise<User> {
        const existingUser = await this.userRepository.existsBy({ email });

        if (existingUser) throw new ConflictException("User with this email already exists");

        const addressFromStorage = await this.addressStorageService.getByZipCode(zipCode);
        const address = await this.addressService.create({ ...addressFromStorage });

        const passwordHashed = await this.passwordHelper.hashPassword(password)

        let newUser = this.userRepository.create({ ...data, email, address, password: passwordHashed });

        newUser = await this.userRepository.save(newUser);

        delete newUser.password
        delete newUser.role;

        return newUser;
    }

    async getAll(pagination?: PaginationDTO): Promise<PaginatedResponse<User>> {
        const { page = 1, limit = 10 } = pagination ?? {};
        const [data, total] = await this.userRepository.findAndCount({
            relations: ['address'],
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'ASC' },
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async getById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['address'] });
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);
        return user;
    }

    async getByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email }, select: ['password', 'name', 'id', 'email', 'created_at', 'role']
        });
    }

    async update(id: string, data: Partial<CreateUserDTO>): Promise<boolean> {

        if (data.password) delete data.password;

        const user = await this.userRepository.findOne({ where: { id }, relations: ['address'] });
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);

        if (data.email && data.email !== user.email) {
            const emailExists = await this.userRepository.existsBy({ email: data.email });
            if (emailExists) throw new ConflictException("User with this email already exists");
            user.email = data.email;
        }

        if (data.zipCode && data.zipCode !== user.address?.zip_code) {
            const addressFromStorage = await this.addressStorageService.getByZipCode(data.zipCode);
            const address = await this.addressService.create({ ...addressFromStorage });
            user.address = address;
        }

        const userUpdated = this.userRepository.merge(user, data);

        await this.userRepository.update({ id }, userUpdated);

        return true;
    }

    async updatePassword(id: string, data: UpdatePasswordDTO): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id }, select: ['id', 'password'] }) as any;

        if (!user) throw new NotFoundException(`User not found with ID ${id}`);

        if (!(await this.passwordHelper.comparePassword(data.oldPassword, (user.password as any))))
            throw new BadRequestException('Wrong password!');

        const newPassword = await this.passwordHelper.hashPassword(data.newPassword);

        await this.userRepository.update({ id }, { password: newPassword })
    }

    async delete(id: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);

        await this.userRepository.remove(user);
    }
}
