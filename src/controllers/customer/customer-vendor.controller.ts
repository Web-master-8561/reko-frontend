import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { ObjectId } from 'bson';
import { SubscriptionGenerator } from '../../documents/vendor/subscription/subscription-generator';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class CustomerVendorController extends BaseController {
    @inject()
    public vendorService: VendorService;

    @onInit()
    public initialize() {
        this.json.post('/', this.registerVendor.bind(this));
        this.json.get('/', this.index.bind(this));
    }

    public async registerVendor(req: Request) {
        const title = req.body.title;

        if (!title) {
            throw new BadRequest('MissingTitle');
        }

        const user = this.getRequestUser(req);

        const subscription = SubscriptionGenerator.generate('basic');

        user.throwIfUserCannotBeAVendorOwner();

        const vendor = await this.vendorService.create(req.body, subscription);

        await this.vendorService.addOwner(vendor, user);

        return vendor.readAsAdmin();
    }

    public async index(req: Request) {
        const user = this.getRequestUser(req);

        const vendorIds = user.getVendors().map((item) => new ObjectId(item));

        return this.vendorService.vendorRepository
            .paginate({ _id: { $in: vendorIds } }, {
                scope: ArchiveScope,
                limit: Infinity
            })
            .then((result) => ({
                ...result,
                items: result.items.map((item) => item.readAsAdmin())
            }));
    }
}
