import * as moment from 'moment';
import { InfinityAbilities } from '../abilities/builtin/infinity.abilities';
import { Subscription } from '../subscription';

export class InfinitySubscription extends Subscription {
    constructor() {
        const options = {
            identifier: 'subscription.infinity-1',
            name: 'Infinity Subscription',
            start: moment().toDate(),
            end: moment().add(100, 'years').toDate(),
            active: true,
            abilities: new InfinityAbilities()
        };

        super(options);
    }
}
