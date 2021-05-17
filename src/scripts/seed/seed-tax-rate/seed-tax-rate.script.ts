import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Arguments } from 'yargs';
import { TaxRateService } from '../../../services/tax-rate.service';
import { taxRates } from './tax-rates';

@injectable()
export class SeedTaxRateScript extends BaseScript {
    @inject()
    public taxRate: TaxRateService;

    public async run(args: Arguments<any>) {
        for (const taxRate of taxRates) {
            await this.taxRate.create(taxRate);
        }
    }
}
