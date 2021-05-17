export class Attribute {
    public key: string;
    public title: string;

    constructor(options: any) {
        this.key = options?.key;
        this.title = options?.title;
    }
}
