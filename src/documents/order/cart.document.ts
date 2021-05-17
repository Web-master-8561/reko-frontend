import { document } from '@kifly/boxer/src/document/decorators/document';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { IsDefined } from 'class-validator';
import { compact } from 'lodash';
import { VariantDocument } from '../product/variant.document';
import { Cartable, CartableDocument } from './libs/cartable.document';

export interface Cart extends Cartable {
    identifier?: string;
}

@document({
    collection: 'cart',
    indices: [
        {
            fieldOrSpec: {
                vendor: 1,
                identifier: 1
            },
            options: {
                unique: true,
                partialFilterExpression: {
                    hidden: false
                }
            }
        }
    ]
})
export class CartDocument extends CartableDocument<Cart> {
    @IsDefined({ message: 'required' })
    @property()
    public identifier: string;

    public addItem(variant: VariantDocument, amount: number) {
        this.items = compact(this.items);

        const id = variant._id?.toString();
        const indexOfItem = this.items.findIndex((item) => (item.variant?._id?.toString() === id));

        if (indexOfItem === -1) {
            if (amount <= 0) {
                return;
            }

            this.items.push({
                variant: variant as any,
                amount: amount
            });

            return;
        }

        const newAmount = this.items[indexOfItem].amount + amount;

        if (newAmount <= 0) {
            this.items = this.items.filter((i, index) => (index !== indexOfItem));

            return;
        }

        this.items[indexOfItem].amount = newAmount;
    }

    public setItem(variant: VariantDocument, amount: number) {
        this.items = compact(this.items);

        const id = variant._id?.toString();
        const indexOfItem = this.items.findIndex((item) => (item.variant?._id?.toString() === id));

        if (indexOfItem === -1) {
            if (amount <= 0) {
                return;
            }

            this.items.push({
                variant: variant as any,
                amount: amount
            });

            return;
        }

        this.items[indexOfItem].amount = Math.max(0, amount);
    }

    public amountOfVariant(variant: VariantDocument) {
        return this.items.reduce((acc, item) => {
            if (item.variant._id.toString() !== variant._id.toString()) {
                return acc;
            }

            return acc + item.amount;
        }, 0);
    }
}
