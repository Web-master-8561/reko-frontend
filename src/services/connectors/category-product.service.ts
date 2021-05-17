import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { FactoryBuilder } from '../../libs/subject.factory';

@injectable()
export class CategoryProductService {
    public categoryAddAttribute$ = new FactoryBuilder();
    public categoryRemoveAttribute$ = new FactoryBuilder();
}
