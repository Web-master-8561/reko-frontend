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
import { uniq, uniqBy } from 'lodash';
import { AttributeDocument } from './attribute.document';

export interface Category extends Archive {
    title?: string;
    description?: string;
    icon?: string;
    slug?: string;
}

@document({
    collection: 'category',
    defaultScope: ArchiveScope,
    defaultPopulateScope: ArchiveScope,
    indices: [
        { fieldOrSpec: { slugs: 1 }, options: { unique: true } }
    ]
})
export class CategoryDocument extends ArchiveDocument<Category> {
    @IsDefined({ message: 'required' })
    @property()
    public title: string;

    @property()
    public slugs: string[];

    @property()
    public description: string;

    @property()
    public icon: string;

    @refs(() => CategoryDocument)
    public children: CategoryDocument[];

    @refs(() => AttributeDocument)
    public attributes: AttributeDocument[];

    @property()
    public attributeValues: Record<string, { value: any, occurrence: number }>;

    @property()
    public scoring: any;

    @afterLoad()
    @beforeCreate()
    @beforeUpdate()
    public initialize() {
        this.attributeValues = this.attributeValues ?? {};
        this.slugs = this.slugs || [];
        this.scoring = this.scoring || {};
    }

    public addSlug(slug: string) {
        this.slugs = uniq([slug.toLowerCase(), ...(this.slugs || [])]);
    }

    public addAttribute(attribute: AttributeDocument) {
        this.attributes = uniqBy([...this.attributes, attribute], (item) => (item._id || item).toString())
            .filter((item) => !item.vendor);
    }

    public removeAttribute(attribute: AttributeDocument) {
        this.attributes = this.attributes
            .filter((item) => (item._id || item).toString() !== attribute._id.toString())
            .filter((item) => !item.vendor);
    }
}
