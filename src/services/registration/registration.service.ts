import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { BadRequest, InternalServerError } from '@kifly/beagle/modules/express/errors';
import { FacebookService } from '@kifly/beagle/modules/facebook/facebook.service';
import { GoogleService } from '@kifly/beagle/modules/google/google.service';
import { randomBytes } from 'crypto';
import { BaseService } from '../libs/base.service';
import { User } from '../user/user';
import { UserService } from '../user/user.service';

@injectable()
export class RegistrationService extends BaseService {
    @inject()
    public userService: UserService;

    @inject()
    public facebookService: FacebookService;

    @inject()
    public googleService: GoogleService;

    public async register(type: string, credentials: any): Promise<User> {
        switch (type) {
            case 'password':
                return this.registerPassword(credentials);
            case 'facebook':
                return this.registerFacebook(credentials);
            case 'google':
                return this.registerGoogle(credentials);
            default:
                throw new InternalServerError('UnsupportedProvider');
        }
    }

    public async registerPassword(credentials: any) {
        if (!this.settings.allowedRegistrationTypes.includes('password')) {
            throw new BadRequest('UnsupportedRegistrationType');
        }

        this.checkDocuments(credentials);

        const email = credentials?.email;
        const password = credentials?.password;
        const rePassword = credentials?.rePassword;

        if (!email) {
            throw new BadRequest('MissingEmail');
        }

        if (!password) {
            throw new BadRequest('MissingPassword');
        }

        if (!rePassword) {
            throw new BadRequest('MissingRePassword');
        }

        if (password !== rePassword) {
            throw new BadRequest('PasswordMismatch');
        }

        const current = await this.userService.user.findByEmail(email);

        if (current) {
            throw new BadRequest('UserAlreadyExists');
        }

        const user = await this.userService.user.create({
            email: email
        });

        if (!user) {
            throw new InternalServerError('UnableToCreateUser');
        }

        await this.userService.validation.setPassword(user, password);
        await this.userService.meta.set(user, 'hasPasswordValidation', true);
        await this.userService.meta.set(user, 'registrationType', 'password');
        await this.userService.user.activate(user);

        if (credentials?.firstName) {
            await this.userService.meta.set(user, 'firstName', credentials.firstName);
        }

        if (credentials?.lastName) {
            await this.userService.meta.set(user, 'lastName', credentials.lastName);
        }

        await this.userService.meta.set(user, 'acceptedTermsOfUse', true);
        await this.userService.meta.set(user, 'acceptedPrivacyPolicy', true);

        return this.userService.normalize(user);
    }

    public async registerFacebook(credentials: any) {
        const accessToken = credentials?.accessToken;

        if (!accessToken) {
            throw new BadRequest('MissingAccessToken');
        }

        const facebookUser = await this.facebookService.me(accessToken, [
            'first_name',
            'last_name'
        ]);

        if (!facebookUser?.email) {
            throw new BadRequest('UnableToGetFacebookEmail');
        }

        const current = await this.userService.user.findByEmail(facebookUser?.email);

        if (current) {
            throw new BadRequest('UserAlreadyExists');
        }

        const user = await this.userService.user.create({
            email: facebookUser?.email
        });

        if (!user) {
            throw new InternalServerError('UnableToCreateUser');
        }

        await this.userService.validation.setPassword(user, randomBytes(50).toString('hex'));
        await this.userService.meta.set(user, 'hasPasswordValidation', false);
        await this.userService.meta.set(user, 'registrationType', 'facebook');
        await this.userService.user.activate(user);

        if (facebookUser?.first_name) {
            await this.userService.meta.set(user, 'firstName', facebookUser?.first_name);
        }

        if (facebookUser?.last_name) {
            await this.userService.meta.set(user, 'lastName', facebookUser?.last_name);
        }

        await this.userService.meta.set(user, 'acceptedTermsOfUse', true);
        await this.userService.meta.set(user, 'acceptedPrivacyPolicy', true);

        return this.userService.normalize(user);
    }

    public async registerGoogle(credentials: any) {
        const accessToken = credentials?.accessToken || credentials?.idToken;

        if (!accessToken) {
            throw new BadRequest('MissingAccessToken');
        }

        const googleUser = await this.googleService.me(accessToken);

        if (!googleUser?.email) {
            throw new BadRequest('UnableToGetGoogleEmail');
        }

        if (!googleUser.email_verified) {
            throw new BadRequest('UnverifiedGoogleEmail');
        }

        const current = await this.userService.user.findByEmail(googleUser?.email);

        if (current) {
            throw new BadRequest('UserAlreadyExists');
        }

        const user = await this.userService.user.create({
            email: googleUser?.email
        });

        if (!user) {
            throw new InternalServerError('UnableToCreateUser');
        }

        await this.userService.validation.setPassword(user, randomBytes(50).toString('hex'));
        await this.userService.meta.set(user, 'hasPasswordValidation', false);
        await this.userService.meta.set(user, 'registrationType', 'google');
        await this.userService.user.activate(user);

        if (googleUser?.given_name) {
            await this.userService.meta.set(user, 'firstName', googleUser?.given_name);
        }

        if (googleUser?.family_name) {
            await this.userService.meta.set(user, 'lastName', googleUser?.family_name);
        }

        await this.userService.meta.set(user, 'acceptedTermsOfUse', true);
        await this.userService.meta.set(user, 'acceptedPrivacyPolicy', true);

        return this.userService.normalize(user);
    }

    private checkDocuments(credentials: any) {
        if (!credentials?.acceptedTermsOfUse) {
            throw new BadRequest('TermsOfUseMustBeAccepted');
        }

        if (!credentials?.acceptedPrivacyPolicy) {
            throw new BadRequest('PrivacyAndPolicyMustBeAccepted');
        }
    }
}
