import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { ObjectId } from 'bson';
import * as moment from 'moment';
import { QueryParser } from '../../libs/request-parser/query-parser';
import { MongoTransformer } from '../../libs/request-parser/transformers/mongo.transformer';
import { OrderService } from '../../services/order.service';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class VendorOrderController extends BaseController {
    @inject()
    public vendor: VendorService;

    @inject()
    public order: OrderService;

    @onInit()
    public initialize() {
        this.json.get('/', this.list.bind(this));
        this.json.get('/:orderId', this.show.bind(this));
        this.json.put('/:orderId/decline', this.decline.bind(this));
        this.json.put('/:orderId/paid', this.paid.bind(this));
        this.json.put('/:orderId/shipped', this.shipped.bind(this));
        this.json.put('/:orderId/completed', this.completed.bind(this));
    }

    public async list(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const qp = new QueryParser({
            request: req,
            transform: MongoTransformer
        });

        const query: any = await qp.transform('query', async (req: Request) => {
            const hasCreatedAt = ((req.query.createdAt as any)?.from !== undefined) && ((req.query.createdAt as any)?.to !== undefined);
            const hasPayableStatus = (req.query.payableStatus !== undefined);
            const hasQuery = !!req.query._query;

            return {
                $and: [
                    { 'vendorArtifact._id': new ObjectId(vendor._id) },
                    hasQuery ? { $text: { $search: req.query._query } } : {},
                    hasPayableStatus ? { payableStatus: req.query.payableStatus } : {},
                    hasCreatedAt
                        ? {
                            $and: [
                                { createdAt: { $gte: moment((req.query.createdAt as any)?.from).startOf('day').toDate() } },
                                { createdAt: { $lte: moment((req.query.createdAt as any)?.to).endOf('day').toDate() } }
                            ]
                        }
                        : {}
                ]
            };
        });

        const options = await qp.transform('paginationOptions');

        return this.order.orderRepository.paginate(query, options);
    }

    public async show(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();

        const query = {
            _id: new ObjectId(req.params.orderId),
            'vendorArtifact._id': new ObjectId(vendor._id)
        };

        const item = await this.order.orderRepository.findOne(query);

        if (!item) {
            throw new NotFound('UnknownOrder');
        }

        return item;
    }

    public async decline(req: Request) {
        const item = await this.show(req);

        return this.order.decline(item, req.body.reason);
    }

    public async paid(req: Request) {
        const item = await this.show(req);

        return this.order.paid(item, req.body.reason);
    }

    public async shipped(req: Request) {
        const item = await this.show(req);

        return this.order.shipped(item, req.body.reason);
    }

    public async completed(req: Request) {
        const item = await this.show(req);

        return this.order.completed(item, req.body.reason);
    }
}
