import { BadRequest } from '@kifly/beagle/modules/express/errors';
import * as moment from 'moment';

export class ExchangeRate {
    public rates: Record<string, number>;
    public base: string;
    public date: Date;

    constructor(options: any) {
        this.rates = { ...(options?.rates || {}), [options?.base]: 1 };
        this.base = options?.base;
        this.date = moment(options?.date).toDate();
    }

    public exchange(amount: number): Record<string, number> {
        const result: any = {};

        for (const key of Object.keys(this.rates)) {
            if (!this.rates[key]) {
                throw new BadRequest('UnsupportedCurrency');
            }

            result[key] = amount * this.rates[key];
        }

        result[this.base] = amount;

        return result;
    }
}
