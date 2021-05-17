import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { RedisService } from '@kifly/beagle/modules/cache/redis.service';
import { get } from 'superagent';
import { BaseService } from '../libs/base.service';
import { ExchangeRate } from './libs/exchange-rate';

@injectable()
export class ExchangeRateService extends BaseService {
    public readonly endpointLatest = 'https://api.exchangeratesapi.io/latest';

    @inject()
    public cache: RedisService;

    public getSupportedCurrencies(): string[] {
        return (this.settings.supportedCurrencies || []);
    }

    public async getExchangeRate(currency: string, tryFetchIfMissing = true): Promise<ExchangeRate> {
        try {
            const data = await this.cache.get(`exchangeRate-(${currency.toLowerCase()})`);

            if (!data && tryFetchIfMissing) {
                return this.updateByCurrency(currency);
            }

            if (!data && !tryFetchIfMissing) {
                return null;
            }

            return new ExchangeRate(data);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async updateByCurrency(base: string): Promise<ExchangeRate> {
        try {
            const response = await get(this.endpointLatest).query({
                base: base.toUpperCase(),
                symbols: this.getSupportedCurrencies().filter((item) => (item.toLowerCase() !== base.toLowerCase()))
            });

            const exchangeRate = new ExchangeRate(response.body);

            await this.cache.set(`exchangeRate-(${base.toLowerCase()})`, exchangeRate);

            return exchangeRate;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async downloadAndUpdateLatestRates() {
        const currencies = this.getSupportedCurrencies();

        for (const currency of currencies) {
            await this.updateByCurrency(currency);
        }

        console.log(`Exchange rates are synced - (${this.getSupportedCurrencies()})`);
    }
}
