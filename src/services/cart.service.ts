import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { CartDocument } from '../documents/order/cart.document';
import { VariantDocument } from '../documents/product/variant.document';
import { VendorDocument } from '../documents/vendor/vendor.document';
import { ArchiveRepository } from '../libs/repository/archive.repository';
import { OrderConnector } from './connectors/order-connector';
import { ProductService } from './product.service';
import { StockService } from './stock.service';
import { UserService } from './user/user.service';
import { VariantService } from './variant.service';
import { VendorService } from './vendor.service';

@injectable()
export class CartService {
    @inject()
    public userService: UserService;

    @inject()
    public productService: ProductService;

    @inject()
    public variantService: VariantService;

    @inject()
    public vendorService: VendorService;

    @inject()
    public occService: OrderConnector;

    @inject()
    public stockService: StockService;

    @inject()
    public connection: Connection;

    // @ts-expect-error
    public cartRepository = new ArchiveRepository<CartDocument>(CartDocument, this.connection);

    @onInit()
    public initialize() {
        this.occService.orderCreated$.register((payload) => this.handleOrderCreated(payload));
    }

    public async findCart(identifier: string, activeOnly = false): Promise<CartDocument[]> {
        const query: any = {
            $and: [
                { identifier: { $ne: null } },
                { vendor: { $ne: null } },
                { identifier: identifier },
                activeOnly ? { 'items.0': { $exists: true } } : {}
            ]
        };

        return this.cartRepository.findMany(query);
    }

    public async findCartByVendor(identifier: string, vendor?: VendorDocument, activeOnly = false): Promise<CartDocument> {
        const query: any = {
            $and: [
                { identifier: { $ne: null } },
                { vendor: { $ne: null } },
                { identifier: identifier },
                vendor ? { vendor: vendor._id } : {},
                activeOnly ? { 'items.0': { $exists: true } } : {}
            ]
        };

        return this.cartRepository.findOne(query);
    }

    public async addToCart(identifier: string, variant: VariantDocument, amount: number): Promise<any> {
        const product = await this.productService.findByVariant(variant);

        if (!product) {
            throw new BadRequest('UnknownProductVendorRelation');
        }

        await product.populate([
            { path: 'vendor' }
        ]);

        const current = await this.findCartByVendor(identifier, product.vendor);

        const cart = current ? current : await this.create(identifier, product.vendor);

        const isAvailableOnStock = await this.stockService.isVariantAvailableOnStock(variant, amount + cart.amountOfVariant(variant));

        if (!isAvailableOnStock) {
            cart.setItem(variant, variant.stock);
            await cart.save();

            throw new BadRequest('OutOfStock');
        }

        cart.addItem(variant, amount);

        return cart.save();
    }

    public hide(cart: CartDocument) {
        cart.hidden = true;

        return cart.save();
    }

    private create(identifier: string, vendor: VendorDocument): Promise<CartDocument> {
        const instance = new CartDocument();

        instance.identifier = identifier;
        instance.vendor = vendor;
        instance.items = [];

        return instance.save();
    }

    private async handleOrderCreated(payload) {
        await payload.checkout.populate([
            { path: 'cart' }
        ]);

        return this.hide(payload.checkout.cart);
    }
}
