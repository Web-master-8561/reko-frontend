import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Arguments } from 'yargs';
import { RegistrationService } from '../../services/registration/registration.service';
import { UserService } from '../../services/user/user.service';

@injectable()
export class SeedDeveloper extends BaseScript {
    @inject()
    public userService: UserService;

    @inject()
    public registration: RegistrationService;

    public async run(args: Arguments<any>): Promise<any> {
        const email = args.email;
        const password = args.password;

        if (!email) {
            throw new Error('MissingEmail');
        }

        if (!password) {
            throw new Error('MissingPassword');
        }

        const user = await this.registration.registerPassword({
            email: email,
            password: password,
            rePassword: password,
            acceptedTermsOfUse: true,
            acceptedPrivacyPolicy: true
        });

        // await this.userService.user.activate(user);
        await this.userService.user.verify(user);
        // await this.userService.acceptPrivacyPolicy(user);
        // await this.userService.acceptTermsOfUse(user);

        return user;
    }
}
