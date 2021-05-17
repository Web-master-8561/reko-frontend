import { CompiledConfig } from '@kifly/beagle/bin/libs/config';
import { Script } from '@kifly/beagle/core/application/base-application';
import { ImportCategoryAttributeValuesScript } from './scripts/category/import-category-attribute-values.script';
import { ExchangeRateUpdateScript } from './scripts/exchange-rate-update.script';
import { ProductNormalizeScript } from './scripts/product/product-normalize.script';
import { ScoringScript } from './scripts/scoring.script';
import { SeedCategoriesScript } from './scripts/seed/seed-categories/seed-categories.script';
import { SeedDeveloper } from './scripts/seed/seed-developer';
import { SeedEntireDummyEnvironmentScript } from './scripts/seed/seed-entire-dummy-environment.script';
import { SeedProductScript } from './scripts/seed/seed-products';
import { SeedTaxRateScript } from './scripts/seed/seed-tax-rate/seed-tax-rate.script';
import { SeedVendorScript } from './scripts/seed/seed-vendor.script';
import { VendorChangeSubscriptionScript } from './scripts/vendor/vendor-change-subscription.script';
import { VendorNormalizeScript } from './scripts/vendor/vendor-normalize.script';
import { VendorToggleActivationScript } from './scripts/vendor/vendor-toggle-activation.script';
import { VendorToggleStockManagementScript } from './scripts/vendor/vendor-toggle-stock-management.script';

export const scripts = (config: CompiledConfig): Script[] => [
    { name: 'seed-entire-dummy-environment', injectable: SeedEntireDummyEnvironmentScript },
    { name: 'seed-products', injectable: SeedProductScript },
    { name: 'seed-vendor', injectable: SeedVendorScript },
    { name: 'seed-tax-rate', injectable: SeedTaxRateScript },
    { name: 'seed-categories', injectable: SeedCategoriesScript },
    { name: 'seed-developer', injectable: SeedDeveloper },

    /**
     * Stock management Be/Kikapcsolása
     *
     * $ yarn script --script vendor-toggle-stock-management --vendor <vendorId> --enable <0|1>
     */
    { name: 'vendor-toggle-stock-management', injectable: VendorToggleStockManagementScript },

    /**
     * Vendor Normalizálása
     * - Minden egyes vendoron vgigszalad és megnézi, hogy érvényes-e a subscriptionje
     * - ha már nem akkor, akkor intézkedik a termékeinél
     * - ha igen akkor is (mindíg csak az aktuális állapotot nézi)
     * - figyelembe veszi a subscription abilityjét, szóval ez dönti el hogy melyik termékek legyenek aktívak
     *
     * - megnézi hogy van-e a subscriptionnek defaultTaxRate-je
     *
     * $ yarn script --script vendor-normalize [--vendor <vendorId>]
     */
    { name: 'vendor-normalize', injectable: VendorNormalizeScript },

    /**
     * Vendor Activation Scriptek
     *
     * $ yarn script --script vendor-toggle-activation --vendor <vendorId> --by <system|vendor> --activate <0|1>
     */
    { name: 'vendor-toggle-activation', injectable: VendorToggleActivationScript },

    /**
     * Change Vendor Subscription
     * - előre definiált listából lehet választani
     *
     * $ yarn script --script vendor-change-subscription [--vendor <vendorId>] --subscription <subscriptionType>
     */
    { name: 'vendor-change-subscription', injectable: VendorChangeSubscriptionScript },

    /**
     * Ez a script meggyógyítja a productok adatbázis értékeit
     * - a megoldás a ProductDocument lifecycle metódusaiban keresendőek
     * - ELMÉLETILEG SOHA NEM KELL HASZNÁLNI, HA MÉGIS, JELEZD KÉRLEK, CHALLANGELEM MAGAMAT (Bence)
     *
     * $ yarn script --script product-normalize
     */
    { name: 'product-normalize', injectable: ProductNormalizeScript },

    /**
     * Ezzel a scripttel be tudod importálni az attribute value-kat a termékekről, melyek a variánsokról is jöhetnek
     *
     * Ez azért fontos, mert a termékekekn automatikusan megjelennek az attribute value-k, de a kategóriákon nem
     */
    { name: 'import-category-attribute-values', injectable: ImportCategoryAttributeValuesScript },

    /**
     * Ezzel a scripttel le tudod frissíteni a jelenlegi exchange rateeket
     */
    { name: 'update-exchange-rate', injectable: ExchangeRateUpdateScript },

    /**
     * Ezzel a scripttel alakíthatod át a felhasználói interakciókat, order by pontokká
     */
    { name: 'scoring', injectable: ScoringScript }
];
