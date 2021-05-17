import { Provider } from '@kifly/beagle/core/application/base-application';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Unauthorized } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { UserService } from '../services/user/user.service';
import { AdminTaxRateController } from './admin/admin-tax-rate.controller';
import { AdminVendorController } from './admin/admin-vendor.controller';
import { BaseController } from './libs/base-controller';

@injectable()
export class AdminController extends BaseController {
    @inject()
    public vendor: AdminVendorController;

    @inject()
    public taxRate: AdminTaxRateController;

    @inject()
    public user: UserService;

    public static providers = (config: any): Provider[] => [
        { injectable: AdminTaxRateController, options: config },
        { injectable: AdminVendorController, options: config },
        { injectable: AdminController, options: config }
    ]

    @onInit()
    public initialize() {
        this.middleware.use('/*', this.isUserAdminMiddleware.bind(this));

        this.app.use('/vendor', this.vendor.app);
        this.app.use('/tax-rate', this.taxRate.app);
    }

    private async isUserAdminMiddleware(req: Request) {
        const user = await this.extractUser(req, (req) => req.headers.user);

        if (!user.isAdmin()) {
            throw new Unauthorized('PermissionDenied');
        }
    }
}
