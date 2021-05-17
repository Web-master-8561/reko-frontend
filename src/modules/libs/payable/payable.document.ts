import { Base, BaseDocument } from '@kifly/boxer/src/document/base.document';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { IsDefined, IsNumber } from 'class-validator';
import { Fulfillment } from './libs/fulfillment';
import { PayableItem } from './libs/payable-type';

export enum PayableStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    UNPAID = 'UNPAID',
    SHIPPED = 'SHIPPED',
    DECLINED = 'DECLINED',
    COMPLETED = 'COMPLETED',
}

export interface Payable extends Base {
    price?: number;
    remainingPrice?: number;
    paymentType?: string;
    items?: PayableItem[];
}

@document({
    collection: 'payable',
    indices: [
        { fieldOrSpec: { price: 1 } },
        { fieldOrSpec: { remainingPrice: 1 } },
        { fieldOrSpec: { paymentType: 1 } }
    ]
})
export class PayableDocument<T extends Payable> extends BaseDocument<T> {
    @IsNumber()
    @IsDefined({ message: 'required' })
    @property()
    public payablePrice: number;

    @IsNumber()
    @IsDefined({ message: 'required' })
    @property()
    public payableRemainingPrice: number;

    @IsDefined({ message: 'required' })
    @property()
    public payableFulfillment: Fulfillment[] = [];

    @IsDefined({ message: 'required' })
    @property()
    public payableItems: PayableItem[] = [];

    @property()
    public payableAdditionalItems: PayableItem[] = [];

    @property()
    public payableStatus: PayableStatus;

    @property()
    public payableStatusReason: any[];

    @IsDefined({ message: 'required' })
    @property()
    public payableType: string;

    @IsDefined({ message: 'required' })
    @property()
    public currency: string;

    @property()
    public payedAt: Date;

    @property()
    public unpayedAt: Date;

    @property()
    public shippedAt: Date;

    @property()
    public completedAt: Date;

    @property()
    public declinedAt: Date;

    @afterLoad()
    @beforeCreate()
    @beforeUpdate()
    public async calculatePrices() {
        this.payableStatus = this.payableStatus ?? PayableStatus.PENDING;
        this.payableAdditionalItems = this.payableAdditionalItems ?? [];
        this.payableRemainingPrice = await this.getRemainingPrice();
        this.payablePrice = await this.getPrice();
    }

    public addPayableStatusReason(reason: any) {
        this.payableStatusReason = this.payableStatusReason || [];

        this.payableStatusReason.push({
            status: this.payableStatus,
            createdAt: new Date(),
            reason: reason
        });
    }

    public addFulfillment(ack: Fulfillment): void {
        this.payableFulfillment.push(ack);
    }

    /**
     * Override this method
     */
    public async getPrice(): Promise<number> {
        return this.payableItems.reduce((accumulator, item) => accumulator + (item.amount * item.price), 0);
    }

    public async getAdditionalPrice(): Promise<number> {
        return this.payableAdditionalItems.reduce((accumulator, item) => accumulator + (item.amount * item.price), 0);
    }

    public async getRemainingPrice(): Promise<number> {
        const price = await this.getPrice();
        const additionalPrice = await this.getAdditionalPrice();
        const fulfillmentAmount = await this.getFulfillmentAmount();

        return (price + additionalPrice) - fulfillmentAmount;
    }

    public async getFulfillmentAmount(): Promise<number> {
        return this.payableFulfillment.reduce((accumulator, item) => (item.countable ? (accumulator + item.amount) : accumulator), 0);
    }

    public getTransaction(payload: any = {}) {
        return {};
    }
}
