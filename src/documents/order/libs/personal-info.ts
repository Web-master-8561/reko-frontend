import { IsDefined } from 'class-validator';

export class PersonalInfo {
    @IsDefined({ message: 'required' })
    public firstName: string;

    @IsDefined({ message: 'required' })
    public lastName: string;

    @IsDefined({ message: 'required' })
    public phone: string;

    constructor(options: any) {
        this.firstName = options?.firstName;
        this.lastName = options?.lastName;
        this.phone = options?.phone;
    }
}
