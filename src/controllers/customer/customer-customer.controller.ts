import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { UserService } from '../../services/user/user.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class CustomerCustomerController extends BaseController {
    @inject()
    public userService: UserService;

    @onInit()
    public initialize() {
        this.json.put('/', this.update.bind(this));
    }

    public async update(req: Request) {
        const user = this.getRequestUser(req);

        await this.userService.meta.set(user, 'firstName', req.body.firstName ?? user.meta.firstName);
        await this.userService.meta.set(user, 'lastName', req.body.lastName ?? user.meta.lastName);
        await this.userService.meta.set(user, 'birthDate', req.body.birthDate ?? user.meta.birthDate);
        await this.userService.meta.set(user, 'phone', req.body.phone ?? user.meta.phone);
        await this.userService.meta.set(user, 'profilePicture', req.body.profilePicture ?? user.meta.profilePicture);
        await this.userService.meta.set(user, 'defaultShippingAddress', req.body.defaultShippingAddress ?? user.meta.defaultShippingAddress);
        await this.userService.meta.set(user, 'defaultBillingAddress', req.body.defaultBillingAddress ?? user.meta.defaultBillingAddress);

        return this.userService.normalize(user);
    }
}
