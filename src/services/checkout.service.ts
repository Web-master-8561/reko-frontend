import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Address } from '../documents/libs/address';
import { CartDocument } from '../documents/order/cart.document';
import { CheckoutDocument } from '../documents/order/checkout.document';
import { CompanyInfo } from '../documents/order/libs/company-info';
import { PersonalInfo } from '../documents/order/libs/personal-info';
import { ArchiveRepository } from '../libs/repository/archive.repository';
import { OrderConnector } from './connectors/order-connector';
import { StockService } from './stock.service';

export interface CheckoutUpdateData {
    user?: string;
    email: string;
    paymentType: string;
    shippingAddress: Address;
    billingAddress: Address;
    personalInfo?: PersonalInfo;
    companyInfo?: CompanyInfo;
}

@injectable()
export class CheckoutService {
    @inject()
    public connection: Connection;

    @inject()
    public occService: OrderConnector;

    @inject()
    public stockService: StockService;

    // @ts-expect-error
    public checkoutRepository = new ArchiveRepository<CheckoutDocument>(CheckoutDocument, this.connection);

    @onInit()
    public initialize() {
        this.occService.orderCreated$.register((payload) => this.handleOrderCreated(payload));
    }

    public async create(cart: CartDocument): Promise<CheckoutDocument> {
        const isAvailable = await this.stockService.isVariantsAvailableOnStockByCart(cart);

        if (!isAvailable) {
            const outOfStockVariants = await this.stockService.getOutOfStockVariantsByCart(cart);

            throw new BadRequest('OutOfStock', outOfStockVariants);
        }

        const instance = new CheckoutDocument();

        instance.items = cart.items;
        instance.vendor = cart.vendor;
        instance.cart = cart;

        return instance.save(false);
    }

    public update(checkout: CheckoutDocument, data: CheckoutUpdateData) {
        checkout.user = data.user;
        checkout.email = data.email;
        checkout.paymentType = data.paymentType;
        checkout.shippingAddress = data.shippingAddress;
        checkout.billingAddress = data.billingAddress;
        checkout.personalInfo = data.personalInfo;
        checkout.companyInfo = data.companyInfo;

        return checkout.save();
    }

    public hide(checkout: CheckoutDocument) {
        checkout.hidden = true;

        return checkout.save();
    }

    private async handleOrderCreated(payload) {
        return this.hide(payload.checkout);
    }
}
