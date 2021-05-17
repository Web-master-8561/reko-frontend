import { UserPresenter } from '@kifly/beagle/modules/codebuild/user-adapter/libs/user.presenter';
import { Forbidden } from '@kifly/beagle/modules/express/errors';
import { v4 } from 'uuid';
import { VendorDocument } from '../../documents/vendor/vendor.document';

export enum UserRoles {
    ADMIN = 'ADMIN'
}

export class User extends UserPresenter {
    public hasRole(role: string): boolean {
        const roles = this.meta.roles || [];

        return !!roles.find((item) => (item === role));
    }

    public isAdmin(): boolean {
        return this.hasRole(UserRoles.ADMIN);
    }

    public isOwnerOfVendor(vendor: VendorDocument): boolean {
        return !!vendor.owners.find((user) => (user === this._id));
    }

    public isLegal() {
        if (!this.meta.acceptedTermsOfUse) {
            return false;
        }

        if (!this.meta.acceptedPrivacyPolicy) {
            return false;
        }

        return true;
    }

    public isRegistrationFinished() {
        if (!this.meta.firstName) {
            return false;
        }

        if (!this.meta.lastName) {
            return false;
        }

        if (!this.meta.defaultShippingAddress) {
            return false;
        }

        if (!this.meta.defaultBillingAddress) {
            return false;
        }

        return true;
    }

    public canBeAVendorOwner() {
        if (!this.isLegal()) {
            return false;
        }

        return true;
    }

    public getCannotBeAVendorOwnerReasons() {
        return [
            ...this.getIllegalityReason(),
            ...this.getUnfinishedRegistrationReasons()
        ];
    }

    public getIllegalityReason() {
        const reasons = [];

        if (!this.meta.acceptedTermsOfUse) {
            reasons.push('unaccepted-terms-and-conditions');
        }

        if (!this.meta.acceptedPrivacyPolicy) {
            reasons.push('unaccepted-privacy-policy');
        }

        return reasons;
    }

    public getUnfinishedRegistrationReasons() {
        const reasons = [];

        if (!this.meta.firstName) {
            reasons.push('missing-first-name');
        }

        if (!this.meta.lastName) {
            reasons.push('missing-last-name');
        }

        if (!this.meta.defaultShippingAddress) {
            reasons.push('missing-default-shipping-address');
        }

        if (!this.meta.defaultBillingAddress) {
            reasons.push('missing-default-billing-address');
        }

        return reasons;
    }

    public getVendors() {
        return this.meta.vendors || [];
    }

    public throwIfUserCannotBeAVendorOwner() {
        const canBeOwner = this.canBeAVendorOwner();
        const reasons = this.getCannotBeAVendorOwnerReasons();

        if (!canBeOwner) {
            throw new Forbidden('UserCanNotBeAVendorOwner', {
                reasons: reasons
            });
        }
    }

    public getCartIdOrCreate() {
        return this.meta?.cartId || v4();
    }
}
