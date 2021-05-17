import { Provider } from '@kifly/beagle/core/application/base-application';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Unauthorized } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { UserService } from '../services/user/user.service';
import { VendorService } from '../services/vendor.service';
import { BaseController } from './libs/base-controller';
import { VendorAttributeController } from './vendor/vendor-attribute.controller';
import { VendorOrderController } from './vendor/vendor-order.controller';
import { VendorProductController } from './vendor/vendor-product.controller';
import { VendorVariantController } from './vendor/vendor-variant.controller';
import { VendorVendorController } from './vendor/vendor-vendor.controller';

@injectable()
export class VendorController extends BaseController {
    @inject()
    public vendorService: VendorService;

    @inject()
    public userService: UserService;

    @inject()
    public vendor: VendorVendorController;

    @inject()
    public product: VendorProductController;

    @inject()
    public variant: VendorVariantController;

    @inject()
    public order: VendorOrderController;

    @inject()
    public attribute: VendorAttributeController;

    public static providers = (config: any): Provider[] => [
        { injectable: VendorVariantController, options: config },
        { injectable: VendorProductController, options: config },
        { injectable: VendorVendorController, options: config },
        { injectable: VendorOrderController, options: config },
        { injectable: VendorAttributeController, options: config },
        { injectable: VendorController, options: config }
    ];

    @onInit()
    public initialize() {
        this.middleware.use('/:id', this.isVendorOwner.bind(this));
        this.middleware.use('/:id/*', this.isVendorOwner.bind(this));

        this.json.get('/:id', this.show.bind(this));

        this.app.use('/:id/attribute', this.attribute.app);
        this.app.use('/:id/vendor', this.vendor.app);
        this.app.use('/:id/product', this.product.app);
        this.app.use('/:id/variant', this.variant.app);
        this.app.use('/:id/order', this.order.app);
    }

    public async isVendorOwner(req: Request) {
        const user = await this.extractUser(req, (req) => req.headers.user);
        const vendor = await this.extractVendor(req, (req) => req.params.id);

        if (!user.isOwnerOfVendor(vendor)) {
            throw new Unauthorized('PermissionDeniedVendor');
        }
    }

    public async show(req: Request) {
        const vendor = this.getRequestVendor(req);

        return vendor.readAsAdmin();
    }
}
