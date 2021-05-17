import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { BadRequest, Forbidden, InternalServerError, NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ObjectId } from 'bson';
import { QueryParser } from '../../libs/request-parser/query-parser';
import { MongoTransformer } from '../../libs/request-parser/transformers/mongo.transformer';
import { AttributeService } from '../../services/attribute.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { VariantService } from '../../services/variant.service';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class VendorProductController extends BaseController {
    @inject()
    public vendor: VendorService;

    @inject()
    public product: ProductService;

    @inject()
    public variant: VariantService;

    @inject()
    public category: CategoryService;

    @inject()
    public attribute: AttributeService;

    @onInit()
    public initialize() {
        this.json.post('/', this.create.bind(this));
        this.json.get('/', this.index.bind(this));

        this.json.get('/:product([0-9a-fA-F]{24})', this.show.bind(this));
        this.json.get('/:slug', this.showBySlug.bind(this));

        this.json.put('/:product', this.update.bind(this));
        this.json.put('/:product/slug', this.addSlug.bind(this));
        this.json.delete('/:product/slug', this.removeSlug.bind(this));

        this.json.put('/:product/variant/:variant', this.addVariant.bind(this));
        this.json.delete('/:product/variant/:variant', this.removeVariant.bind(this));
    }

    public async create(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityProductCreate(req.body);

        if (!req.body.title) {
            throw new BadRequest('MissingTitle');
        }

        if (!req.body.description) {
            throw new BadRequest('MissingDescription');
        }

        if (!req.body.tags) {
            throw new BadRequest('MissingTags');
        }

        const categories = !Array.isArray(req.body.categories) ? [] : await this.category.repository.findMany({
            _id: {
                $in: req.body.categories.map((item) => new ObjectId(item?._id || item))
            }
        });

        const attributes = !Array.isArray(req.body.attributes) ? [] : await this.attribute.attributeRepository.findMany({
            _id: {
                $in: req.body.attributes.map((item) => new ObjectId(item?._id || item))
            },
            vendor: {
                $ne: null
            }
        });

        return this.product.create(req.body, vendor, categories, attributes);
    }

    public async update(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityProductUpdate(req.body);

        const product = await this.extractProduct(req);

        const categories = !Array.isArray(req.body.categories) ? [] : await this.category.repository.findMany({
            _id: {
                $in: req.body.categories.map((item) => new ObjectId(item?._id || item))
            }
        });

        const attributes = !Array.isArray(req.body.attributes) ? [] : await this.attribute.attributeRepository.findMany({
            _id: {
                $in: req.body.attributes.map((item) => new ObjectId(item?._id || item))
            },
            vendor: {
                $ne: null
            }
        });

        const updated = await this.product.update(product, req.body, categories, attributes);

        await updated.save();
        await updated.loadVariants();
        await updated.loadCategories();

        return updated;
    }

    public async index(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const parser = new QueryParser({
            request: req,
            transform: MongoTransformer
        });

        const query: any = await parser.transform('query', async (req: Request) => ({
            $and: [
                { vendor: new ObjectId(vendor._id) },
                req.query._query ? { $text: { $search: req.query._query } } : {},
                (req.query.active !== undefined) ? { active: !!req.query.active } : {},
                Array.isArray(req.query.categories) ? { categories: { $in: (req.query.categories as string[]).map((item) => new ObjectId(item)) } } : {}
            ]
        }));

        const options = await parser.transform('paginationOptions', async () => ({
            populate: [
                { path: 'categories' },
                { path: 'attributes' },
                { path: 'variants' }
            ]
        }));

        return this.product.productRepository.paginate(query, options);
    }

    public async show(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const product = await this.extractProduct(req);

        await product.populate([
            { path: 'categories' },
            { path: 'attributes' },
            { path: 'variants' }
        ]);

        return product;
    }

    public async showBySlug(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const product = await this.product.getBySlug(req.params.slug as string, {
            scope: ArchiveScope
        });

        if (!product) {
            throw new NotFound('UnknownProduct');
        }

        /**
         * Ez nem ugyan azt csinálja mint a service általi normalizálás, FONTOS!
         */
        await product.normalize();

        await product.populate([
            { path: 'categories' },
            { path: 'attributes' },
            { path: 'variants' }
        ]);

        return product;
    }

    public async addVariant(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        if (!req.params.variant) {
            throw new NotFound('MissingVariant');
        }

        const product = await this.extractProduct(req);

        const variant = await this.variant.variantRepository.findById(req.params.variant, {
            scope: ArchiveScope
        });

        if (!variant) {
            throw new NotFound('UnknownVariant');
        }

        return this.product.addVariant(product, variant);
    }

    public async removeVariant(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        if (!req.params.variant) {
            throw new NotFound('MissingVariant');
        }

        const product = await this.extractProduct(req);

        const variant = await this.variant.variantRepository.findById(req.params.variant, {
            scope: DefaultScope
        });

        if (!variant) {
            throw new NotFound('UnknownVariant');
        }

        return this.product.removeVariant(product, variant);
    }

    public async addSlug(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const product = await this.extractProduct(req);

        if (!req.body.slug) {
            throw new BadRequest('MissingSlug');
        }

        return this.product.addSlug(product, req.body.slug);
    }

    public async removeSlug(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const product = await this.extractProduct(req);

        if (!req.body.slug) {
            throw new BadRequest('MissingSlug');
        }

        return this.product.removeSlug(product, req.body.slug);
    }

    private async extractProduct(req: Request) {
        const product = await this.product.productRepository.findById(req.params.product, {
            scope: ArchiveScope
        });

        if (!product) {
            throw new NotFound();
        }

        const user = this.getRequestUser(req);
        const vendor = this.getRequestVendor(req);

        await product.loadVendor();

        if (!product.vendor) {
            throw new InternalServerError('UnassociatedProduct');
        }

        if (vendor._id.toString() !== product.vendor._id.toString()) {
            throw new Forbidden('PermissionDeniedProduct');
        }

        if (!user.isOwnerOfVendor(product.vendor)) {
            throw new Forbidden('PermissionDeniedVariant');
        }

        return product;
    }
}
