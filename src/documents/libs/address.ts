import { IsDefined, IsIn } from 'class-validator';
import { countriesFlatten } from '../../modules/country/libs/countries';

export class Address {
    @IsDefined({ message: 'required' })
    @IsIn(countriesFlatten, { message: 'must-be-a-country' })
    public country: string;

    public state: string;

    @IsDefined({ message: 'required' })
    public city: string;

    @IsDefined({ message: 'required' })
    public zip: string;

    @IsDefined({ message: 'required' })
    public address1: string;

    public address2: string;

    public comment: string;

    public user: string;

    public title: string;

    constructor(options: any) {
        this.country = options?.country;
        this.state = options?.state;
        this.city = options?.city;
        this.zip = options?.zip;
        this.address1 = options?.address1;
        this.address2 = options?.address2;
        this.comment = options?.comment;
        this.user = options?.user;
    }
}
