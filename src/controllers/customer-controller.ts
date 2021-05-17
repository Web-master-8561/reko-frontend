import { Provider } from '@kifly/beagle/core/application/base-application';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Unauthorized } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { CustomerAddressController } from './customer/customer-address.controller';
import { CustomerCustomerController } from './customer/customer-customer.controller';
import { CustomerLegalController } from './customer/customer-legal.controller';
import { CustomerOrderController } from './customer/customer-order.controller';
import { CustomerVendorController } from './customer/customer-vendor.controller';
import { BaseController } from './libs/base-controller';

@injectable()
export class CustomerController extends BaseController {
    @inject()
    public vendor: CustomerVendorController;

    @inject()
    public legal: CustomerLegalController;

    @inject()
    public customer: CustomerCustomerController;

    @inject()
    public address: CustomerAddressController;

    @inject()
    public order: CustomerOrderController;

    public static providers = (config: any): Provider[] => [
        { injectable: CustomerCustomerController, options: config },
        { injectable: CustomerLegalController, options: config },
        { injectable: CustomerVendorController, options: config },
        { injectable: CustomerController, options: config },
        { injectable: CustomerAddressController, options: config },
        { injectable: CustomerOrderController, options: config }
    ];

    @onInit()
    public initialize() {
        this.middleware.use('/*', this.isUser.bind(this));
        this.app.use('/legal', this.legal.app);

        this.middleware.use('/*', this.isLegalUser.bind(this));
        this.app.use('/vendor', this.vendor.app);
        this.app.use('/customer', this.customer.app);
        this.app.use('/address', this.address.app);
        this.app.use('/order', this.order.app);
    }

    private async isLegalUser(req: Request) {
        const user = await this.extractUser(req, (req) => req.headers.user);

        if (!user.isLegal()) {
            const reasons = user.getIllegalityReason();

            throw new Unauthorized('IllegalUser', {
                reasons: reasons
            });
        }
    }

    private async isUser(req: Request) {
        await this.extractUser(req, (req) => req.headers.user);
    }
}
