import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { UserAdapter } from '@kifly/beagle/modules/codebuild/user-adapter/user.adapter';
import { InternalServerError } from '@kifly/beagle/modules/express/errors';
import { uniq } from 'lodash';
import { VendorDocument } from '../../documents/vendor/vendor.document';
import { VendorUserService } from '../connectors/vendor-user.service';
import { User } from './user';

@injectable()
export class UserService extends UserAdapter<User> {
    @inject()
    public vendorUserService: VendorUserService;

    constructor(options) {
        super({ ...options, dao: User });
    }

    @onInit()
    public initialize() {
        this.vendorUserService.vendorAddOwner.register((vendor, user) => this.vendorAddOwner(vendor, user));
        this.vendorUserService.vendorRemoveOwner.register((vendor, user) => this.vendorRemoveOwner(vendor, user));
    }

    public findByEmail(email: string): Promise<User> {
        return super.user.findByEmail(email);
    }

    public findByCartId(cartId: string): Promise<User> {
        return this.user.findOne({
            'meta.cartId': cartId
        });
    }

    public async normalize(user: User) {
        const refreshed = await this.user.refresh(user);

        if (!refreshed) {
            throw new InternalServerError('UnknownUser');
        }

        await this.meta.set(refreshed, 'isLegal', refreshed.isLegal());
        await this.meta.set(refreshed, 'isRegistrationFinished', refreshed.isRegistrationFinished());
        await this.meta.set(refreshed, 'cartId', refreshed.getCartIdOrCreate());

        return this.user.refresh(refreshed);
    }

    private async vendorAddOwner(vendor: VendorDocument, user: User) {
        const refreshed = await this.user.refresh(user);

        const vendors = refreshed.getVendors();

        await this.meta.set(refreshed, 'vendors', uniq([...vendors, vendor._id?.toString()]));
    }

    private async vendorRemoveOwner(vendor: VendorDocument, user: User) {
        const refreshed = await this.user.refresh(user);

        const vendors = refreshed.getVendors();

        await this.meta.set(refreshed, 'vendors', vendors.filter((item) => (item !== vendor._id?.toString())));
    }

    public async acceptPrivacyPolicy(user: User) {
        return this.meta.set(user, 'acceptedPrivacyPolicy', new Date());
    }

    public async acceptTermsOfUse(user: User) {
        return this.meta.set(user, 'acceptedTermsOfUse', new Date());
    }
}
