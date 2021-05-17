import { InternalServerError } from '@kifly/beagle/modules/express/errors';
import { get } from 'lodash';
import { OrderDocument } from '../../../documents/order/order.document';
import { PaymentTypeHandler } from '../../../modules/libs/payable/libs/payment-type.handler';

export interface OnlinePaymentTypeHandlerExecuteOptions {
    provider: string;
}

export class OnlinePaymentTypeHandler extends PaymentTypeHandler {
    constructor(config: OnlinePaymentTypeHandlerExecuteOptions) {
        super(config);
    }

    public async execute(payable: OrderDocument, options: any): Promise<any> {
        const transactionPayload = await payable.getTransaction();
        const transactionType = payable.payableType;
        const providerConfig = get(payable.vendorArtifact, 'providerPayload[payable.payableType]');

        if (!transactionPayload) {
            throw new InternalServerError('MalformedTransactionPayload');
        }

        if (!transactionType) {
            throw new InternalServerError('MalformedTransactionType');
        }

        if (!providerConfig) {
            // throw new InternalServerError('MissingOrMalformedProviderConfig');
        }

        const response = await this.paymentService.createPayment(
            transactionType,
            transactionPayload,
            providerConfig
        );

        // In this case there is nothing to do, because we are just waiting for incoming transfer
        return { payable, credentials: response };
    }
}
