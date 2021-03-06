import { Archive, ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { refs } from '@kifly/boxer/src/document/decorators/refs';
import { IsDefined } from 'class-validator';
import { clone, compact, get, last, uniq, uniqBy } from 'lodash';
import { TaxRatePresenter } from '../libs/tax-rate/tax-rate.presenter';
import { VendorDocument } from '../vendor/vendor.document';
import { AttributeDocument } from './attribute.document';
import { CategoryDocument } from './category.document';
import { PriceHistoryArtifact } from './libs/product-history.artifact';
import { VariantDocument } from './variant.document';

export interface ProductArtifact {
    _id: string;
    images: string[];
    title: string;
    description: string;
}

export enum ProductActiveBy {
    VENDOR = 'vendor',
    PRODUCT = 'product',
    VENDOR_SUBSCRIPTION = 'vendor-subscription'
}

export interface Product extends Archive {
    title?: string;
    description?: string;
    tags?: string[];
}

@document({
    collection: 'product',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: [
        { fieldOrSpec: { active: 1 } },
        { fieldOrSpec: { title: 'text', description: 'text', _id: 'text', tags: 'text', slugs: 'text' } }
        // { fieldOrSpec: { slugs: 1 }, options: { unique: true } }
    ]
})
export class ProductDocument extends ArchiveDocument<Product> {
    @property()
    public activeBy = {
        [ProductActiveBy.VENDOR]: true,
        [ProductActiveBy.PRODUCT]: true,
        [ProductActiveBy.VENDOR_SUBSCRIPTION]: false
    };

    @IsDefined({ message: 'required' })
    @property()
    public images: string[];

    @IsDefined({ message: 'required' })
    @property()
    public videos: string[];

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - nem kell manu??lisan be??ll??tani
     * - eld??nti, hogy a term??k akt??v-e vagy nem (megjelenik-e a public oldalon)
     */
    @property()
    public active: boolean;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     */
    @property()
    public minPrice: number;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     * - ??rt??kv??ltoz??s felt??telezhet??, abban az esetben, ha a term??ket tulajdonl?? vendor defaultTaxRate-je v??ltozik
     */
    @property()
    public minGrossPrice: number;

    /**
     * Same as minPrice
     */
    @property()
    public maxPrice: number;

    /**
     * Same as minGrossPrice
     */
    @property()
    public maxGrossPrice: number;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     */
    @property()
    public minDiscountRate: number;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     */
    @property()
    public maxDiscountRate: number;

    @property()
    public minDiscountGrossPrice: number;

    @property()
    public maxDiscountGrossPrice: number;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     * - megmondja, hogy a term??knek van-e akci??s vari??nsa
     */
    @property()
    public discounted: boolean;

    /**
     * A term??k neve
     * - azon kev??s property ??rt??ke, mely f??ggetlen a normaliz??l??st??l
     */
    @IsDefined({ message: 'required' })
    @property()
    public title: string;

    /**
     * A term??k le??r??sa
     * - azon kev??s property ??rt??ke, mely f??ggetlen a normaliz??l??st??l
     */
    @IsDefined({ message: 'required' })
    @property()
    public description: string;

    /**
     * A term??khez tartoz?? tagek
     * - azon kev??s property ??rt??ke, mely f??ggetlen a normaliz??l??st??l
     * - ??rt??k??t a vendor adja meg, figyelembe v??ve a keres??n??l van
     */
    @property()
    public tags: string[] = [];

    /**
     * A term??k tulajdonosa
     * - ??rt??ke alapjaiban hat??rozza meg a vendor normaliz??l??sn??l v??ltoz?? propertijeinek az ??rt??ke??t
     */
    @ref(() => VendorDocument)
    public vendor: VendorDocument;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     * - k??t ??llapota l??tehet
     *  - amennyiben a vendor.stockManagement === false, az ??rt??ke minden esetben true, hiszen nem figyelj??k, hogy van-e a term??kb??l rakt??ron
     *  - amennyiben a vendor.stockManagement === true, az ??rt??ke a term??k akt??v vari??nsainak a summ??zott stock darabsz??m??t??l f??gg, mely ha > 0, akkor true, ellenkez?? esetben false
     */
    @property()
    public inStock: boolean = false;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a term??khez tartoz??, akt??v vari??nsok ??ltal kap ??rt??ket
     * - ??rt??ke a term??khez kapcsol??d?? ??sszes vari??ns summ??zott stock mennyis??ge
     */
    @property()
    public stock: number = 0;

    /**
     * ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - a vendor stockmanagement propertyj??nek a m??solata
     * - feladata eld??nteni az inStock property ki??rt??kel??s??t
     * - az??rt van ide mentve, mert ??gy az O-egy nagys??grendel alacsonyabb
     */
    @property()
    public stockEnabled: boolean;

    /**
     * ??sszetett, ??sszes??tett property, mely a normaliz??l??s alapj??n fog ??rt??ket kapni
     * - ez a property ??rja le, hogy milyen kereshet?? attrib??tumok tal??lhat??ak a term??ken
     * - ennek az ??rt??ke, majd ??r??kl??dni fog a vari??nsokra is, ahol ezek ??rt??ket kapnak
     * - a tartalma ??sszetett
     *  - tartalmaz ??rt??kekeket a kateg??ri??kb??l, mely sorokat a fromCategory === true ??rt??kkel jelzem
     *  - tartalmaz saj??t ??rt??kekekt is, melyeket a fromCategory === undefined ??rt??kkel jelzek (pontosabban a property unset)
     *
     * DISCLAIMER
     * - ha ??pp azt keresed, hogy mi alapj??n van a Vari??nsokon attribute, akkor megtal??ltad. Ezek az ??rt??kek m??sol??dnak a vari??nsokra,
     *  majd amint ott ??rt??ket kapnak j??nnek vissza a entebb l??tott attribute values propertyre
     */
    @refs(() => AttributeDocument)
    public categoryAttributes: AttributeDocument[] = [];

    @refs(() => AttributeDocument)
    public attributes: AttributeDocument[] = [];

    @refs(() => CategoryDocument)
    public categories: CategoryDocument[] = [];

    @refs(() => VariantDocument)
    public variants: VariantDocument[] = [];

    @property()
    public taxRate: TaxRatePresenter;

    @property()
    public currency: string;

    @property()
    public priceHistory: PriceHistoryArtifact[];
    /**
     * Ezt az ??rt??ket soha ne ??rd meg direktbe, mert gener??l??dik a vari??nsokr??l
     */
    @property()
    public attributeValues: Record<string, any[]>;

    @property()
    public slugs: string[];

    @property()
    public skus: string[];

    @property()
    public scoring: any;

    public primaryIdentifier: string;

    @afterLoad()
    public initializeSlugs() {
        this.primaryIdentifier = get(this.slugs, '[0]') || this._id;
    }

    @afterLoad()
    @beforeCreate()
    @beforeUpdate()
    public initializeTaxRateAfterLoad() {
        this.scoring = this.scoring || {};
        this.attributes = this.attributes || [];
        this.images = this.images || [];
        this.videos = this.videos || [];
        this.slugs = this.slugs || [];
        this.skus = this.skus || [];
        this.priceHistory = (this.priceHistory || []).map((item) => new PriceHistoryArtifact(item));
        this.taxRate = new TaxRatePresenter(this.taxRate);
    }

    @beforeCreate()
    @beforeUpdate()
    public async initialize() {
        await this.loadVariants();
        await this.normalize();
        await this.updatePriceHistory();
    }

    public async loadVendor() {
        await this.populate([
            { path: 'vendor' }
        ]);
    }

    public async loadCategoryAttributes() {
        await this.populate([
            { path: 'categoryAttributes' }
        ]);
    }

    public async loadAttributes() {
        await this.populate([
            { path: 'attributes' }
        ]);
    }

    public async loadCategories() {
        await this.populate([
            {
                path: 'categories',
                populate: [
                    { path: 'attributes' }
                ]
            }
        ]);
    }

    public async loadVariants() {
        await this.populate([
            { path: 'variants' }
        ]);

        const prices = this.variants.map((item) => item.getPrice());
        const grossPrices = this.variants.map((item) => item.getGrossPrice());
        const discountGrossPrices = this.variants.map((item) => item.getDiscountGrossPrice());
        const discountRates = this.variants.map((item) => item.getDiscountRate());

        this.minPrice = prices.reduce((acc, item) => acc <= item ? acc : item, prices[0] ?? 0);
        this.maxPrice = prices.reduce((acc, item) => acc >= item ? acc : item, prices[0] ?? 0);

        this.minGrossPrice = grossPrices.reduce((acc, item) => acc <= item ? acc : item, prices[0] ?? 0);
        this.maxGrossPrice = grossPrices.reduce((acc, item) => acc >= item ? acc : item, prices[0] ?? 0);

        this.minDiscountGrossPrice = discountGrossPrices.reduce((acc, item) => acc <= item ? acc : item, prices[0] ?? 0);
        this.maxDiscountGrossPrice = discountGrossPrices.reduce((acc, item) => acc >= item ? acc : item, prices[0] ?? 0);

        this.minDiscountRate = discountRates.reduce((acc, item) => acc <= item ? acc : item, discountRates[0] ?? 0);
        this.maxDiscountRate = discountRates.reduce((acc, item) => acc >= item ? acc : item, discountRates[0] ?? 0);

        this.discounted = this.variants.reduce((acc, item) => item.isDiscounted() ? true : acc, false);
        this.stock = this.variants.reduce((acc, item) => acc + item.stock, 0);

        this.skus = this.variants
            .filter((variant) => !!variant.sku)
            .map((variant) => variant.sku);
    }

    public async normalize() {
        await this.normalizeStockManagement();
        await this.normalizeActivity();
        await this.normalizeAttributes();
        await this.normalizeAttributeValues();
    }

    public async normalizeStockManagement() {
        await this.loadVendor();

        this.stockEnabled = this.vendor.stockManagement;
        this.inStock = await this.isInStock();
    }

    public async normalizeActivity() {
        await this.loadVendor();

        this.activeBy[ProductActiveBy.VENDOR] = this.vendor.activeBy[ProductActiveBy.VENDOR];
        this.active = await this.isActive();
    }

    public async normalizeAttributeValues() {
        await this.loadVariants();

        this.attributeValues = this.attributeValues || {};

        for (const variant of this.variants) {
            const variantKeys = Object.keys(variant.attributeValues || {});

            for (const key of variantKeys) {
                this.attributeValues[key] = this.attributeValues[key] || [];

                this.attributeValues[key].push(get(variant.attributeValues, key));

                this.attributeValues[key] = uniq(compact(clone(this.attributeValues[key])));
            }
        }
    }

    /**
     * Variants
     */
    public async addVariant(variant: VariantDocument) {
        this.variants.push(variant);

        this.variants = uniqBy(this.variants, (item) => (item._id || item).toString());
    }

    public async removeVariant(variant: VariantDocument) {
        this.variants = this.variants.filter((item) => ((item._id || item).toString() !== variant._id.toString()));
    }

    /**
     * Stock Management
     */
    public async isInStock(): Promise<boolean> {
        if (!this.stockEnabled) {
            return true;
        }

        await this.populate([
            { path: 'variants' }
        ]);

        return !!this.variants.find((item) => (item.stock > 0));
    }

    /**
     * Activity
     */
    public async activate() {
        this.activeBy[ProductActiveBy.PRODUCT] = true;

        this.active = await this.isActive();
    }

    public async deactivate() {
        this.activeBy[ProductActiveBy.PRODUCT] = false;

        this.active = await this.isActive();
    }

    public async activateByVendorSubscription() {
        this.activeBy[ProductActiveBy.VENDOR_SUBSCRIPTION] = true;

        this.active = await this.isActive();
    }

    public async deactivateByVendorSubscription() {
        this.activeBy[ProductActiveBy.VENDOR_SUBSCRIPTION] = false;

        this.active = await this.isActive();
    }

    public async isActive(): Promise<boolean> {
        if (!this.activeBy[ProductActiveBy.VENDOR]) {
            return false;
        }

        if (!this.activeBy[ProductActiveBy.VENDOR_SUBSCRIPTION]) {
            return false;
        }

        if (!this.activeBy[ProductActiveBy.PRODUCT]) {
            return false;
        }

        if (!this.images?.length) {
            return false;
        }

        if (!this.variants?.length) {
            return false;
        }

        await this.loadVendor();

        if (!this.vendor.isActive()) {
            return false;
        }

        return true;
    }

    /**
     * Price History
     */
    public getLastPriceHistory(): PriceHistoryArtifact {
        return last(this.priceHistory) || null;
    }

    public async updatePriceHistory() {
        const lastArtifact = await this.getLastPriceHistory();
        const newArtifact = await PriceHistoryArtifact.build(this);

        const lastChecksum = lastArtifact ? lastArtifact.createChecksum() : null;
        const newChecksum = newArtifact.createChecksum();

        if (lastChecksum !== newChecksum) {
            this.priceHistory.push(newArtifact);
        }
    }

    /**
     * Slugs
     */
    public addSlug(slug: string) {
        this.slugs = uniq([slug.toLowerCase(), ...(this.slugs || [])]);
    }

    public removeSlug(slug: string) {
        this.slugs = this.slugs.filter((s) => (s !== slug.toLowerCase()));
    }

    /**
     * Categories
     */
    public setCategories(categories: CategoryDocument[]) {
        this.categories = categories;
    }

    public addCategory(category: CategoryDocument) {
        this.categories = uniqBy([category, ...(this.categories || [])], (category) => category._id.toString());
    }

    public removeCategory(category: CategoryDocument) {
        this.categories = this.categories.filter((s) => (s._id.toString() !== category._id.toLowerCase()));
    }

    /**
     * Attributes
     */
    public async normalizeAttributes() {
        await this.loadCategories();
        await this.loadCategoryAttributes();
        await this.loadAttributes();

        this.categoryAttributes = this.categories.map((item) => item.attributes ?? []).flat();
        this.attributes = this.attributes.filter((item) => !!item.vendor);
    }

    public setAttributes(attributes: AttributeDocument[]) {
        this.attributes = attributes;
    }

    public async addAttribute(attribute: AttributeDocument) {
        await this.loadCategories();
        await this.loadAttributes();

        this.attributes = uniqBy([...this.attributes, attribute], (item) => item.key);
    }

    public removeAttribute(attribute: AttributeDocument) {
        this.attributes = this.attributes.filter((item) => (item) => item.key !== attribute.key);
    }

    public getArtifact(): ProductArtifact {
        return {
            _id: this._id,
            images: this.images,
            title: this.title,
            description: this.description
        };
    }

    public async getVariantAttributes(): Promise<AttributeDocument[]> {
        await this.loadCategoryAttributes();
        await this.loadAttributes();

        return uniqBy<AttributeDocument>([...this.categoryAttributes, ...this.attributes], (item) => item.key);
    }
}
