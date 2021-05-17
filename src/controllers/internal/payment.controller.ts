import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { OrderService } from '../../services/order.service';

@injectable()
export class PaymentController extends Controller {
    @inject()
    public orderService: OrderService;

    @onInit()
    public inintialize() {
        this.app.post('/success', this.handleSuccess.bind(this));
        this.app.post('/fail', this.handleSuccess.bind(this));
        this.app.post('/update', this.handleSuccess.bind(this));
    }

    public async handleSuccess(req: Request) {
        const status = req.body?.payload?.status;
        const orderPayload = req.body?.payload?.orderPayload;

        if (!orderPayload?.vendor) {
            throw new BadRequest('MissingVendor');
        }

        if (!orderPayload?.order) {
            throw new BadRequest('MissingOrder');
        }

        const order = await this.orderService.orderRepository.findById(orderPayload?.order);

        switch (status) {
            case 'PENDING':
                // Nothing to do
                return order;

            case 'SUCCESS':
                return this.orderService.paid(order, req.body);

            case 'FAILED':
                if (order.payableStatus === 'SUCCESS') {
                    return order;
                }

                return this.orderService.unpaid(order, req.body);
            case 'UNKNOWN':
                if (order.payableStatus === 'SUCCESS') {
                    return order;
                }

                return this.orderService.unpaid(order, req.body);
            case 'TIMEOUT':
                if (order.payableStatus === 'SUCCESS') {
                    return order;
                }

                return this.orderService.unpaid(order, req.body);

            default:
                throw new BadRequest('UnknownStatus');
        }
    }
}
