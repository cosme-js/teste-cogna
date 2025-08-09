export class ResponseDTO<T = any> {
    message?: string;
    data?: T;
    status?: number;

    constructor(dataOrMessage: string | T, status?: number) {
        if (typeof dataOrMessage === 'string') {
            this.message = dataOrMessage;
        } else { 
            this.data = dataOrMessage;
        }

        this.status = status;
    }
}
