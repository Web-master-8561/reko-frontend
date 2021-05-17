import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { mapValues } from 'lodash';
import { VendorActiveBy } from '../../documents/vendor/vendor.document';
import { TaxRateService } from '../../services/tax-rate.service';
import { VendorService } from '../../services/vendor.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class VendorVendorController extends BaseController {
    @inject()
    public vendor: VendorService;

    @inject()
    public taxRate: TaxRateService;

    @onInit()
    public initialize() {
        this.json.put('/', this.update.bind(this));
        this.json.put('/normalize', this.normalize.bind(this));
        this.json.put('/activate', this.activate.bind(this));
        this.json.put('/deactivate', this.deactivate.bind(this));
        this.json.put('/stock-management/enable', this.enableStockManagement.bind(this));
        this.json.put('/stock-management/disable', this.disableStockManagement.bind(this));
        this.json.put('/default-tax-rate', this.setDefaultTaxRate.bind(this));
        this.json.put('/default-currency', this.setDefaultCurrency.bind(this));
    }

    public async update(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        const data = mapValues(req.body, (item, key) => vendor.checkAbility(`canEditItself.${key}`) ? item : undefined);

        if (req.body.defaultTaxRate) {
            await this.setDefaultTaxRate(req);
        }

        if (req.body.defaultCurrency) {
            await this.setDefaultCurrency(req);
        }

        return this.vendor.update(data, vendor);
    }

    public async enableStockManagement(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.enableStockManagement(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async disableStockManagement(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.disableStockManagement(vendor)
            .then((i) => i.readAsAdmin());
    }

    public async setDefaultTaxRate(req: Request) {
        if (!req.body.defaultTaxRate) {
            throw new BadRequest('MissingDefaultTaxRate');
        }

        const taxRate = await this.taxRate.taxRateRepository.findById(req.body.defaultTaxRate?._id || req.body.defaultTaxRate);

        if (!taxRate) {
            throw new BadRequest('UnknownDefaultTaxRate');
        }

        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.setDefaultTaxRate(vendor, taxRate)
            .then((i) => i.readAsAdmin());
    }

    public async setDefaultCurrency(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        if (!req.body.defaultCurrency) {
            throw new BadRequest('MissingDefaultCurrency');
        }

        return this.vendor.setDefaultCurrency(vendor, req.body.defaultCurrency)
            .then((i) => i.readAsAdmin());
    }

    public async activate(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.activateBy(VendorActiveBy.VENDOR, vendor)
            .then((i) => i.readAsAdmin());
    }

    public async deactivate(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.deactivateBy(VendorActiveBy.VENDOR, vendor)
            .then((i) => i.readAsAdmin());
    }

    public async normalize(req: Request) {
        const vendor = this.getRequestVendor(req);

        vendor.checkAbilityManageBasicData();
        vendor.checkAbilityManageGeneralData();

        return this.vendor.normalizeVendor(vendor)
            .then((i) => i.readAsAdmin());
    }
}
