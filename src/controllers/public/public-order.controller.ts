import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest, NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { CheckoutService } from '../../services/checkout.service';
import { OrderService } from '../../services/order.service';
import { ScoringService } from '../../services/scoring/scoring.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicOrderController extends BaseController {
    @inject()
    public scoringService: ScoringService;

    @inject()
    public checkoutService: CheckoutService;

    @inject()
    public orderService: OrderService;

    @onInit()
    public initialize() {
        this.json.post('/:checkoutId', this.create.bind(this));
        this.json.get('/:orderId/:publicToken', this.show.bind(this));
    }

    public async create(req: Request) {
        const checkout = await this.checkoutService.checkoutRepository.findById(req.params.checkoutId);

        if (!req.body.currency) {
            throw new BadRequest('MissingCurrency');
        }

        if (!checkout) {
            throw new NotFound('UnknownCheckout');
        }

        const order = await this.orderService.createOrder(checkout, req.body.currency, req.body.user);

        await this.scoringService.emit('ORDER', checkout._id);

        return order;
    }

    public async show(req: Request) {
        const order = await this.orderService.orderRepository.findById(req.params.orderId);

        if (!order) {
            throw new NotFound('UnknownOrder');
        }

        if (order.publicToken !== req.params.publicToken) {
            throw new NotFound('PermissionDeniedOrder');
        }

        return order;
    }
}
