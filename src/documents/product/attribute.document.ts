import { ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { IsDefined } from 'class-validator';
import { VendorDocument } from '../vendor/vendor.document';

@document({
    collection: 'attribute',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: [
        { fieldOrSpec: { key: 1, vendor: 1 } }
    ]
})
export class AttributeDocument extends ArchiveDocument<any> {
    @IsDefined({ message: 'required' })
    @property()
    public key: string;

    @IsDefined({ message: 'required' })
    @property()
    public title: string;

    @ref(() => VendorDocument)
    public vendor: VendorDocument;
}
