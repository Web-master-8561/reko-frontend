import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Arguments } from 'yargs';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryService } from '../../../services/category.service';
import { categories } from './categories';

@injectable()
export class SeedCategoriesScript extends BaseScript {
    @inject()
    public category: CategoryService;

    @inject()
    public attribute: AttributeService;

    public async run(args: Arguments<any>) {
        for (const category of categories) {
            const exists = await this.category.repository.findOne({ slugs: { $in: category.slugs } });

            if (!exists) {
                const attributes = await this.createAttributes(category.attributes);

                const created = await this.category.create(category);

                for (const attr of attributes) {
                    await this.category.addAttribute(created, attr);
                }
            }
        }
    }

    public async createAttributes(attributes: any[]) {
        const result = [];

        for (const attribute of attributes) {
            const exists = await this.attribute.attributeRepository.findOne({ vendor: null, key: attribute.key, title: attribute.title });

            if (exists) {
                result.push(exists);
                continue;
            }

            const item = await this.attribute.create({
                key: attribute.key,
                title: attribute.title
            });

            result.push(item);
        }

        return result;
    }
}
