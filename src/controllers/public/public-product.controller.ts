import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { NotFound } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { ObjectId } from 'bson';
import { get } from 'lodash';
import { QueryParser } from '../../libs/request-parser/query-parser';
import { MongoTransformer } from '../../libs/request-parser/transformers/mongo.transformer';
import { ActiveScope } from '../../libs/scopes/active.scope';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ScoringService } from '../../services/scoring/scoring.service';

@injectable()
export class PublicProductController extends Controller {
    @inject()
    public product: ProductService;

    @inject()
    public category: CategoryService;

    @inject()
    public scoringService: ScoringService;

    @onInit()
    public initialize() {
        this.json.get('/', this.index.bind(this));
        this.json.get('/:id([0-9a-fA-F]{24})', this.show.bind(this));
        this.json.get('/:slug', this.showBySlug.bind(this));
        this.json.get('/:id/price-history', this.priceHistory.bind(this));
    }

    public async index(req: Request) {
        const qp = new QueryParser({
            request: req,
            transform: MongoTransformer
        });

        const options = await qp.transform('paginationOptions', async () => ({
            scope: ActiveScope,
            sort: {
                'scoring.popularity': -1
            }
        }));

        const query: any = await qp.transform('query', async (req: Request) => {
            const hasQuery = (!!req.query.query || !!req.query._query);
            const attributeKeys = Object.keys((req.query.attribute || req.query._attribute || []) as any[]);
            const hasAttributes = !!attributeKeys.length;

            const hasCategory = (!!req.query.category || !!req.query._category);
            const category = !hasCategory ? null : await this.category.getBySlug((req.query.category || req.query._category) as any);

            return {
                $and: [
                    !hasQuery ? {} : { $text: { $search: (req.query.query || req.query._query) } },
                    !category ? {} : { categories: { $in: [new ObjectId(category._id)] } },
                    !hasAttributes ? {} : {
                        $and: attributeKeys.map((key) => ({
                            [`attributeValues.${key}`]: { $in: get(req.query.attribute, key) || [] }
                        }))
                    }
                ]
            };
        });

        return this.product.productRepository.paginate(query, options);
    }

    public async show(req: Request) {
        const product = await this.product.productRepository.findById(req.params.id as string, {
            scope: ActiveScope,
            populate: [
                { path: 'categories' },
                { path: 'variants' },
                { path: 'vendor' },
                { path: 'attributes' },
                { path: 'categoryAttributes' }
            ]
        });

        if (!product) {
            throw new NotFound('UnknownProduct');
        }

        await this.scoringService.emit('VISIT_PRODUCT', product._id);

        return product;
    }

    public async showBySlug(req: Request) {
        const product = await this.product.getBySlug(req.params.slug as string, {
            scope: ActiveScope,
            populate: [
                { path: 'categories' },
                { path: 'variants' },
                { path: 'vendor' },
                { path: 'attributes' },
                { path: 'categoryAttributes' }
            ]
        });

        if (!product) {
            throw new NotFound('UnknownProduct');
        }

        await this.scoringService.emit('VISIT_PRODUCT', product._id);

        return product;
    }

    public async priceHistory(req: Request) {
        const product = await this.show(req);

        return product.priceHistory;
    }
}
