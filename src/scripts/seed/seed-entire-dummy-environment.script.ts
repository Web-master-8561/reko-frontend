import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { randomBytes } from 'crypto';
import { range, sample } from 'lodash';
import { Arguments } from 'yargs';
import { VendorActiveBy } from '../../documents/vendor/vendor.document';
import { AttributeService } from '../../services/attribute.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { TaxRateService } from '../../services/tax-rate.service';
import { VariantService } from '../../services/variant.service';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class SeedEntireDummyEnvironmentScript extends BaseScript {
    @inject()
    public connection: Connection;

    @inject()
    public vendorService: VendorService;

    @inject()
    public categoryService: CategoryService;

    @inject()
    public productService: ProductService;

    @inject()
    public variantService: VariantService;

    @inject()
    public taxRate: TaxRateService;

    @inject()
    public attributeService: AttributeService;

    public async run(args: Arguments<any>) {
        console.log('Seeding dummy environment');

        await this.connection.client.db('default').dropDatabase();

        console.log('Seeding tax rates');

        await this.application.runScript('seed-tax-rate', null);

        console.log('Seeding categories');

        await this.application.runScript('seed-categories', null);

        console.log('Seeding developer');

        const user = await this.application.runScript('seed-developer', {
            email: `${randomBytes(10).toString('hex')}@kekstore.dev`,
            password: 'abcd1234'
        });

        const numberOfVendors = 5;

        console.log('Seeding vendors');

        for (const _ of range(numberOfVendors)) {
            await this.application.runScript('seed-vendor', null);
        }

        const allVendors = await this.vendorService.vendorRepository.findMany();
        const randomTaxRate = await this.taxRate.taxRateRepository.findOne();

        console.log('Seeding vendors - activate vendors');

        for (const item of allVendors) {
            await this.vendorService.activateBy(VendorActiveBy.VENDOR, item);
            await this.vendorService.setDefaultTaxRate(item, randomTaxRate);
            await this.vendorService.setDefaultCurrency(item, 'HUF');

            await this.vendorService.addOwner(item, user as any);
        }

        console.log('Seeding products');

        await this.application.runScript('seed-products', {
            numberOfProducts: 5,
            numberOfVariants: 2
        });

        console.log('Seeding categories according to products');

        await this.addRandomCategoryToProducts();

        console.log('Seeding category attribute values');

        await this.application.runScript('import-category-attribute-values', null);

        console.log('Done - You can login with user ->', user);
    }

    public async addRandomCategoryToProducts() {
        const allProducts = await this.productService.productRepository.findMany();
        const allCategories = await this.categoryService.repository.findMany();

        for (const product of allProducts) {
            const sampleCategory = sample(allCategories);

            await this.productService.addCategory(product, sampleCategory);

            console.log(`Add category to Product(${product._id})`);
        }
    }
}
