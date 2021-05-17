import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { FactoryBuilder } from '../../libs/subject.factory';

@injectable()
export class OrderConnector {
    public orderCreated$ = new FactoryBuilder();
}
