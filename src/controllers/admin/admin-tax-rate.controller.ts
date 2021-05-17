import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { TaxRateService } from '../../services/tax-rate.service';

@injectable()
export class AdminTaxRateController extends Controller {
    @inject()
    public taxRate: TaxRateService;

    @onInit()
    public initialize() {
        this.json.post('/', this.create.bind(this));
    }

    public async create(req: Request) {
        if (!req.body.title) {
            throw new BadRequest('MissingTitle');
        }

        if (!req.body.rate) {
            throw new BadRequest('MissingRate');
        }

        return this.taxRate.create(req.body)
            .then((i) => i.readAsAdmin());
    }
}
