import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ObjectId } from 'bson';
import { SubscriptionGenerator } from '../../documents/vendor/subscription/subscription-generator';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class VendorChangeSubscriptionScript extends BaseScript {
    @inject()
    public vendorService: VendorService;

    public async run(args) {
        if (!args.subscription) {
            throw new Error('MissingSubscription');
        }

        const subscription = SubscriptionGenerator.generate(args.subscription);

        const vendors = args.vendor !== undefined
            ? await this.vendorService.vendorRepository.findMany({ _id: new ObjectId(args.vendor) } as any, { scope: DefaultScope })
            : await this.vendorService.vendorRepository.findMany({}, { scope: DefaultScope });

        for (const vendor of vendors) {
            await this.vendorService.setSubscription(subscription, vendor);
        }
    }
}
