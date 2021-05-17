import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { countries } from '../../modules/country/libs/countries';
import { countryStates } from '../../modules/country/libs/states';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicInfoController extends BaseController {
    @onInit()
    public initialize() {
        this.json.get('/country', this.country.bind(this));
        this.json.get('/state/:country', this.state.bind(this));
    }

    public async country(req: Request) {
        return Object.keys(countries).map((key) => ({
            key: key,
            value: countries[key].code,
            text: countries[key].name
        }));
    }

    public async state(req: Request) {
        const countryCode = req.params.country.toUpperCase();
        const states = countryStates[countryCode] ?? [];

        return states.map((item: any) => ({
            key: item.code,
            value: item.code,
            text: item.name
        }));
    }
}
