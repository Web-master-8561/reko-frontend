import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class VendorToggleStockManagementScript extends BaseScript {
    @inject()
    public vendorService: VendorService;

    public async run(args) {
        if (args.vendor === undefined) {
            throw new Error('MissingVendor');
        }

        if (args.enable === undefined) {
            throw new Error('MIssingEnable');
        }

        const vendor = await this.vendorService.vendorRepository.findById(args.vendor);

        if (!vendor) {
            throw new Error('UnknownVendor');
        }

        const enable = !!args.enable;

        if (enable) {
            await this.vendorService.enableStockManagement(vendor);
        } else {
            await this.vendorService.disableStockManagement(vendor);
        }
    }
}
