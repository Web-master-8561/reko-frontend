import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { IsDefined, ValidateIf, ValidateNested } from 'class-validator';
import { Address } from '../libs/address';
import { CartDocument } from './cart.document';
import { Cartable, CartableDocument } from './libs/cartable.document';
import { CompanyInfo } from './libs/company-info';
import { PersonalInfo } from './libs/personal-info';

export interface Checkout extends Cartable {
    shippingAddress?: Address;
    billingAddress?: Address;
    personalInfo: PersonalInfo;
    companyInfo: CompanyInfo;
    user?: string;
    email?: string;
}

@document({
    collection: 'checkout',
    indices: []
})
export class CheckoutDocument extends CartableDocument<Checkout> {
    @ref(() => CartDocument)
    public cart: CartDocument;

    @property()
    public user: string;

    @IsDefined({ message: 'required' })
    @property()
    public email: string;

    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public shippingAddress: Address;

    @IsDefined({ message: 'required' })
    @ValidateNested()
    @property()
    public billingAddress: Address;

    @ValidateIf((instance) => !instance.companyInfo)
    @ValidateNested()
    @IsDefined({ message: 'required' })
    @property()
    public personalInfo: PersonalInfo;

    @ValidateIf((instance) => !instance.personalInfo)
    @ValidateNested()
    @IsDefined({ message: 'required' })
    @property()
    public companyInfo: CompanyInfo;

    @property()
    public orderable: any;

    @IsDefined({ message: 'required' })
    @property()
    public paymentType: string;

    @afterLoad()
    @beforeUpdate()
    @beforeCreate()
    public async initialize() {
        const errors = await this.validate(false);
        this.orderable = !errors.length;

        this.personalInfo = this.personalInfo ? new PersonalInfo(this.personalInfo) : null;
        this.companyInfo = this.companyInfo ? new CompanyInfo(this.companyInfo) : null;
        this.billingAddress = this.billingAddress ? new Address(this.billingAddress) : null;
        this.shippingAddress = this.shippingAddress ? new Address(this.shippingAddress) : null;
    }
}
