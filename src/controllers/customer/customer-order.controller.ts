import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { QueryParser } from '../../libs/request-parser/query-parser';
import { MongoTransformer } from '../../libs/request-parser/transformers/mongo.transformer';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user/user.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class CustomerOrderController extends BaseController {
    @inject()
    public userService: UserService;

    @inject()
    public order: OrderService;

    @onInit()
    public initialize() {
        this.json.get('/', this.list.bind(this));
    }

    public async list(req: Request) {
        const user = this.getRequestUser(req);

        const qp = new QueryParser({
            request: req,
            transform: MongoTransformer
        });

        const query = await qp.transform('query', async () => ({
            $and: [
                {
                    $or: [
                        { user: user._id },
                        { email: user.email }
                    ]
                },
                !req.query.payableStatus ? {} : { payableStatus: req.query.payableStatus }
            ]
        }));

        const options = await qp.transform('paginationOptions');

        return this.order.orderRepository.paginate(query, options);
    }
}
