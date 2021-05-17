export class FactoryBuilder {
    public factories: Array<(...args: any) => Promise<any>> = [];

    public build(...args): Promise<any> {
        return Promise.all(this.factories.map(async (factory) => factory(...args)));
    }

    public register(factory: (...args: any) => Promise<any>) {
        this.factories.push(factory);
    }
}
