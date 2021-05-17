import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { TaxRateDocument } from '../documents/libs/tax-rate/tax-rate.document';
import { Subscription } from '../documents/vendor/subscription/subscription';
import { VendorActiveBy, VendorDocument } from '../documents/vendor/vendor.document';

import { ArchiveRepository } from '../libs/repository/archive.repository';
import { ProductVendorService } from './connectors/product-vendor.service';
import { VendorUserService } from './connectors/vendor-user.service';
import { User } from './user/user';

@injectable()
export class VendorService {
    @inject()
    public connection: Connection;

    @inject()
    public productVendorService: ProductVendorService;

    @inject()
    public vendorUserService: VendorUserService;

    // @ts-expect-error
    public vendorRepository = new ArchiveRepository<VendorDocument>(VendorDocument, this.connection);

    public create(data: any, subscription: Subscription): Promise<VendorDocument> {
        try {
            const instance = new VendorDocument();

            instance.title = data?.title;
            instance.description = data?.description;
            instance.subscription = subscription;

            instance.activeBy[VendorActiveBy.SYSTEM] = true;
            instance.activeBy[VendorActiveBy.VENDOR] = false;

            return instance.save();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Nagyon fontos, hogy ebben a metódusban csak olyan műveleteket hajtunk végre, melyek után nem kell normalizálni a vendort!!!!
     * Ez nagyon fontos!!!
     *
     * Ha ez a művelet sokszor hajtódik végre, az nagyon lassú lesz sok termék esetén,
     *  és az ügyfél nyomogatni fogja ezt az endpointot mint a csengőt
     *
     * @param data
     * @param vendor
     */
    public async update(data: any, vendor: VendorDocument): Promise<VendorDocument> {
        vendor.title = data?.title ?? vendor.title;
        vendor.description = data?.description ?? vendor.description;
        vendor.company = data?.company ?? vendor.company;
        vendor.taxNumber = data?.taxNumber ?? vendor.taxNumber;
        vendor.website = data?.website ?? vendor.website;
        vendor.email = data?.email ?? vendor.email;
        vendor.phone = data?.phone ?? vendor.phone;

        return vendor.save();
    }

    /**
     * Ezzel a metódussal bekapcsolhatjuk a Stock Managementet egy vendoron
     * - ha be van kapcsolva akkor a termékek/variant stockok változni fognak és befolyásolják az active állapotát a terméknek
     * - ha nincs bekapcsolva akkor ez a paraméter figyelmen kívül van hagyva
     *
     * @param vendor
     */
    public async enableStockManagement(vendor: VendorDocument) {
        try {
            vendor.enableStockManagement();

            await vendor.save();

            return this.normalizeVendor(vendor);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Opposite method of enableStockManagement
     *
     * @param vendor
     */
    public async disableStockManagement(vendor: VendorDocument) {
        try {
            vendor.disableStockManagement();

            await vendor.save();

            return this.normalizeVendor(vendor);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async activateBy(by: VendorActiveBy, vendor: VendorDocument) {
        try {
            if (!Object.values(VendorActiveBy).includes(by)) {
                throw new Error('UnknownVendorActiveByValue');
            }

            vendor.activeBy[by] = true;

            await vendor.save();

            return this.normalizeVendor(vendor);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async deactivateBy(by: VendorActiveBy, vendor: VendorDocument) {
        try {
            if (!Object.values(VendorActiveBy).includes(by)) {
                throw new Error('UnknownVendorActiveByValue');
            }

            vendor.activeBy[by] = false;

            await vendor.save();

            return this.normalizeVendor(vendor);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async normalizeVendor(vendor: VendorDocument) {
        /**
         * Ez a metódus elég sok erőforrást fog indítani!
         * Meg kell vizsgálni a refaktorálás lehetőségét
         */

        try {
            await vendor.save();

            await this.productVendorService.vendorNormalize$.build(vendor);

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async setSubscription(subscription: Subscription, vendor: VendorDocument) {
        try {
            /**
             * Itt megőrizzük a korábbi subscription állapotot, mert nem tudhatjuk, miért lett deactiválva
             */
            vendor.subscription?.isActive() ? subscription.activate() : subscription.deactivate();

            vendor.setSubscription(subscription);

            await vendor.save();

            await this.normalizeVendor(vendor);

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async activateSubscription(vendor: VendorDocument) {
        try {
            vendor.subscription.activate();

            await vendor.save();

            await this.normalizeVendor(vendor);

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async deactivateSubscription(vendor: VendorDocument) {
        try {
            vendor.subscription.deactivate();

            await vendor.save();

            await this.normalizeVendor(vendor);

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async setDefaultTaxRate(vendor: VendorDocument, taxRate: TaxRateDocument) {
        try {
            vendor.setDefaultTaxRate(taxRate);

            await vendor.save();

            await this.normalizeVendor(vendor);

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async setDefaultCurrency(vendor: VendorDocument, currency: string) {
        try {
            vendor.setDefaultCurrency(currency);

            await vendor.save();

            await this.normalizeVendor(vendor);

            // TODO -> Add currency to products

            return vendor;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async addOwner(vendor: VendorDocument, user: User) {
        try {
            vendor.addOwner(user);

            await this.vendorUserService.vendorAddOwner.build(vendor, user);

            await vendor.save();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async removeOwner(vendor: VendorDocument, user: User) {
        try {
            vendor.removeOwner(user);

            if (vendor.owners.length === 0) {
                throw new BadRequest('UnableToUpdateVendorWithoutOwner');
            }

            await this.vendorUserService.vendorRemoveOwner.build(vendor, user);

            await vendor.save();
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
