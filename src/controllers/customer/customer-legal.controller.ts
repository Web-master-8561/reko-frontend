import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { UserService } from '../../services/user/user.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class CustomerLegalController extends BaseController {
    @inject()
    public userService: UserService;

    @onInit()
    public initialize() {
        this.json.get('/accept-privacy-policy', this.acceptPrivacyPolicy.bind(this));
        this.json.get('/accept-terms-of-use', this.acceptTermsOfUse.bind(this));
    }

    public async acceptPrivacyPolicy(req: Request) {
        const user = this.getRequestUser(req);

        await this.userService.acceptPrivacyPolicy(user);

        return this.userService.normalize(user);
    }

    public async acceptTermsOfUse(req: Request) {
        const user = this.getRequestUser(req);

        await this.userService.acceptTermsOfUse(user);

        return this.userService.normalize(user);
    }
}
