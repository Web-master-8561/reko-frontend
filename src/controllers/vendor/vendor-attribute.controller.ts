import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest, NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { ObjectId } from 'bson';
import { AttributeService } from '../../services/attribute.service';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class VendorAttributeController extends BaseController {
    @inject()
    public vendor: VendorService;

    @inject()
    public attribute: AttributeService;

    @onInit()
    public initialize() {
        this.json.get('/', this.list.bind(this));
        this.json.post('/', this.create.bind(this));
        this.json.get('/:attribute', this.show.bind(this));
        this.json.put('/:attribute', this.update.bind(this));
        this.json.delete('/:attribute', this.delete.bind(this));
    }

    public async create(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        if (req.body.key === undefined) {
            throw new BadRequest('MissingTitle');
        }

        if (req.body.title === undefined) {
            throw new BadRequest('MissingDescription');
        }

        return this.attribute.create(req.body, vendor);
    }

    public async show(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        const attribute = await this.attribute.attributeRepository.findOne({
            vendor: vendor._id as any,
            _id: new ObjectId(req.params.attribute) as any
        });

        if (!attribute) {
            throw new NotFound('UnknownAttribute');
        }

        return attribute;
    }

    public async update(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        const attribute = await this.attribute.attributeRepository.findOne({
            vendor: vendor._id as any,
            _id: new ObjectId(req.params.attribute) as any
        });

        if (!attribute) {
            throw new NotFound('UnknownAttribute');
        }

        if (req.body.key === undefined) {
            throw new BadRequest('MissingTitle');
        }

        if (req.body.title === undefined) {
            throw new BadRequest('MissingDescription');
        }

        return this.attribute.update(attribute, req.body);
    }

    public list(req: Request) {
        const vendor = this.getRequestVendor(req);

        return this.attribute.attributeRepository.findMany({
            vendor: vendor._id as any
        });
    }

    public async delete(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageProduct();
        vendor.checkAbilityManageVariants();

        const attribute = await this.attribute.attributeRepository.findOne({
            vendor: vendor._id as any,
            _id: new ObjectId(req.params.attribute) as any
        });

        if (!attribute) {
            throw new NotFound('UnknownAttribute');
        }

        return attribute.delete();
    }
}
