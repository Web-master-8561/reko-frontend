import { IsDefined } from 'class-validator';
import * as moment from 'moment';
import { Abilities } from './abilities/abilities';

export class Subscription {
    @IsDefined({ message: 'required' })
    public identifier: string;

    @IsDefined({ message: 'required' })
    public name: string;

    @IsDefined({ message: 'required' })
    public start: Date;

    @IsDefined({ message: 'required' })
    public end: Date;

    @IsDefined({ message: 'required' })
    public active: boolean;

    @IsDefined({ message: 'required' })
    public abilities: Abilities;

    constructor(options: any) {
        this.identifier = options?.identifier;
        this.name = options?.name;
        this.start = moment(options?.start).toDate();
        this.end = moment(options?.end).toDate();
        this.active = options?.active;
        this.abilities = options?.abilities;
    }

    public isActive() {
        if (!this.active) {
            return false;
        }

        const isNotStartedYet = moment(this.start).isAfter();

        if (isNotStartedYet) {
            return false;
        }

        const isExpired = moment(this.end).isBefore();

        if (isExpired) {
            return false;
        }

        return true;
    }

    public activate() {
        this.active = true;
    }

    public deactivate() {
        this.active = false;
    }
}
