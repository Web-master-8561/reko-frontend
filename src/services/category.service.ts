import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { FindOneOptions } from '@kifly/boxer/src/collections/collection';
import { AttributeDocument } from '../documents/product/attribute.document';
import { CategoryDocument } from '../documents/product/category.document';

import { ArchiveRepository } from '../libs/repository/archive.repository';
import { CategoryProductService } from './connectors/category-product.service';

@injectable()
export class CategoryService extends ArchiveRepository<CategoryDocument> {
    @inject()
    public connection: Connection;

    @inject()
    public categoryProductConnector: CategoryProductService;

    // @ts-ignore
    public repository = new ArchiveRepository<CategoryDocument>(CategoryDocument, this.connection);

    public async getBySlug(slug: string, options: FindOneOptions<any> = {}) {
        return this.repository.findOne({
            slugs: {
                $in: [slug]
            }
        } as any, options);
    }

    public async create(data: any): Promise<CategoryDocument> {
        try {
            const instance = new CategoryDocument();

            instance.title = data?.title;
            instance.description = data?.description;
            instance.icon = data?.icon;

            for (const slug of (data?.slugs || [])) {
                instance.addSlug(slug);
            }

            return instance.save();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async addAttribute(category: CategoryDocument, attribute: AttributeDocument) {
        await category.addAttribute(attribute);
        await category.save();

        await this.categoryProductConnector.categoryAddAttribute$.build(category);

        return category;
    }

    public async removeAttribute(category: CategoryDocument, attribute: AttributeDocument) {
        await category.removeAttribute(attribute);
        await category.save();

        await this.categoryProductConnector.categoryRemoveAttribute$.build(category);

        return category;
    }
}
