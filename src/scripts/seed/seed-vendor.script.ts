import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { v4 } from 'uuid';
import { Arguments } from 'yargs';
import { SubscriptionGenerator } from '../../documents/vendor/subscription/subscription-generator';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class SeedVendorScript extends BaseScript {
    @inject()
    public vendorService: VendorService;

    public async run(args: Arguments<any>) {
        const subscription = SubscriptionGenerator.generate('infinity');

        await this.vendorService.create({
            title: `vendor-${v4()}`,
            description: 'This is a generated vendor by system'
        }, subscription);
    }
}
