import { Module } from '@nestjs/common';
import { AddressStorageService } from './address-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressStorage } from './address-storage.entity';
import { HttpModule } from '@nestjs/axios';
import { DATA_PROVIDERS_TOKEN, IDataProvider } from './interfaces/data.provider.interface';
import { CreateAddressStorageDto } from './dto/create-address-storage.dto';
import { ViaCepDataProvider } from './providers/via-cep.provider';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([AddressStorage])],
    providers: [AddressStorageService,
        ViaCepDataProvider,
        {
            provide: DATA_PROVIDERS_TOKEN,
            useFactory: (...providers: IDataProvider<CreateAddressStorageDto>[]) => providers,
            inject: [ViaCepDataProvider],
        }
    ],
    exports: [AddressStorageService]
})
export class AddressStorageModule { }
