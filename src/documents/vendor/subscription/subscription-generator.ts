import { InternalServerError } from '@kifly/beagle/modules/express/errors';
import { BasicSubscription } from './buildtin/basic.subscription';
import { InfinitySubscription } from './buildtin/infinity.subscription';
import { VipSubscription } from './buildtin/vip.subscription';
import { Subscription } from './subscription';

export class SubscriptionGenerator {
    public static readonly builtin = {
        basic: () => BasicSubscription,
        vip: () => VipSubscription,
        infinity: () => InfinitySubscription
    };

    public static exists(type: string): boolean {
        return !!this.builtin[type];
    }

    public static generate(type: string, args?: any): Subscription {
        const exists = this.exists(type);

        if (!exists) {
            throw new InternalServerError('UnableToGenerateUnknownSubscriptionType', { type, args });
        }

        const gen = this.builtin[type](args);

        return new gen();
    }
}
