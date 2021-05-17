import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { FindManyOptions, FindOneOptions } from '@kifly/boxer/src/collections/collection';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ObjectId } from 'bson';
import { kebab } from 'case';
import { AttributeDocument } from '../documents/product/attribute.document';
import { CategoryDocument } from '../documents/product/category.document';
import { ProductActiveBy, ProductDocument } from '../documents/product/product.document';
import { VariantDocument } from '../documents/product/variant.document';
import { VendorActiveBy, VendorDocument } from '../documents/vendor/vendor.document';
import { ArchiveRepository } from '../libs/repository/archive.repository';
import { CategoryProductService } from './connectors/category-product.service';
import { ProductVendorService } from './connectors/product-vendor.service';
import { VariantProductService } from './connectors/variant-product.service';

@injectable()
export class ProductService {
    @inject()
    public connection: Connection;

    @inject()
    public productVendorConnector: ProductVendorService;

    @inject()
    public categoryProductConnector: CategoryProductService;

    @inject()
    public variantProductConnector: VariantProductService;

    // @ts-expect-error
    public productRepository = new ArchiveRepository<ProductDocument>(ProductDocument, this.connection);

    @onInit()
    public initialize() {
        this.productVendorConnector.vendorNormalize$.register((vendor) => this.normalizeByVendor(vendor));
        this.categoryProductConnector.categoryAddAttribute$.register((category) => this.normalizeByCategory(category));
        this.categoryProductConnector.categoryRemoveAttribute$.register((category) => this.normalizeByCategory(category));
        this.variantProductConnector.variantUpdateAttributeValues$.register((variant) => this.normalizeByVariant(variant));
        this.variantProductConnector.variantUpdate$.register((variant) => this.normalizeByVariant(variant));
    }

