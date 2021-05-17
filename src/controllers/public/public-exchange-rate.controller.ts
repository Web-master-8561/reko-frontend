import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { ExchangeRateService } from '../../services/exchange-rates/exchange-rate.service';

@injectable()
export class PublicExchangeRateController extends Controller {
    @inject()
    public exchangeRateService: ExchangeRateService;

    @onInit()
    public initialize() {
        this.json.get('/', this.index.bind(this));
    }

    public async index(req: Request) {
        const currencies = this.exchangeRateService.getSupportedCurrencies();

        const results = [];

        for (const item of currencies) {
            results.push(await this.exchangeRateService.getExchangeRate(item, true));
        }

        return results;
    }
}
