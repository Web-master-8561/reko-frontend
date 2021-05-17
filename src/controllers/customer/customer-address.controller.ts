import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { Address } from '../../documents/libs/address';
import { AddressService } from '../../services/address.service';
import { UserService } from '../../services/user/user.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class CustomerAddressController extends BaseController {
    @inject()
    public userService: UserService;

    @inject()
    public address: AddressService;

    @onInit()
    public initialize() {
        this.json.get('/', this.list.bind(this));
        this.json.post('/', this.create.bind(this));
        this.json.put('/:id', this.update.bind(this));
        this.json.delete('/:id', this.remove.bind(this));
    }

    public async list(req: Request) {
        const user = this.getRequestUser(req);

        return this.address.getUserAddresses(user);
    }

    public async create(req: Request) {
        const user = this.getRequestUser(req);

        const address = await this.address.create(req.body as Address);

        return this.address.addAddress(address, user);
    }

    public async update(req: Request) {
        this.getRequestUser(req);

        const address = await this.address.addressRepository.findById(req.params.id);

        if (!address) {
            throw new BadRequest('MissingAddress');
        }

        return this.address.update(address, req.body);
    }

    public async remove(req: Request) {
        this.getRequestUser(req);

        const address = await this.address.addressRepository.findById(req.params.id);

        if (!address) {
            throw new BadRequest('MissingAddress');
        }

        return this.address.archive(address);
    }
}
