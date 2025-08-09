import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateAddressStorageDto } from '../dto/create-address-storage.dto';
import { IDataProvider } from '../interfaces/data.provider.interface';


@Injectable()
export class ViaCepDataProvider implements IDataProvider<CreateAddressStorageDto> {
    constructor(private readonly httpService: HttpService) { }

    async getData(zipCode: string): Promise<CreateAddressStorageDto | null> {
        try {
            const url = `https://viacep.com.br/ws/${zipCode}/json/`;
            const response = await firstValueFrom(this.httpService.get(url));
            const data = (response as any).data;

            if (data.erro) return null;

            return {
                zip_code: data.cep.replace('-', ''),
                street: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                region: data.uf,
            };
        } catch {
            return null;
        }
    }
}