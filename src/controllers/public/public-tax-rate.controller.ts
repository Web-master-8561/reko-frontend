import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { TaxRateService } from '../../services/tax-rate.service';

@injectable()
export class PublicTaxRateController extends Controller {
    @inject()
    public taxRate: TaxRateService;

    @onInit()
    public initialize() {
        this.json.get('/', this.index.bind(this));
    }

    public async index(req: Request) {
        return this.taxRate.taxRateRepository.findMany();
    }
}
