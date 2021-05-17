import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Adapter } from '@kifly/beagle/modules/codebuild/libs/adapter';

@injectable()
export class PaymentService extends Adapter {
    public createPayment(transactionType: string, transactionPayload: any, providerPayload: any) {
        return this.request('post', '/payment', {
            ...transactionPayload,
            provider: transactionType,
            providerPayload: providerPayload
        });
    }
}
