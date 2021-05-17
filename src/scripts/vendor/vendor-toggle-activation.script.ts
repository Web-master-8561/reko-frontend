import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class VendorToggleActivationScript extends BaseScript {
    @inject()
    public vendorService: VendorService;

    public async run(args) {
        if (args.by === undefined) {
            throw new Error('MissingBy');
        }

        if (args.activate === undefined) {
            throw new Error('MissingActivate');
        }

        if (args.vendor === undefined) {
            throw new Error('MissingVendor');
        }

        const vendor = await this.vendorService.vendorRepository.findById(args.vendor);

        if (!vendor) {
            throw new Error('UnknownVendor');
        }

        args.activate
            ? await this.vendorService.activateBy(args.by, vendor)
            : await this.vendorService.deactivateBy(args.by, vendor);
    }
}
