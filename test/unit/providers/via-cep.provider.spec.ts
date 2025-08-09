import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ViaCepDataProvider } from '@modules/address-storage/providers/via-cep.provider';

describe('ViaCepDataProvider', () => {
    let service: ViaCepDataProvider;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ViaCepDataProvider,
                {
                    provide: HttpService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ViaCepDataProvider>(ViaCepDataProvider);
        httpService = module.get<HttpService>(HttpService);
    });

    it('should return address data when API returns valid response', async () => {
        const zipCode = '01001000';

        const apiResponse = {
            data: {
                cep: '01001-000',
                logradouro: 'Praça da Sé',
                bairro: 'Sé',
                localidade: 'São Paulo',
                uf: 'SP',
            },
        };

        (httpService.get as jest.Mock).mockReturnValue(of(apiResponse));

        const result = await service.getData(zipCode);

        expect(httpService.get).toHaveBeenCalledWith(`https://viacep.com.br/ws/${zipCode}/json/`);
        expect(result).toEqual({
            zip_code: '01001000',
            street: 'Praça da Sé',
            neighborhood: 'Sé',
            city: 'São Paulo',
            region: 'SP',
        });
    });

    it('should return null when API returns error property true', async () => {
        const zipCode = '00000000';

        const apiResponse = {
            data: {
                erro: true,
            },
        };

        (httpService.get as jest.Mock).mockReturnValue(of(apiResponse));

        const result = await service.getData(zipCode);

        expect(result).toBeNull();
    });

    it('should return null when httpService.get throws an error', async () => {
        const zipCode = '12345678';

        (httpService.get as jest.Mock).mockReturnValue(throwError(() => new Error('Network error')));

        const result = await service.getData(zipCode);

        expect(result).toBeNull();
    });
});
