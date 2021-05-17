import { createHash } from 'crypto';
import { VariantDocument } from '../variant.document';

export class VariantPriceArtifact {
    // tslint:disable-next-line
    public _id: string;
    public price: number;
    public grossPrice: number;
    public discount: number;

    constructor(options: any) {
        this._id = options?._id;
        this.price = options?.price;
        this.grossPrice = options?.grossPrice;
        this.discount = options?.discount;
    }

    public static async build(variant: VariantDocument): Promise<VariantPriceArtifact> {
        return new VariantPriceArtifact({
            _id: variant._id,
            price: variant.price,
            grossPrice: variant.grossPrice,
            discount: variant.discountRate
        });
    }

    public createChecksum() {
        const data = JSON.stringify({
            _id: this._id,
            p: this.price,
            gp: this.grossPrice,
            d: this.discount
        });

        return createHash('sha1').update(data).digest('hex');
    }
}
