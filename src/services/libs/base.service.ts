export abstract class BaseService {
    public settings: any;

    protected constructor(options: any) {
        this.settings = options?.settings;
    }
}
