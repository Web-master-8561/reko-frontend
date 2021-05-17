export class TaxRatePresenter {
    public rate: number;
    public shipping: boolean;

    constructor(options?: any) {
        this.rate = options?.rate || 0;
        this.shipping = options?.shipping ?? true;
    }

    public multiply(price: number): number {
        return price * (1 + this.rate);
    }

    public divide(price: number): number {
        return price / (1 + this.rate);
    }

    public multiplyShipping(price: number): number {
        if (!this.shipping) {
            return price;
        }

        return this.multiply(price);
    }
}
