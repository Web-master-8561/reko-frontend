import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { Scope } from '@kifly/boxer/src/scope/scope';
import { ObjectId } from 'bson';
import { ProductDocument } from '../documents/product/product.document';
import { VariantDocument } from '../documents/product/variant.document';

import { ArchiveRepository } from '../libs/repository/archive.repository';
import { VariantProductService } from './connectors/variant-product.service';
import { BaseService } from './libs/base.service';
import { StockService } from './stock.service';

@injectable()
export class VariantService extends BaseService {
    @inject()
    public connection: Connection;

    @inject()
    public variantProductConnector: VariantProductService;

    @inject()
    public stockService: StockService;

    // @ts-expect-error
    public variantRepository = new ArchiveRepository<VariantDocument>(VariantDocument, this.connection);

    @onInit()
    public async initialize() {
        this.variantProductConnector.productNormalize$.register((product) => this.normalizeVariantByProduct(product));
    }

    public async create(data: any = null): Promise<VariantDocument> {
        const instance = new VariantDocument();

        instance.sku = data?.sku;
        instance.title = data?.title;
        instance.description = data?.description;
        instance.grossPrice = data?.grossPrice;
        instance.discountGrossPrice = data?.discountGrossPrice;
        instance.stock = data?.stock;
        instance.image = data?.image;

        const variant = await instance.save();

        if (data?.attributeValues) {
            await this.setAttributeValues(variant, data.attributeValues);
        }

        return variant;
    }

    public async update(variant: VariantDocument, data: any): Promise<VariantDocument> {
        variant.sku = data?.sku ?? variant.sku;
        variant.title = data?.title ?? variant.title;
        variant.description = data?.description ?? variant.description;
        variant.grossPrice = data?.grossPrice ?? variant.grossPrice;
        variant.discountGrossPrice = data?.discountGrossPrice ?? variant.discountGrossPrice;
        variant.stock = data?.stock ?? variant.stock;
        variant.image = data?.image ?? variant.image;

        await variant.save();

        await this.variantProductConnector.variantUpdate$.build(variant);

        if (data?.attributeValues) {
            await this.setAttributeValues(variant, data.attributeValues);
        }

        return variant;
    }

    public getAllByProduct(product: ProductDocument, scope: typeof Scope): Promise<VariantDocument[]> {
        const query: any = { _id: { $in: product.variants.map((item) => new ObjectId(item._id || item as any)) } };
        const options = { scope: scope };

        return this.variantRepository.findMany(query, options);
    }

    public async setAttributeValue(variant: VariantDocument, key: string, value: any) {
        variant.setAttributeValue(key, value);

        await variant.save();

        return this.variantProductConnector.variantUpdateAttributeValues$.build(variant);
    }

    public async setAttributeValues(variant: VariantDocument, values: any) {
        variant.setAttributeValues(values);

        await variant.save();

        return this.variantProductConnector.variantUpdateAttributeValues$.build(variant);
    }

    private async normalizeVariantByProduct(product: ProductDocument) {
        try {
            await product.populate([
                { path: 'variants' }
            ]);

            for (const variant of product.variants) {
                variant.attributes = await product.getVariantAttributes();
                variant.currency = product.currency;
                variant.taxRate = product.taxRate;
                variant.stockEnabled = product.stockEnabled;

                await variant.save();
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
