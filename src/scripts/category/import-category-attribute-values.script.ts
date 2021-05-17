import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { CategoryDocument } from '../../documents/product/category.document';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

@injectable()
export class ImportCategoryAttributeValuesScript extends BaseScript {
    @inject()
    public productService: ProductService;

    @inject()
    public categoryService: CategoryService;

    public async run(args) {
        const allCategories = await this.categoryService.repository.findMany();

        for (const category of allCategories) {
            await this.importAllProductAttributeValueByCategory(category);
        }
    }

    private async importAllProductAttributeValueByCategory(category: CategoryDocument) {
        const productsInCategory = await this.productService.getAllByCategory(category);

        const values = {};

        for (const product of productsInCategory) {
            for (const key of Object.keys(product.attributeValues)) {
                values[key] = values[key] ?? [];

                for (const value of product.attributeValues[key]) {
                    const index = values[key].findIndex((i) => (i.value === value));

                    if (index === -1) {
                        values[key].push({
                            value: value,
                            occurrence: 1
                        });
                    } else {
                        values[key][index].occurrence++;
                    }
                }
            }
        }

        category.attributeValues = values;

        return category.save();
    }
}
