import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import * as faker from 'faker';
import { range } from 'lodash';
import { Arguments } from 'yargs';
import { VendorDocument } from '../../documents/vendor/vendor.document';
import { ProductService } from '../../services/product.service';
import { VariantService } from '../../services/variant.service';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class SeedProductScript extends BaseScript {
    @inject()
    public vendorService: VendorService;

    @inject()
    public productService: ProductService;

    @inject()
    public variantService: VariantService;

    public async run(args: Arguments<any>) {
        console.log('Seeding products');

        if (!args.numberOfProducts) {
            throw new Error('MissingNumberOfProducts');
        }

        if (!args.numberOfVariants) {
            throw new Error('MissingNumberOfProducts');
        }

        const numberOfProducts = parseInt(args.numberOfProducts, 10);
        const numberOfVariants = parseInt(args.numberOfVariants, 10);

        const vendors = await this.vendorService.vendorRepository.findMany();

        for (const i1 of vendors) {
            console.log(`Seeding products for vendor (${i1._id})`);

            await this.seedForVendor(i1, numberOfProducts, numberOfVariants);
        }
    }

    public async seedForVendor(vendor: VendorDocument, numberOfProducts: number = 10, numberOfVariants: number = 5): Promise<void> {
        for (const i1 of range(numberOfProducts)) {
            const product = await this.productService.create({
                title: faker.commerce.productName(),
                description: faker.commerce.productAdjective(),
                images: range(5).map(() => faker.image.imageUrl(700, 700))
            }, vendor, []);

            for (const i2 of range(numberOfVariants)) {
                const variant = await this.variantService.create({
                    title: faker.commerce.productAdjective(),
                    description: faker.commerce.color(),
                    grossPrice: faker.commerce.price(700, 1990),
                    discountGrossPrice: faker.commerce.price(500, 801),
                    stock: faker.random.number(100)
                });

                console.log(`Seeding products Variant(${variant._id}) -> Product(${product._id}) -> Vendor(${vendor._id})`);

                await this.productService.addVariant(product, variant);
            }
        }
    }
}
