import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { BadRequest, Forbidden, InternalServerError, NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ProductService } from '../../services/product.service';
import { VariantService } from '../../services/variant.service';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class VendorVariantController extends BaseController {
    @inject()
    public vendor: VendorService;

    @inject()
    public variant: VariantService;

    @inject()
    public product: ProductService;

    @onInit()
    public initialize() {
        this.json.post('/', this.create.bind(this));
        this.json.get('/:variant', this.show.bind(this));
        this.json.put('/:variant', this.update.bind(this));
    }

    public async create(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        if (req.body.title === undefined) {
            throw new BadRequest('MissingTitle');
        }

        if (req.body.description === undefined) {
            throw new BadRequest('MissingDescription');
        }

        if (req.body.grossPrice === undefined) {
            throw new BadRequest('MissingGrossPrice');
        }

        if (req.body.discountGrossPrice === undefined) {
            throw new BadRequest('MissingDiscountGrossPrice');
        }

        return this.variant.create(req.body);
    }

    public async update(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        const variant = await this.extractVariant(req);

        return this.variant.update(variant, req.body);
    }

    public async show(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        return this.extractVariant(req);
    }

    private async extractVariant(req: Request) {
        const variant = await this.variant.variantRepository.findById(req.params.variant, {
            scope: ArchiveScope
        });

        if (!variant) {
            throw new NotFound('UnknownVariant');
        }

        const user = this.getRequestUser(req);
        const vendor = this.getRequestVendor(req);

        const product = await this.product.findByVariant(variant, {
            scope: DefaultScope
        });

        if (!product) {
            throw new BadRequest('UnassociatedVariant');
        }

        await product.loadVendor();

        if (!product.vendor) {
            throw new InternalServerError('UnassociatedProduct');
        }

        if (vendor._id.toString() !== product.vendor._id.toString()) {
            throw new Forbidden('PermissionDeniedVariant');
        }

        if (!user.isOwnerOfVendor(product.vendor)) {
            throw new Forbidden('PermissionDeniedVariant');
        }

        return variant;
    }
}
