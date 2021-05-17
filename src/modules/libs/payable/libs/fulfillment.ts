import { IsDefined } from 'class-validator';

export class Fulfillment {
    /**
     * Title type of fulfilment
     * It can be anything
     */
    @IsDefined({ message: 'required' })
    public title: string;

    /**
     * Amount of fulfilment
     * It's unit/currency must be same as the Payable unit/currency
     */
    @IsDefined({ message: 'required' })
    public amount: number;

    /**
     * Fulfilment artifact
     * Example:
     *  - in case of Transfer, you can save a comment
     *  - in case of Online, you can save the third party response
     */
    public payload: any;

    public comment: string;

    /**
     * Is Countable
     * - if this is true, value will decrease the remainingPrice
     */
    public countable: boolean;

    /**
     * Meta property
     */
    public createdAt: Date;

    constructor(options?: any) {
        this.title = options?.title;
        this.amount = options?.amount ?? 0;
        this.payload = options?.payload ?? null;
        this.countable = options?.countable ?? true;
        this.createdAt = new Date();
    }
}
