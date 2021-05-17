import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicContentController extends BaseController {
    @inject()
    public vendorService: VendorService;

    @onInit()
    public initialize() {
        this.json.get('/homepage-carousel', this.homePageCarousel.bind(this));
    }

    public homePageCarousel() {
        return [];
    }
}
