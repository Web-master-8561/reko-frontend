import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest, NotFound } from '@kifly/beagle/modules/express/errors';
import { Controller, Request, Response } from '@kifly/beagle/modules/express/injectables/controller';
import { SubscriptionGenerator } from '../../documents/vendor/subscription/subscription-generator';
import { VendorActiveBy } from '../../documents/vendor/vendor.document';
import { VendorService } from '../../services/vendor.service';

@injectable()
export class AdminVendorController extends Controller {
    @inject()
    public vendor: VendorService;

    @onInit()
    public initialize() {
        this.json.get('/', this.index.bind(this));
        this.json.post('/', this.create.bind(this));
        this.json.put('/:id/normalize', this.normalize.bind(this));
        this.json.put('/:id/activate', this.activate.bind(this));
        this.json.put('/:id/deactivate', this.deactivate.bind(this));
        this.json.put('/:id/subscription', this.setSubscription.bind(this));
        this.json.put('/:id/subscription/activate', this.activateSubscription.bind(this));
        this.json.put('/:id/subscription/deactivate', this.deactivateSubscription.bind(this));
    }

    public async index(req: Request, res: Response) {
        return this.vendor.vendorRepository.paginate()
            .then((result) => ({
                ...result,
                items: result.items.map((i) => i.readAsAdmin())
            }));
    }

    public async create(req: Request) {
        if (!req.body.title) {
            throw new BadRequest('MissingTitle');
        }

        if (!req.body.description) {
            throw new BadRequest('MissingDescription');
        }

        if (!req.body.subscriptionIdentifier) {
            throw new BadRequest('MissingSubscriptionIdentifier');
        }

        const subscription = SubscriptionGenerator.generate(req.body.subscriptionIdentifier);

        return this.vendor.create(req.body, subscription)
            .then((i) => i.readAsAdmin());
    }

    public async setSubscription(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        if (!req.body.subscriptionIdentifier) {
            throw new BadRequest('MissingSubscriptionIdentifier');
        }

        const subscription = SubscriptionGenerator.generate(req.body.subscriptionIdentifier);

        return this.vendor.setSubscription(subscription, vendor)
            .then((i) => i.readAsAdmin());
    }

    public async activateSubscription(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.activateSubscription(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async deactivateSubscription(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.deactivateSubscription(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async enableStockManagement(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.enableStockManagement(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async disableStockManagement(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.disableStockManagement(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async activate(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.activateBy(VendorActiveBy.SYSTEM, vendor)
            .then((i) => i.readAsAdmin());
    }

    public async deactivate(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.deactivateBy(VendorActiveBy.SYSTEM, vendor)
            .then((i) => i.readAsAdmin());
    }

    public async normalize(req: Request) {
        const vendor = await this.vendor.vendorRepository.findById(req.params.id);

        if (!vendor) {
            throw new NotFound('UnknownVendor');
        }

        return this.vendor.normalizeVendor(vendor)
            .then((i) => i.readAsAdmin());
    }
}
