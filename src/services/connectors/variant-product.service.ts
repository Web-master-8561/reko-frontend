import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { FactoryBuilder } from '../../libs/subject.factory';

@injectable()
export class VariantProductService {
    public variantUpdateAttributeValues$ = new FactoryBuilder();

    public productNormalize$ = new FactoryBuilder();
    public variantUpdate$ = new FactoryBuilder();
}
