import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { Address } from '../documents/libs/address';
import { AddressDocument } from '../documents/libs/address.document';
import { ArchiveRepository } from '../libs/repository/archive.repository';
import { User } from './user/user';
import { UserService } from './user/user.service';

@injectable()
export class AddressService {
    @inject()
    public userService: UserService;

    @inject()
    public connection: Connection;

    // @ts-expect-error
    public addressRepository = new ArchiveRepository<AddressDocument>(AddressDocument, this.connection);

    public async getUserAddresses(user: User) {
        return this.addressRepository.findMany({ user: user._id });
    }

    public create(payload: Address) {
        const instance = new AddressDocument();

        instance.address1 = payload.address1;
        instance.address2 = payload.address2;
        instance.city = payload.city;
        instance.country = payload.country;
        instance.state = payload.state;
        instance.zip = payload.zip;
        instance.title = payload.title;
        instance.comment = payload.comment;

        return instance.save();
    }

    public update(address: AddressDocument, options: Address) {
        address.address1 = options.address1 ?? address.address1;
        address.address2 = options.address2 ?? address.address2;
        address.city = options.city ?? address.city;
        address.country = options.country ?? address.country;
        address.state = options.state ?? address.state;
        address.zip = options.zip ?? address.zip;
        address.title = options.title ?? address.title;
        address.comment = options.comment ?? address.comment;

        return address.save();
    }

    public async addAddress(address: AddressDocument, user: User): Promise<AddressDocument> {
        address.user = user._id;

        return address.save();
    }

    public async archive(address: AddressDocument) {
        if (address.user) {
            const user = await this.userService.user.findById(address.user);

            if (user?.meta?.defaultShippingAddress === address._id.toString()) {
                await this.userService.meta.set(user, 'defaultShippingAddress', null);
            }

            if (user?.meta?.defaultBillingAddress === address._id.toString()) {
                await this.userService.meta.set(user, 'defaultBillingAddress', null);
            }
        }

        return this.addressRepository.archive(address._id);
    }
}
