import { createHash } from 'crypto';
import { ProductDocument } from '../product.document';
import { ProductPriceArtifact } from './product-price.artifact';
import { VariantPriceArtifact } from './variant-price.artifact';

export class PriceHistoryArtifact {
    public createdAt: Date;
    public productPriceArtifact: ProductPriceArtifact;
    public variantPriceArtifacts: VariantPriceArtifact[];

    constructor(options: any) {
        this.createdAt = options?.createdAt || new Date();
        this.productPriceArtifact = options?.productPriceArtifact ? new ProductPriceArtifact(options?.productPriceArtifact) : null;
        this.variantPriceArtifacts = (options?.variantPriceArtifacts || []).map((item) => new VariantPriceArtifact(item));
    }

    public static async build(product: ProductDocument): Promise<PriceHistoryArtifact> {
        await product.loadVariants();

        const productPriceHistoryArtifact = await ProductPriceArtifact.build(product);
        const variantPriceHistoryArtifacts = [];

        for (const variant of product.variants) {
            const artifact = await VariantPriceArtifact.build(variant);

            variantPriceHistoryArtifacts.push(artifact);
        }

        return new PriceHistoryArtifact({
            createdAt: null,
            productPriceArtifact: productPriceHistoryArtifact,
            variantPriceArtifacts: variantPriceHistoryArtifacts
        });
    }

    public createChecksum() {
        const data = JSON.stringify({
            p: this.productPriceArtifact ? this.productPriceArtifact.createChecksum() : null,
            v: this.variantPriceArtifacts.map((item) => item ? item.createChecksum() : null)
        });

        return createHash('sha1').update(data).digest('hex');
    }
}
