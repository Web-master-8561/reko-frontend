import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { RegistrationService } from '../../services/registration/registration.service';
import { UserService } from '../../services/user/user.service';

@injectable()
export class PublicRegistrationController extends Controller {
    @inject()
    public registration: RegistrationService;

    @inject()
    public gateway: UserService;

    @onInit()
    public initialize() {
        this.json.post('/', this.register.bind(this));
    }

    public async register(req: Request) {
        if (!req.body.type) {
            throw new BadRequest('MissingType');
        }

        if (!req.body.credentials) {
            throw new BadRequest('MissingCredentials');
        }

        return this.registration.register(req.body.type, req.body.credentials);
    }
}
