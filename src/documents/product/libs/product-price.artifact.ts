import { createHash } from 'crypto';
import { ProductDocument } from '../product.document';

export class ProductPriceArtifact {
    public minPrice: number;
    public maxPrice: number;
    public minGrossPrice: number;
    public maxGrossPrice: number;

    constructor(options: any) {
        this.minPrice = options?.minPrice;
        this.maxPrice = options?.maxPrice;
        this.minGrossPrice = options?.minGrossPrice;
        this.maxGrossPrice = options?.maxGrossPrice;
    }

    public static async build(product: ProductDocument): Promise<ProductPriceArtifact> {
        await product.loadVariants();

        return new ProductPriceArtifact({
            minPrice: product.minPrice,
            maxPrice: product.maxPrice,
            minGrossPrice: product.minGrossPrice,
            maxGrossPrice: product.maxGrossPrice
        });
    }

    public createChecksum() {
        const data = JSON.stringify({
            mip: this.minPrice,
            map: this.maxPrice,
            migp: this.minGrossPrice,
            magp: this.maxGrossPrice
        });

        return createHash('sha1').update(data).digest('hex');
    }
}
