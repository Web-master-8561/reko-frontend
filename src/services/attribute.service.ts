import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { Attribute } from '../documents/libs/attribute';
import { AttributeDocument } from '../documents/product/attribute.document';
import { VendorDocument } from '../documents/vendor/vendor.document';
import { ArchiveRepository } from '../libs/repository/archive.repository';

@injectable()
export class AttributeService {
    @inject()
    public connection: Connection;

    // @ts-expect-error
    public attributeRepository = new ArchiveRepository<AttributeDocument>(AttributeDocument, this.connection);

    public create(payload: Attribute, vendor: VendorDocument = null) {
        const instance = new AttributeDocument();

        instance.key = payload.key;
        instance.title = payload.title;
        instance.vendor = vendor;

        return instance.save();
    }

    public update(attribute: AttributeDocument, data: any) {
        attribute.key = data.key ?? attribute.key;
        attribute.title = data.title ?? attribute.title;

        // Itt kell normalizálni, hogy a változtatások lefussan lejjebb is (termékek, variánsok)

        return attribute.save();
    }
}
