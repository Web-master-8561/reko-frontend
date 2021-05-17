import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { ProductDocument } from '../../documents/product/product.document';
import { VendorDocument } from '../../documents/vendor/vendor.document';
import { ArchiveRepository } from '../../libs/repository/archive.repository';
import { ActiveScope } from '../../libs/scopes/active.scope';
import { FactoryBuilder } from '../../libs/subject.factory';

@injectable()
export class ProductVendorService {
    @inject()
    public connection: Connection;

    public vendorNormalize$ = new FactoryBuilder();

    // @ts-expect-error
    public productRepository = new ArchiveRepository<ProductDocument>(ProductDocument, this.connection);

    // @ts-expect-error
    public vendorRepository = new ArchiveRepository<VendorDocument>(VendorDocument, this.connection);

    /**
     * Ez a metódus visszadja azt, hogy az adott vendor hány aktív termékkel rendelkezhet még a subscriptionje alapján
     * @param vendor
     */
    public async getNumberOfActiveProductLeftBySubscription(vendor: VendorDocument) {
        const maxProductByAbility = vendor.subscription.abilities.maxProducts || 0;

        const query = { vendor: new Object(vendor._id) };
        const options = { scope: ActiveScope };

        const numberOfActiveProducts = await this.productRepository.count(query, options);

        return Math.max(0, maxProductByAbility - numberOfActiveProducts);
    }

    public async getShouldVendorHaveActiveProductBySubscription(vendor: VendorDocument) {
        return await this.getNumberOfActiveProductLeftBySubscription(vendor) > 0;
    }
}
