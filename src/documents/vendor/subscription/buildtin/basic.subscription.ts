import * as moment from 'moment';
import { BasicAbilities } from '../abilities/builtin/basic.abilities';
import { Subscription } from '../subscription';

export class BasicSubscription extends Subscription {
    constructor() {
        const options = {
            identifier: 'subscription.basic-1',
            name: 'Basic Subscription',
            start: moment().toDate(),
            end: moment().add(100, 'years').toDate(),
            active: true,
            abilities: new BasicAbilities()
        };

        super(options);
    }
}
