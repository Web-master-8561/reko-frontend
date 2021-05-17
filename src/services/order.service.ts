import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { ObjectId } from 'bson';
import { randomBytes } from 'crypto';
import * as moment from 'moment';
import { CheckoutDocument } from '../documents/order/checkout.document';
import { OrderDocument } from '../documents/order/order.document';
import { VendorDocument } from '../documents/vendor/vendor.document';
import { ArchiveRepository } from '../libs/repository/archive.repository';
import { PaymentTypeHandlerExecute } from '../modules/libs/payable/libs/payment-type.handler';
import { PayableStatus } from '../modules/libs/payable/payable.document';
import { PayableService } from '../modules/libs/payable/payable.service';
import { OrderConnector } from './connectors/order-connector';
import { StockService } from './stock.service';

@injectable()
export class OrderService extends PayableService {
    @inject()
    public connection: Connection;

    @inject()
    public occService: OrderConnector;

    @inject()
    public stockService: StockService;

    // @ts-expect-error
    public orderRepository = new ArchiveRepository<OrderDocument | any>(OrderDocument, this.connection);

    public async createOrder(checkout: CheckoutDocument, currency: string, userId: string): Promise<PaymentTypeHandlerExecute> {
        if (!checkout.orderable) {
            throw new BadRequest('UnorderableCheckout');
        }

        const isAvailable = await this.stockService.isVariantsAvailableOnStockByCheckout(checkout);

        if (!isAvailable) {
            const outOfStockVariants = await this.stockService.getOutOfStockVariantsByCheckout(checkout);

            throw new BadRequest('OutOfStock', outOfStockVariants);
        }

        await checkout.populate([
            { path: 'cart' },
            { path: 'vendor' }
        ]);

        const instance = new OrderDocument();

        for (const index in checkout.items) {
            instance.payableItems[index] = {} as any;
            instance.payableItems[index].amount = checkout.items[index].amount;
            instance.payableItems[index].variantArtifact = checkout.items[index].variant.getArtifact();
            instance.payableItems[index].productArtifact = checkout.items[index].product.getArtifact();
            instance.payableItems[index].price = instance.payableItems[index].variantArtifact.price * instance.payableItems[index].amount;
        }

        instance.identifier = await this.getNextOrderIdentifier(checkout.vendor);
        instance.email = checkout.email;
        instance.payableType = checkout.paymentType;
        instance.vendorArtifact = checkout.vendor.getArtifact();
        instance.personalInfoArtifact = checkout.personalInfo;
        instance.companyInfoArtifact = checkout.companyInfo;
        instance.shippingAddressArtifact = checkout.shippingAddress;
        instance.billingAddressArtifact = checkout.billingAddress;
        instance.currency = checkout.vendor.defaultCurrency;
        instance.user = userId;

        await instance.save();

        const execResponse = await this.execute(instance);

        await instance.save();

        await this.stockService.removeVariantsStockByCheckout(checkout);

        await this.occService.orderCreated$.build({
            order: instance,
            checkout: checkout
        });

        return execResponse;
    }

    public async decline(order: OrderDocument, reason: any = null) {
        order.payableStatus = PayableStatus.DECLINED;
        order.addPayableStatusReason(reason);
        order.declinedAt = new Date();

        return order.save();
    }

    public async paid(order: OrderDocument, reason: any = null) {
        order.payableStatus = PayableStatus.PAID;
        order.addPayableStatusReason(reason);
        order.payedAt = new Date();

        return order.save();
    }

    public async unpaid(order: OrderDocument, reason: any = null) {
        order.payableStatus = PayableStatus.UNPAID;
        order.addPayableStatusReason(reason);
        order.unpayedAt = new Date();

        return order.save();
    }

    public async shipped(order: OrderDocument, reason: any = null) {
        order.payableStatus = PayableStatus.SHIPPED;
        order.addPayableStatusReason(reason);
        order.shippedAt = new Date();

        return order.save();
    }

    public async completed(order: OrderDocument, reason: any = null) {
        order.payableStatus = PayableStatus.COMPLETED;
        order.addPayableStatusReason(reason);
        order.completedAt = new Date();

        return order.save();
    }

    public async getNextOrderIdentifier(vendor: VendorDocument) {
        const currentNumberOfOrders = await this.orderRepository.count({
            $and: [
                { 'vendorArtifact._id': new ObjectId(vendor._id) },
                { createdAt: { $gte: moment().startOf('day').toDate } }
            ]
        });

        const randomPart = randomBytes(2).toString('hex');

        const datePart = moment().format('YYMMDD');

        return `O-${currentNumberOfOrders + 1}-${datePart}-${randomPart}`;
    }
}
