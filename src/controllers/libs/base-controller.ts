import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { BadRequest, NotFound, Unauthorized } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { VendorDocument } from '../../documents/vendor/vendor.document';
import { User } from '../../services/user/user';
import { UserService } from '../../services/user/user.service';
import { VendorService } from '../../services/vendor.service';

@injectable()
export abstract class BaseController extends Controller {
    public static CACHED_USER_KEY = '_cachedUser';
    public static CACHED_VENDOR_KEY = '_cachedVendor';

    @inject()
    public vendorService: VendorService;

    @inject()
    public userService: UserService;

    public getRequestUser(req): User {
        if ((req as any)[BaseController.CACHED_USER_KEY]) {
            return (req as any)[BaseController.CACHED_USER_KEY];
        }

        throw new NotFound('UnknownUser');
    }

    public getRequestVendor(req): VendorDocument {
        if ((req as any)[BaseController.CACHED_VENDOR_KEY]) {
            return (req as any)[BaseController.CACHED_VENDOR_KEY];
        }

        throw new NotFound('UnknownVendor');
    }

    public async extractUser(req: Request, credentialCallback: (req) => string): Promise<User> {
        if ((req as any)[BaseController.CACHED_USER_KEY]) {
            return (req as any)[BaseController.CACHED_USER_KEY];
        }

        const userId = credentialCallback(req);

        if (!userId) {
            throw new Unauthorized('UnknownUser');
        }

        (req as any)[BaseController.CACHED_USER_KEY] = await this.userService.user.findById(userId);

        if (!(req as any)[BaseController.CACHED_USER_KEY]) {
            throw new Unauthorized('UnknownUser');
        }

        return (req as any)[BaseController.CACHED_USER_KEY];
    }

    public async extractUserWithoutError(req: Request, credentialCallback: (req) => string): Promise<User> {
        if ((req as any)[BaseController.CACHED_USER_KEY]) {
            return (req as any)[BaseController.CACHED_USER_KEY];
        }

        const userId = credentialCallback(req);

        if (!userId) {
            return null;
        }

        (req as any)[BaseController.CACHED_USER_KEY] = await this.userService.user.findById(userId);

        if (!(req as any)[BaseController.CACHED_USER_KEY]) {
            return null;
        }

        return (req as any)[BaseController.CACHED_USER_KEY];
    }

    public async extractVendor(req: Request, credentialCallback: (req) => string): Promise<VendorDocument> {
        if ((req as any)[BaseController.CACHED_VENDOR_KEY]) {
            return (req as any)[BaseController.CACHED_VENDOR_KEY];
        }

        const vendorId = credentialCallback(req);

        if (!vendorId) {
            throw new BadRequest('MissingVendorId');
        }

        (req as any)[BaseController.CACHED_VENDOR_KEY] = await this.vendorService.vendorRepository.findById(vendorId);

        if (!(req as any)[BaseController.CACHED_VENDOR_KEY]) {
            throw new BadRequest('UnknownVendor');
        }

        return (req as any)[BaseController.CACHED_VENDOR_KEY];
    }

    public async extractVendorWithoutError(req: Request, credentialCallback: (req) => string): Promise<VendorDocument> {
        if ((req as any)[BaseController.CACHED_VENDOR_KEY]) {
            return (req as any)[BaseController.CACHED_VENDOR_KEY];
        }

        const vendorId = credentialCallback(req);

        if (!vendorId) {
            return null;
        }

        (req as any)[BaseController.CACHED_VENDOR_KEY] = await this.vendorService.vendorRepository.findById(vendorId);

        if (!(req as any)[BaseController.CACHED_VENDOR_KEY]) {
            return null;
        }

        return (req as any)[BaseController.CACHED_VENDOR_KEY];
    }
}
