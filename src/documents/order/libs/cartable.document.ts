import { Archive, ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { afterLoad } from '@kifly/boxer/src/document/decorators/lifecycle/after-load';
import { beforeCreate } from '@kifly/boxer/src/document/decorators/lifecycle/before-create';
import { beforeUpdate } from '@kifly/boxer/src/document/decorators/lifecycle/before-update';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { HideableScope } from '../../../libs/scopes/hideable.scope';
import { ProductDocument } from '../../product/product.document';
import { VariantDocument } from '../../product/variant.document';
import { Vendor, VendorDocument } from '../../vendor/vendor.document';

export interface CartableItem {
    amount: number;
    variant: VariantDocument;
    product?: ProductDocument;
}

export interface Cartable extends Archive {
    items?: CartableItem[];
    vendor?: Vendor;
}

@document({
    defaultScope: HideableScope,
    defaultPopulateScope: ArchiveScope,
    indices: []
})
export class CartableDocument<T> extends ArchiveDocument<Cartable & T> {
    @property()
    public hidden: boolean;

    @property()
    public items: CartableItem[];

    @ref(() => VendorDocument)
    public vendor: VendorDocument;

    @afterLoad()
    public async initialize() {
        this.items = this.items || [];

        await this.populate([
            { path: 'vendor' }
        ]);
    }

    @afterLoad()
    private async transformItemsFromDatabase() {
        for (let index in this.items) {
            const variant = await this.getContext().connection.collection<VariantDocument>(VariantDocument).findOneById(this.items[index].variant);
            const product = await this.getContext().connection.collection<ProductDocument>(ProductDocument).findOne({ variants: { $in: [variant?._id] } } as any);

            this.items[index].variant = variant;
            this.items[index].product = product;
        }

        this.items = this.items.filter((item) => !!item.variant && !!item.product);
    }

    @beforeCreate()
    @beforeUpdate()
    private transformItemsToDatabase() {
        this.hidden = this.hidden ?? false;

        this.items = this.items.map((item) => ({
            amount: item.amount,
            variant: (item.variant?._id || item.variant).toString()
        })) as any;
    }
}
