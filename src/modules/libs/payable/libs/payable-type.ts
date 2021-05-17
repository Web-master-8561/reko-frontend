import { ObjectId } from 'bson';

export interface PayableItem {
    /**
     * Exact price of item
     */
    price?: number;

    /**
     * Amount of item
     */
    amount?: number;

    /**
     * Exact item id
     */
    item?: ObjectId | string;

    /**
     * Comment of item, for example item was under discount
     */
    comment?: any;
}
