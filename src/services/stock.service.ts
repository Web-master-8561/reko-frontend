import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { CartDocument } from '../documents/order/cart.document';
import { CheckoutDocument } from '../documents/order/checkout.document';
import { Variant, VariantDocument } from '../documents/product/variant.document';

@injectable()
export class StockService {
    public async isVariantsAvailableOnStockByCart(cart: CartDocument): Promise<boolean> {
        for (const item of cart.items) {
            const isAvailable = await this.isVariantAvailableOnStock(item.variant, item.amount);

            if (!isAvailable) {
                return false;
            }
        }

        return true;
    }

    public async isVariantsAvailableOnStockByCheckout(checkout: CheckoutDocument): Promise<boolean> {
        for (const item of checkout.items) {
            const isAvailable = await this.isVariantAvailableOnStock(item.variant, item.amount);

            if (!isAvailable) {
                return false;
            }
        }

        return true;
    }

    public async getOutOfStockVariantsByCart(cart: CartDocument): Promise<Variant[]> {
        const vs = [];

        for (const item of cart.items) {
            const isAvailable = await this.isVariantAvailableOnStock(item.variant, item.amount);

            if (!isAvailable) {
                vs.push(item.variant);
            }
        }

        return vs;
    }

    public async getOutOfStockVariantsByCheckout(checkout: CheckoutDocument): Promise<Variant[]> {
        const vs = [];

        for (const item of checkout.items) {
            const isAvailable = await this.isVariantAvailableOnStock(item.variant, item.amount);

            if (!isAvailable) {
                vs.push(item.variant);
            }
        }

        return vs;
    }

    public async isVariantAvailableOnStock(variant: VariantDocument, amount: number): Promise<boolean> {
        if (!variant.stockEnabled) {
            return true;
        }

        return variant.stock >= amount;
    }

    public async removeVariantsStockByCheckout(checkout: CheckoutDocument) {
        const isAvailableOnStock = await this.isVariantsAvailableOnStockByCheckout(checkout);

        if (!isAvailableOnStock) {
            throw new BadRequest('OutOfStock');
        }

        for (const item of checkout.items) {
            await this.removeVariantStock(item.variant, item.amount);
        }
    }

    public async removeVariantStock(variant: VariantDocument, amount: number) {
        const isAvailableOnStock = await this.isVariantAvailableOnStock(variant, amount);

        if (!isAvailableOnStock) {
            throw new BadRequest('OutOfStock');
        }

        variant.removeStock(amount);

        await variant.save();
    }

    public async addVariantStock(variant: VariantDocument, amount: number) {
        // TODO -> There is a possible leak to make stock bad! User can use a negative amount value to fuck proper stock
        // TODO -> Maybe i should fix it with a Math.abs ? Maybe, i am not sure

        variant.addStock(amount);

        await variant.save();
    }

    public async setVariantStock(variant: VariantDocument, stock: number) {
        variant.stock = stock;

        await variant.save();
    }
}
