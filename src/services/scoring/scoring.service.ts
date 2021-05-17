import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { Repository } from '@kifly/beagle/modules/boxer/repository/repository';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ScoringLogDocument } from '../../documents/scoring-log.document';
import { CategoryService } from '../category.service';
import { CheckoutService } from '../checkout.service';
import { OrderService } from '../order.service';
import { ProductService } from '../product.service';
import { VariantService } from '../variant.service';
import { VendorService } from '../vendor.service';

/**
 * Available events:
 * ** PLEASE UPDATE THIS LIST **
 *
 * VARIANT_ADD_TO_CART
 * VARIANT_REMOVE_FROM_CART
 * VISIT_CATEGORY
 * CHECKOUT
 * ORDER
 * VISIT_PRODUCTS
 * VISIT_PRODUCT
 *
 */

@injectable()
export class ScoringService {
    @inject()
    public connection: Connection;

    // @ts-ignore
    public repository = new Repository<ScoringLogDocument>(ScoringLogDocument, this.connection);

    @inject()
    public productService: ProductService;

    @inject()
    public variantService: VariantService;

    @inject()
    public vendorService: VendorService;

    @inject()
    public categoryService: CategoryService;

    @inject()
    public checkoutService: CheckoutService;

    @inject()
    public orderService: OrderService;

    public async emit(eventName: string, payload: any): Promise<void> {
        const instance = new ScoringLogDocument();

        instance.type = eventName;
        instance.payload = payload;

        return instance.save();
    }

    public async processLog(log: ScoringLogDocument): Promise<void> {
        switch (log.type) {
            case 'VISIT_PRODUCT':
                return this.visitProduct(log.payload);
            case 'VARIANT_ADD_TO_CART':
                return this.variantAddToCart(log.payload);
            case 'VARIANT_REMOVE_FROM_CART':
                return this.variantRemoveFromCart(log.payload);
            case 'CHECKOUT':
                return this.checkoutCart(log.payload);
            case 'ORDER':
                return this.orderCheckout(log.payload);
            default:
                console.log('Nothing to process');
        }
    }

    private async orderCheckout(id) {
        const order = await this.orderService.orderRepository.findById(id, { scope: DefaultScope });

        if (!order) {
            return;
        }

        for (const item of order.items) {
            const variant = await this.variantService.variantRepository.findById(item.variantArtifact?._id, { scope: DefaultScope });

            variant.scoring.popularity = (variant.scoring.popularity || 0) + 24;

            await variant.save();
        }
    }

    private async checkoutCart(id) {
        const cart = await this.checkoutService.checkoutRepository.findById(id, { scope: DefaultScope });

        if (!cart) {
            return;
        }

        for (const item of cart.items) {
            item.variant.scoring.popularity = (item.variant.scoring.popularity || 0) + 12;

            await item.variant.save();
        }
    }

    private async variantAddToCart(id) {
        const item = await this.variantService.variantRepository.findById(id, { scope: DefaultScope });

        if (!item) {
            return;
        }

        item.scoring.popularity = (item.scoring.popularity || 0) + 4;

        await item.save();

        const product = await this.productService.findByVariant(item);

        for (const category of product?.categories || []) {
            await this.visitCategory(category?._id || category);
        }
    }

    private async variantRemoveFromCart(id) {
        const item = await this.variantService.variantRepository.findById(id, { scope: DefaultScope });

        if (!item) {
            return;
        }

        item.scoring.popularity = (item.scoring.popularity || 0) + 0.1;

        await item.save();
    }

    private async visitProduct(id) {
        const item = await this.productService.productRepository.findById(id, { scope: DefaultScope });

        if (!item) {
            return;
        }

        item.scoring.popularity = (item.scoring.popularity || 0) + 1;

        await item.save();
    }

    private async visitCategory(id, indirect = false) {
        // Nem ezek alapján az események alapján fogom elszámolni egy kategória népszerűségét, hanem a bele tartozó temékek alapján
    }
}
