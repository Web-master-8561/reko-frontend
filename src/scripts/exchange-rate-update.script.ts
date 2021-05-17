import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { ExchangeRateService } from '../services/exchange-rates/exchange-rate.service';

@injectable()
export class ExchangeRateUpdateScript extends BaseScript {
    @inject()
    public exchangeRateService: ExchangeRateService;

    public async run() {
        return this.exchangeRateService.downloadAndUpdateLatestRates();
    }
}
