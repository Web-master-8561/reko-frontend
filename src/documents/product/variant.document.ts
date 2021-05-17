import { Archive, ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { refs } from '@kifly/boxer/src/document/decorators/refs';
import { IsDefined } from 'class-validator';
import { clone } from 'lodash';
import { TaxRatePresenter } from '../libs/tax-rate/tax-rate.presenter';
import { AttributeDocument } from './attribute.document';

export interface VariantArtifact {
    _id: string;
    sku?: string;
    price: number;
    grossPrice: number;
    hasDiscount: boolean;
    image: string;
    title: string;
    description: string;
    taxRate: TaxRatePresenter;
}

export interface Variant extends Archive {
    discountGrossPrice?: number;
    title?: string;
    description?: string;
    image?: string;
}

@document({
    collection: 'variant',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: []
})
export class VariantDocument extends ArchiveDocument<Variant> {
    @property()
    public discountGrossPrice: number | null;

    @IsDefined({ message: 'required' })
    @property()
    public title: string;

    @property()
    public description: string;

    @property()
    public image: string;

    @property()
    public inStock: boolean = false;

    @property()
    public stock: number = 0;

    @property()
    public stockEnabled: boolean;

    @refs(() => AttributeDocument)
    public attributes: AttributeDocument[] = [];

    @property()
    public attributeValues: Record<string, any>;

    @property()
    public sku: string;

    /**
     * Only for performance improvements|searching
     */
    @property()
    public price: number;

    @IsDefined({ message: 'required' })
    @property()
    public grossPrice: number;

    /**
     * Only for performance improvements|searching
     */
    @property()
    public discounted: boolean;

    /**
     * Only for performance improvements|searching
     */
    @property()
    public discountRate: number;

    @property()
    public taxRate: TaxRatePresenter;

    @property()
    public currency: string;

    @property()
    public scoring: any;

    @beforeUpdate()
    @beforeCreate()
    @afterLoad()
    public async initialize() {
        this.scoring = this.scoring || {};
        this.attributeValues = this.attributeValues || {};
        this.taxRate = new TaxRatePresenter(this.taxRate);

        this.price = this.getPrice();
        this.grossPrice = this.getGrossPrice();
        this.discountGrossPrice = this.getDiscountGrossPrice();

        /**
         * dP = oP * (1 - dR) ==> -(dP / oP) + 1 = dR
         */
        this.discountRate = -(this.getDiscountGrossPrice() / this.getGrossPrice()) + 1;
        this.discounted = this.getDiscountGrossPrice() !== this.getGrossPrice();

        await this.normalize();
    }

    @beforeCreate()
    @beforeUpdate()
    public async initializeStock() {
        this.inStock = await this.isInStock();
    }

    public async normalize() {
        await this.normalizeAttributeValues();
    }

    public async normalizeAttributeValues() {
        await this.populate([
            { path: 'attributes' }
        ]);

        const values = clone(this.attributeValues || {});
        this.attributeValues = {};

        for (const attribute of this.attributes) {
            this.attributeValues[attribute.key] = values[attribute.key] ?? null;
        }
    }

    public async isInStock(): Promise<boolean> {
        if (!this.stockEnabled) {
            return true;
        }

        return this.stock > 0;
    }

    public getPrice(): number {
        const discountGrossPrice = this.getDiscountGrossPrice();
        const grossPrice = this.getGrossPrice();

        return (discountGrossPrice !== grossPrice) ? discountGrossPrice : grossPrice;
    }

    public getGrossPrice(): number {
        return parseFloat(Math.max(0, this.grossPrice) as any);
    }

    public getDiscountGrossPrice(): number {
        return parseFloat(Math.max(0, this.discountGrossPrice) as any);
    }

    public getDiscountRate(): number {
        return parseFloat(Math.max(0, this.discountRate) as any);
    }

    public isDiscounted(): boolean {
        return this.discounted;
    }

    public getKeywords(): string[] {
        return [
            this.title,
            this.description
        ];
    }

    public setAttributeValues(values: any) {
        this.attributeValues = values;
    }

    public setAttributeValue(key: string, value: any) {
        if (this.attributeValues[key] === undefined) {
            return;
        }

        this.attributeValues[key] = value;
    }

    public removeStock(amount: number) {
        if (!this.stockEnabled) {
            return;
        }

        this.stock = Math.max(0, this.stock - amount);
    }

    public addStock(amount: number) {
        if (!this.stockEnabled) {
            return;
        }

        this.stock = Math.max(0, this.stock + amount);
    }

    public readAsPublic() {
        return {
            ...this,
            lastPopulateOptions: null
        };
    }

    public getArtifact(): VariantArtifact {
        return {
            _id: this._id,
            sku: this.sku,
            price: this.getPrice(),
            grossPrice: this.getGrossPrice(),
            taxRate: this.taxRate,
            hasDiscount: this.isDiscounted(),
            image: this.image,
            title: this.title,
            description: this.description
        };
    }
}
