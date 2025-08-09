export const DATA_PROVIDERS_TOKEN = 'DATA_PROVIDERS_TOKEN';

export interface IDataProvider<T = any> {
    getData(zipCode: string): Promise<T | null>;
}