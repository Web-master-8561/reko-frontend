import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest, NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { Address } from '../../documents/libs/address';
import { CompanyInfo } from '../../documents/order/libs/company-info';
import { PersonalInfo } from '../../documents/order/libs/personal-info';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { OrderService } from '../../services/order.service';
import { ScoringService } from '../../services/scoring/scoring.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicCheckoutController extends BaseController {
    @inject()
    public checkoutService: CheckoutService;

    @inject()
    public scoringService: ScoringService;

    @inject()
    public orderService: OrderService;

    @inject()
    public cartService: CartService;

    @onInit()
    public initialize() {
        this.json.get('/:id', this.show.bind(this));
        this.json.post('/:cartId', this.create.bind(this));
        this.json.put('/:id', this.update.bind(this));
    }

    public async show(req: Request) {
        const item = await this.checkoutService.checkoutRepository.findById(req.params.id);

        if (!item) {
            throw new NotFound('UnknownCheckout');
        }

        return item;
    }

    public async create(req: Request) {
        const cart = await this.cartService.cartRepository.findById(req.params.cartId);

        if (!cart) {
            throw new NotFound('UnknownCart');
        }

        await this.scoringService.emit('CHECKOUT', cart._id);

        return this.checkoutService.create(cart);
    }

    public async update(req: Request) {
        if (!this.orderService.isPaymentTypeAvailable(req.body.paymentType)) {
            throw new BadRequest('UnsupportedPaymentType');
        }

        const checkout = await this.checkoutService.checkoutRepository.findById(req.params.id);

        if (!checkout) {
            throw new NotFound('UnknownCheckout');
        }

        const personalInfo = req.body.personalInfo ? new PersonalInfo(req.body.personalInfo) : null;
        const companyInfo = req.body.companyInfo ? new CompanyInfo(req.body.companyInfo) : null;
        const billingAddress = req.body.billingAddress ? new Address(req.body.billingAddress) : null;
        const shippingAddress = req.body.shippingAddress ? new Address(req.body.shippingAddress) : null;

        return this.checkoutService.update(checkout, {
            user: req.body.user,
            email: req.body.email,
            paymentType: req.body.paymentType,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress,
            personalInfo: personalInfo,
            companyInfo: companyInfo
        });
    }
}
