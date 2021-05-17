import * as moment from 'moment';
import { VipAbilities } from '../abilities/builtin/vip.abilities';
import { Subscription } from '../subscription';

export class VipSubscription extends Subscription {
    constructor() {
        const options = {
            identifier: 'subscription.vip-1',
            name: 'VIP Membership',
            start: moment().toDate(),
            end: moment().add(1, 'years').toDate(),
            active: true,
            abilities: new VipAbilities()
        };

        super(options);
    }
}
