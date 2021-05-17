import { Archive, ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { Forbidden } from '@kifly/beagle/modules/express/errors';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { IsDefined, IsOptional, ValidateNested } from 'class-validator';
import { get, uniq } from 'lodash';
import { TaxRate, TaxRateDocument } from '../libs/tax-rate/tax-rate.document';
import { Subscription } from './subscription/subscription';

export interface VendorArtifact {
    _id: string;
    title: string;
    description: string;
    defaultCurrency: string;
    defaultTaxRate: TaxRate;
    providerPayload: any[];
}

export enum VendorActiveBy {
    SYSTEM = 'system',
    VENDOR = 'vendor'
}

export interface Vendor extends Archive {
    title?: string;
    description?: string;
}

@document({
    collection: 'vendor',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: []
})
export class VendorDocument extends ArchiveDocument<Vendor> {
    @property()
    public activeBy = {
        [VendorActiveBy.SYSTEM]: true,
        [VendorActiveBy.VENDOR]: true
    };

    @property()
    public active: boolean;

    @property()
    public valid: boolean;

    @property()
    public title: string;

    @property()
    public company: string;

    @property()
    public taxNumber: string;

    @property()
    public website: string;

    @property()
    public email: string;

    @property()
    public phone: string;

    @property()
    public description: string;

    @property()
    public stockManagement: boolean;

    @ValidateNested()
    @IsDefined({ message: 'required' })
    @property()
    public subscription: Subscription;

    @ref(() => TaxRateDocument)
    public defaultTaxRate: TaxRateDocument;

    @IsOptional()
    @property()
    public defaultCurrency: string;

    @property()
    public owners: string[] = [];

    @property()
    public scoring: any;

    @property()
    public providerPayload: any;

    @afterLoad()
    public async initializeSubscription() {
        await this.populate([
            { path: 'defaultTaxRate' }
        ]);

        this.subscription = new Subscription(this.subscription);
    }

    @beforeUpdate()
    @beforeCreate()
    @afterLoad()
    public initializeActive() {
        this.scoring = this.scoring || {};
        this.stockManagement = this.stockManagement ?? false;
        this.owners = this.owners || [];
        this.valid = this.isValid();
        this.active = this.isActive();
    }

    public isActive(): boolean {
        if (!this.activeBy[VendorActiveBy.SYSTEM]) {
            return false;
        }

        if (!this.activeBy[VendorActiveBy.VENDOR]) {
            return false;
        }

        if (!this.subscription.isActive()) {
            return false;
        }

        if (!this.isValid()) {
            return false;
        }

        return true;
    }

    public isValid(): boolean {
        if (!this.subscription) {
            return false;
        }

        if (!this.defaultTaxRate) {
            return false;
        }

        if (!this.defaultCurrency) {
            return false;
        }

        return true;
    }

    public setSubscription(subscription: Subscription) {
        this.subscription = subscription;
    }

    public setDefaultTaxRate(taxRate: TaxRateDocument) {
        this.defaultTaxRate = taxRate;
    }

    public setDefaultCurrency(currency: string) {
        this.defaultCurrency = currency;
    }

    public enableStockManagement() {
        this.stockManagement = true;
    }

    public disableStockManagement() {
        this.stockManagement = false;
    }

    public addOwner(user: any) {
        this.owners = uniq([...this.owners, (user?._id || user)]);
    }

    public removeOwner(user: any) {
        this.owners = this.owners.filter((item) => item === (user?._id || user));
    }

    // READ_AS
    public readAsAdmin() {
        return {
            ...this,
            lastPopulateOptions: null
        };
    }

    public readAsPublic() {
        return {
            ...this,
            lastPopulateOptions: null
        };
    }

    public challengeAbility(ability: string, comparator?: (value: any) => boolean) {
        const ableTo = this.checkAbility(ability, comparator);

        if (!ableTo) {
            throw new Forbidden('NotAbleToCallFeatureWithoutAbilities', {
                ability: ability,
                abilities: this.subscription.abilities
            });
        }
    }

    public checkAbility(ability: string, comparator?: (value: any) => boolean) {
        return comparator ? comparator(get(this.subscription.abilities, ability)) : get(this.subscription.abilities, ability);
    }

    // Ability Checks

    public checkAbilityProductCreate(data: any) {
        this.challengeAbility('maxProductImages', (value) => (value >= (data.images?.length ?? 0)));
        this.challengeAbility('maxProductVideos', (value) => (value >= (data.videos?.length ?? 0)));
    }

    public checkAbilityProductUpdate(data: any) {
        this.challengeAbility('maxProductImages', (value) => (value >= (data.images?.length ?? 0)));
        this.challengeAbility('maxProductVideos', (value) => (value >= (data.videos?.length ?? 0)));
    }

    public checkAbilityManageBasicData() {
        this.challengeAbility('manageVendorBasicData');
    }

    public checkAbilityManageGeneralData() {
        this.challengeAbility('manageVendorGeneralData');
    }

    public checkAbilityManageProduct() {
        this.challengeAbility('manageVendorProducts');
    }

    public checkAbilityManageVariants() {
        this.challengeAbility('manageVendorVariants');
    }

    public getArtifact(): VendorArtifact {
        return {
            _id: this._id,
            title: this.title,
            description: this.description,
            defaultCurrency: this.defaultCurrency,
            defaultTaxRate: this.defaultTaxRate.getPresenter(),
            providerPayload: this.providerPayload
        };
    }
}
