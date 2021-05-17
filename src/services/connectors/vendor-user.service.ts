import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { FactoryBuilder } from '../../libs/subject.factory';

@injectable()
export class VendorUserService {
    public vendorAddOwner = new FactoryBuilder();
    public vendorRemoveOwner = new FactoryBuilder();
}
