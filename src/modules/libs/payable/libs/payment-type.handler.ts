import { PaymentService } from '../../../../services/payment/payment.service';
import { PayableDocument } from '../payable.document';
import { PayableService } from '../payable.service';

export interface PaymentTypeHandlerExecute {
    payable: PayableDocument<any>;
    credentials: any;
}

export class PaymentTypeHandler {
    public paymentService: PaymentService;
    public payableService: PayableService;
    public config: any;

    constructor(config: any = {}) {
        this.config = config;
    }

    public setService(service: PayableService) {
        this.payableService = service;
    }

    public setPaymentService(service: PaymentService) {
        this.paymentService = service;
    }

    public async execute(payable: PayableDocument<any>, options: any): Promise<PaymentTypeHandlerExecute> {
        return { payable, credentials: null };
    }
}
