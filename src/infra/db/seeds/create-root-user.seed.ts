import { PasswordHelper } from '@helpers/password.helper';
import { AddressService } from '@modules/address/address.service';
import { User, UserRole } from '@modules/users/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CreateAdminUserSeed {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly addressService: AddressService,
        private readonly passwordHelper: PasswordHelper
    ) { }

    async seedUsers() {
        console.log("Running seed of create user admin")
        const email = 'admin@example.com';

        const userExist = await this.userRepository.existsBy({ email });

        if (userExist) return;

        let address = await this.addressService.create({
            city: "São Miguel",
            region: "RN",
            street: "Nilton Negreiro",
            zip_code: "5992000",
            neighborhood: "Vista Alegre"
        })
        const password = await this.passwordHelper.hashPassword('$M+n}8c0@X4n');

        const user = this.userRepository.create({ name: 'Admin', email: email, password: password, address, role: UserRole.ADMIN })

        await this.userRepository.save(user);
        console.log('Users seeded!');
    }

    async runSeeds() {
        await this.seedUsers();
    }
}