    public async create(data: any, vendor: VendorDocument, categories: CategoryDocument[], attributes?: AttributeDocument[]): Promise<ProductDocument> {
        try {
            if (!vendor.defaultTaxRate) {
                throw new BadRequest('UnableToCreateProductWithoutVendorTaxRate');
            }

            const instance = new ProductDocument();

            instance.title = data?.title;
            instance.description = data?.description;
            instance.slugs = data?.slugs;
            instance.images = data?.images;
            instance.videos = data?.videos;
            instance.vendor = vendor;
            instance.stockEnabled = vendor?.stockManagement;

            instance.taxRate = vendor.defaultTaxRate.getPresenter();
            instance.currency = vendor.defaultCurrency;

            instance.activeBy[ProductActiveBy.PRODUCT] = true;
            instance.activeBy[ProductActiveBy.VENDOR] = vendor.activeBy[VendorActiveBy.VENDOR];
            instance.activeBy[ProductActiveBy.VENDOR_SUBSCRIPTION] = await this.productVendorConnector.getShouldVendorHaveActiveProductBySubscription(vendor);

            await instance.save();

            await this.setCategories(instance, categories);
            await this.setAttributes(instance, attributes);

            return this.normalize(instance);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async update(product: ProductDocument, data: any, categories?: CategoryDocument[], attributes?: AttributeDocument[]): Promise<ProductDocument> {
        await product.populate([
            { path: 'vendor' }
        ]);

        product.title = data?.title ?? product.title;
        product.description = data?.description ?? product.description;
        product.tags = data?.tags ?? product.tags;
        product.videos = data?.videos ?? product.videos;
        product.images = data?.images ?? product.images;

        const numberOfMaxImages: any = product.vendor.subscription.abilities.maxProductImages;
        const numberOfMaxVideos: any = product.vendor.subscription.abilities.maxProductVideos;

        if (parseInt(numberOfMaxImages, 10) < product.images.length) {
            throw new BadRequest('MissingAbilityMaxImage', {
                requested: numberOfMaxImages,
                max: product.vendor.subscription.abilities.maxProductImages
            });
        }

        if (parseInt(numberOfMaxVideos, 10) < product.videos.length) {
            throw new BadRequest('MissingAbilityMaxVideos', {
                requested: numberOfMaxVideos,
                max: product.vendor.subscription.abilities.maxProductVideos
            });
        }

        await this.setCategories(product, categories);
        await this.setAttributes(product, attributes);

        return this.normalize(product);
    }

    public getBySlug(slug: string, options: FindManyOptions<any>): Promise<ProductDocument> {
        const kebabSlug = kebab(slug);

        return this.productRepository.findOne({ slugs: { $in: [kebabSlug] } }, options);
    }

    public getAllByVendor(vendor: VendorDocument, options: FindManyOptions<any> = {}): Promise<ProductDocument[]> {
        const query: any = { vendor: vendor._id };

        return this.productRepository.findMany(query, options);
    }

    public getAllByCategory(category: CategoryDocument, options: FindManyOptions<any> = {}): Promise<ProductDocument[]> {
        const query: any = { categories: { $in: [category._id] } };

        return this.productRepository.findMany(query, options);
    }

    public async addSlug(product: ProductDocument, slug: string) {
        const kebabSlug = kebab(slug);

        product.addSlug(kebabSlug);

        return product.save();
    }

    public async removeSlug(product: ProductDocument, slug: string) {
        const kebabSlug = kebab(slug);

        product.removeSlug(kebabSlug);

        return product.save();
    }

    public async addVariant(product: ProductDocument, variant: VariantDocument) {
        await product.addVariant(variant);

        return this.normalize(product);
    }

    public async removeVariant(product: ProductDocument, variant: VariantDocument) {
        await product.removeVariant(variant);

        return this.normalize(product);
    }

    public async setCategories(product: ProductDocument, categories: CategoryDocument[]) {
        await product.setCategories(categories);

        return this.normalize(product);
    }

    public async setAttributes(product: ProductDocument, attributes: AttributeDocument[]) {
        await product.setAttributes(attributes);

        return this.normalize(product);
    }

    public async addCategory(product: ProductDocument, category: CategoryDocument) {
        await product.addCategory(category);

        return this.normalize(product);
    }

    public async removeCategory(product: ProductDocument, category: CategoryDocument) {
        await product.removeCategory(category);

        return this.normalize(product);
    }

    public async addAttribute(product: ProductDocument, attribute: AttributeDocument) {
        await product.addAttribute(attribute);

        return this.normalize(product);
    }

    public async removeAttribute(product: ProductDocument, attribute: AttributeDocument) {
        await product.removeAttribute(attribute);

        return this.normalize(product);
    }

    public async activate(product: ProductDocument) {
        await product.activate();

        return this.normalize(product);
    }

    public async deactivate(product: ProductDocument) {
        await product.deactivate();

        return this.normalize(product);
    }

    public async normalizeByVariant(variant: VariantDocument) {
        try {
            const query: any = { variants: { $in: [variant._id] } };
            const options = { scope: DefaultScope };

            const product = await this.productRepository.findOne(query, options);

            if (product) {
                await this.normalize(product);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async normalize(product: ProductDocument) {
        try {
            // Először mentünk hogy bejöjjenek az adatok a referenciákról
            await product.save();

            // Tovább küldjük a normalizálást a variánsokba
            await this.variantProductConnector.productNormalize$.build(product);

            // Rámentünk még egyet, hogy a variánsokról visszajöjjön a termékre az attributumok éréke
            await product.save();

            return product;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public findByVariant(variant: VariantDocument, options: FindOneOptions<any> = {}): Promise<ProductDocument> {
        const query: any = {
            variants: {
                $in: [new ObjectId(variant._id)]
            }
        };

        return this.productRepository.findOne(query, options);
    }

    private async normalizeByVendor(vendor: VendorDocument) {
        try {
            const products = await this.getAllByVendor(vendor, {
                scope: DefaultScope
            });

            /**
             * Ezen a ponton lehetne használni a this.productVendorConnector.getNumberOfActiveProductLeftBySubscription(vendor) > 0
             * módszet is, de az egyrészt SOKKAL lassabb futást eredményez, másrészt, nem veszi figyelembe, hogy itt 0 tól kéne elszámolni a termékeket
             * nem az adott adatbázis állapot szerint
             */

            const numberOfMaxProducts = vendor.subscription.abilities.maxProducts;

            let counter = 0;

            for (const item of products) {
                counter < numberOfMaxProducts
                    ? await item.activateByVendorSubscription()
                    : await item.deactivateByVendorSubscription();

                item.currency = vendor.defaultCurrency;
                item.taxRate = vendor.defaultTaxRate.getPresenter();

                await item.save();

                await this.normalize(item);

                counter++;
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private async normalizeByCategory(category: CategoryDocument) {
        try {
            const products = await this.getAllByCategory(category, {
                scope: DefaultScope
            });

            for (const product of products) {
                await this.normalize(product);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
