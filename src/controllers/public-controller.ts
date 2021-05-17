import { Provider } from '@kifly/beagle/core/application/base-application';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Controller } from '@kifly/beagle/modules/express/injectables/controller';
import { PublicCartController } from './public/public-cart.controller';
import { PublicCategoryController } from './public/public-category.controller';
import { PublicCheckoutController } from './public/public-checkout.controller';
import { PublicContentController } from './public/public-content.controller';
import { PublicExchangeRateController } from './public/public-exchange-rate.controller';
import { PublicInfoController } from './public/public-info.controller';
import { PublicOrderController } from './public/public-order.controller';
import { PublicProductController } from './public/public-product.controller';
import { PublicRegistrationController } from './public/public-registration.controller';
import { PublicTaxRateController } from './public/public-tax-rate.controller';

@injectable()
export class PublicController extends Controller {
    @inject()
    public product: PublicProductController;

    @inject()
    public taxRate: PublicTaxRateController;

    @inject()
    public registration: PublicRegistrationController;

    @inject()
    public cart: PublicCartController;

    @inject()
    public checkout: PublicCheckoutController;

    @inject()
    public category: PublicCategoryController;

    @inject()
    public exchangeRate: PublicExchangeRateController;

    @inject()
    public info: PublicInfoController;

    @inject()
    public content: PublicContentController;

    @inject()
    public order: PublicOrderController;

    public static providers = (config: any): Provider[] => [
        { injectable: PublicCategoryController, options: config },
        { injectable: PublicCartController, options: config },
        { injectable: PublicCheckoutController, options: config },
        { injectable: PublicRegistrationController, options: config },
        { injectable: PublicTaxRateController, options: config },
        { injectable: PublicProductController, options: config },
        { injectable: PublicController, options: config },
        { injectable: PublicExchangeRateController, options: config },
        { injectable: PublicOrderController, options: config },
        { injectable: PublicInfoController, options: config },
        { injectable: PublicContentController, options: config }
    ];

    @onInit()
    public initialize() {
        this.app.use('/product', this.product.app);
        this.app.use('/register', this.registration.app);
        this.app.use('/cart', this.cart.app);
        this.app.use('/checkout', this.checkout.app);
        this.app.use('/order', this.order.app);
        this.app.use('/category', this.category.app);
        this.app.use('/tax-rate', this.taxRate.app);
        this.app.use('/exchange-rate', this.exchangeRate.app);
        this.app.use('/info', this.info.app);
        this.app.use('/content', this.content.app);
    }
}
