import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Connection } from '@kifly/beagle/modules/boxer/connection';
import { TaxRateDocument } from '../documents/libs/tax-rate/tax-rate.document';

import { ArchiveRepository } from '../libs/repository/archive.repository';

@injectable()
export class TaxRateService {
    @inject()
    public connection: Connection;

    // @ts-expect-error
    public taxRateRepository = new ArchiveRepository<TaxRateDocument>(TaxRateDocument, this.connection);

    public create(data: any): Promise<TaxRateDocument> {
        const instance = new TaxRateDocument();

        instance.title = data?.title;
        instance.rate = data?.rate;
        instance.shipping = data?.shipping;

        return instance.save();
    }
}
