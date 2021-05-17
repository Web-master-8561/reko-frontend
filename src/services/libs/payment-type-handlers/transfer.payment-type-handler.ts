import { PaymentTypeHandler } from '../../../modules/libs/payable/libs/payment-type.handler';
import { PayableDocument, PayableStatus } from '../../../modules/libs/payable/payable.document';

export class TransferPaymentTypeHandler extends PaymentTypeHandler {
    public async execute(payable: PayableDocument<any>, options: any): Promise<any> {
        payable.payableStatus = PayableStatus.PAID;
        await payable.save();

        // In this case there is nothing to do, because we are just waiting for incoming transfer
        return { payable, credentials: null };
    }
}
