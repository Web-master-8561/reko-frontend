import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { VariantProductService } from '../../services/connectors/variant-product.service';
import { ProductService } from '../../services/product.service';

@injectable()
export class ProductNormalizeScript extends BaseScript {
    @inject()
    public productService: ProductService;

    @inject()
    public variantProductConnector: VariantProductService;

    public async run(args) {
        const products = await this.productService.productRepository.findMany({}, { scope: DefaultScope });

        for (const item of products) {
            await item.save();

            await this.productService.normalize(item);
        }
    }
}
