import { Provider } from '@kifly/beagle/core/application/base-application';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Controller } from '@kifly/beagle/modules/express/injectables/controller';
import { PaymentController } from './internal/payment.controller';

@injectable()
export class InternalController extends Controller {
    public static providers = (config: any): Provider[] => [
        { injectable: InternalController, options: config },
        { injectable: PaymentController, options: config }
    ];

    @inject()
    public paymentController: PaymentController;

    @onInit()
    public initialize() {
        this.app.use('/payment', this.paymentController.app);
    }
}
