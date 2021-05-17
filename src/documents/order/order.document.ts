import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { IsDefined, ValidateIf, ValidateNested } from 'class-validator';
import { v4 } from 'uuid';
import { PayableItem } from '../../modules/libs/payable/libs/payable-type';
import { Payable, PayableDocument } from '../../modules/libs/payable/payable.document';
import { Address } from '../libs/address';
import { ProductArtifact } from '../product/product.document';
import { VariantArtifact } from '../product/variant.document';
import { VendorArtifact } from '../vendor/vendor.document';
import { CompanyInfo } from './libs/company-info';
import { PersonalInfo } from './libs/personal-info';

export interface OrderItem extends PayableItem {
    variantArtifact: VariantArtifact;
    productArtifact: ProductArtifact;
    amount: number;
}

export interface Order extends Payable {
    items?: OrderItem[];
}

@document({
    collection: 'order',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: []
})
export class OrderDocument extends PayableDocument<Order> {
    @property()
    public identifier: string;

    @IsDefined({ message: 'required' })
    @property()
    public payableItems: OrderItem[] = [];

    @property()
    public user: string;

    @IsDefined({ message: 'required' })
    @property()
    public email: string;

    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public shippingAddressArtifact: Address;

    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public billingAddressArtifact: Address;

    @ValidateIf((instance) => !instance.companyInfoArtifact)
    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public personalInfoArtifact: PersonalInfo;

    @ValidateIf((instance) => !instance.personalInfoArtifact)
    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public companyInfoArtifact: CompanyInfo;

    @IsDefined({ message: 'required' })
    @property()
    public vendorArtifact: VendorArtifact;

    @property()
    public publicToken: string;

    @beforeCreate()
    public initPublicToken() {
        this.publicToken = v4();
    }

    @afterLoad()
    public initialize() {
        this.personalInfoArtifact = this.personalInfoArtifact ? new PersonalInfo(this.personalInfoArtifact) : null;
        this.companyInfoArtifact = this.companyInfoArtifact ? new CompanyInfo(this.companyInfoArtifact) : null;
        this.billingAddressArtifact = this.billingAddressArtifact ? new Address(this.billingAddressArtifact) : null;
        this.shippingAddressArtifact = this.shippingAddressArtifact ? new Address(this.shippingAddressArtifact) : null;
    }

    /**
     * @Overrides
     */
    public async getTransaction(payload: any = {}) {
        return {
            currency: (this.vendorArtifact.defaultCurrency || this.currency).toString(),
            orderId: this._id,
            orderPayload: {
                vendor: this.vendorArtifact._id,
                order: this._id,
                currency: (this.vendorArtifact.defaultCurrency || this.currency).toString(),
                publicToken: this.publicToken
            },
            transaction: {
                items: [
                    ...this.payableItems.map((item) => ({
                        sku: item.variantArtifact.sku || item.variantArtifact._id,
                        title: item.variantArtifact.title || item.variantArtifact.sku || item.variantArtifact._id,
                        description: item.variantArtifact.description || item.variantArtifact.sku || item.variantArtifact._id,
                        quantity: item.amount,
                        unitPrice: item.price
                    }))
                    // TODO -> ATTENTION! Itt még a kedvezményt hozzá kell majd adnom (negative value)
                    // TODO -> ATTENTION! + Szállítás
                ]
            },
            total: await this.getPrice()
        };
    }
}
