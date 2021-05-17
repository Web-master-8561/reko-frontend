import { CompiledConfig } from '@kifly/beagle/bin/libs/config';
import { Provider } from '@kifly/beagle/core/application/base-application';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { RedisService } from '@kifly/beagle/modules/cache/redis.service';
import { FacebookService } from '@kifly/beagle/modules/facebook/facebook.service';
import { GoogleService } from '@kifly/beagle/modules/google/google.service';
import { AdminController } from './controllers/admin.controller';
import { CustomerController } from './controllers/customer-controller';
import { InternalController } from './controllers/internal.controller';
import { PublicController } from './controllers/public-controller';
import { VendorController } from './controllers/vendor.controller';
import { AddressDocument } from './documents/libs/address.document';
import { TaxRateDocument } from './documents/libs/tax-rate/tax-rate.document';
import { CartDocument } from './documents/order/cart.document';
import { CheckoutDocument } from './documents/order/checkout.document';
import { OrderDocument } from './documents/order/order.document';
import { AttributeDocument } from './documents/product/attribute.document';
import { CategoryDocument } from './documents/product/category.document';
import { ProductDocument } from './documents/product/product.document';
import { VariantDocument } from './documents/product/variant.document';
import { ScoringLogDocument } from './documents/scoring-log.document';
import { VendorDocument } from './documents/vendor/vendor.document';
import { AddressService } from './services/address.service';
import { AttributeService } from './services/attribute.service';
import { CartService } from './services/cart.service';
import { CategoryService } from './services/category.service';
import { CheckoutService } from './services/checkout.service';
import { CategoryProductService } from './services/connectors/category-product.service';
import { OrderConnector } from './services/connectors/order-connector';
import { ProductVendorService } from './services/connectors/product-vendor.service';
import { VariantProductService } from './services/connectors/variant-product.service';
import { VendorUserService } from './services/connectors/vendor-user.service';
import { ExchangeRateService } from './services/exchange-rates/exchange-rate.service';
import { OnlinePaymentTypeHandler } from './services/libs/payment-type-handlers/online.payment-type-handler';
import { TransferPaymentTypeHandler } from './services/libs/payment-type-handlers/transfer.payment-type-handler';
import { OrderService } from './services/order.service';
import { PaymentService } from './services/payment/payment.service';
import { ProductService } from './services/product.service';
import { RegistrationService } from './services/registration/registration.service';
import { ScoringService } from './services/scoring/scoring.service';
import { StockService } from './services/stock.service';
import { TaxRateService } from './services/tax-rate.service';
import { UserService } from './services/user/user.service';
import { VariantService } from './services/variant.service';
import { VendorService } from './services/vendor.service';

export const providers = (config: CompiledConfig): Provider[] => [
    // Controllers
    ...AdminController.providers({ settings: config?.environment?.settings }),
    ...PublicController.providers({ settings: config?.environment?.settings }),
    ...VendorController.providers({ settings: config?.environment?.settings }),
    ...CustomerController.providers({ settings: config?.environment?.settings }),
    ...InternalController.providers({ settings: config?.environment?.settings }),

    // Document & MicroService Services
    {
        injectable: UserService,
        options: {
            endpoint: config.environment?.userService,
            settings: config?.environment?.settings
        }
    },
    {
        injectable: PaymentService,
        options: {
            endpoint: config.environment?.paymentService,
            settings: config?.environment?.settings
        }
    },

    {
        injectable: OrderService,
        options: {
            settings: config?.environment?.settings,
            handlers: {
                transfer: new TransferPaymentTypeHandler(),
                stripe: new OnlinePaymentTypeHandler({ provider: 'stripe' })
            }
        }
    },

    { injectable: VendorService, options: { settings: config?.environment?.settings } },
    { injectable: ProductService, options: { settings: config?.environment?.settings } },
    { injectable: VariantService, options: { settings: config?.environment?.settings } },
    { injectable: CategoryService, options: { settings: config?.environment?.settings } },
    { injectable: TaxRateService, options: { settings: config?.environment?.settings } },
    { injectable: CartService, options: { settings: config?.environment?.settings } },
    { injectable: CheckoutService, options: { settings: config?.environment?.settings } },
    { injectable: StockService, options: { settings: config?.environment?.settings } },
    { injectable: AddressService, options: { settings: config?.environment?.settings } },
    { injectable: AttributeService, options: { settings: config?.environment?.settings } },

    // Other Services
    { injectable: ExchangeRateService, options: { settings: config?.environment?.settings } },
    { injectable: RegistrationService, options: { settings: config?.environment?.settings } },
    { injectable: ScoringService, options: { settings: config?.environment?.settings } },
    { injectable: FacebookService, options: config?.environment?.facebook },
    { injectable: GoogleService, options: config?.environment?.google },

    // Connectors
    { injectable: ProductVendorService, options: { settings: config?.environment?.settings } },
    { injectable: CategoryProductService, options: { settings: config?.environment?.settings } },
    { injectable: VariantProductService, options: { settings: config?.environment?.settings } },
    { injectable: VendorUserService, options: { settings: config?.environment?.settings } },
    { injectable: OrderConnector, options: { settings: config?.environment?.settings } },

    // Database
    {
        injectable: Connection,
        options: {
            url: config.environment?.mongoUri,
            documents: [
                AddressDocument,
                ProductDocument,
                VariantDocument,
                OrderDocument,
                CheckoutDocument,
                VendorDocument,
                CategoryDocument,
                TaxRateDocument,
                CartDocument,
                ScoringLogDocument,
                AttributeDocument
            ]
        }
    },
    {
        injectable: RedisService,
        options: config.environment?.redis
    }
];
