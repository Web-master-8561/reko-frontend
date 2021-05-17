import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { InternalServerError } from '@kifly/beagle/modules/express/errors';
import { PaymentService } from '../../../services/payment/payment.service';
import { PaymentTypeHandler } from './libs/payment-type.handler';
import { PayableDocument } from './payable.document';

export interface PayableServiceOptions {
    handlers: Record<string, PaymentTypeHandler>;
}

@injectable()
export class PayableService {
    @inject()
    public paymentService: PaymentService;

    public paymentTypeHandlers: Record<string, PaymentTypeHandler> = {};

    constructor(options: PayableServiceOptions) {
        this.paymentTypeHandlers = options?.handlers ?? {};

        for (const key of Object.keys(this.paymentTypeHandlers)) {
            this.paymentTypeHandlers[key].setPaymentService(this.paymentService);
        }
    }

    @onInit()
    public initialize() {
        for (const key of Object.keys(this.paymentTypeHandlers)) {
            this.paymentTypeHandlers[key].setService(this);
        }
    }

    public isPaymentTypeAvailable(type: string): boolean {
        return !!this.paymentTypeHandlers[type];
    }

    public execute(payable: PayableDocument<any>, options: any = {}) {
        const handler = this.paymentTypeHandlers[payable.payableType];

        if (!handler) {
            throw new InternalServerError('UnknownPaymentTypeHandler');
        }

        return handler.execute(payable, options);
    }
}
