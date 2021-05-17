import { IsDefined } from 'class-validator';

export class CompanyInfo {
    @IsDefined({ message: 'required' })
    public name: string;

    @IsDefined({ message: 'required' })
    public taxNumber: string;

    constructor(options: any) {
        this.name = options.name;
        this.taxNumber = options.taxNumber;
    }
}
