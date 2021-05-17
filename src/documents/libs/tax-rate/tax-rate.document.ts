import { Archive } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { BaseDocument } from '@kifly/boxer/src/document/base.document';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { TaxRatePresenter } from './tax-rate.presenter';

export interface TaxRate extends Archive {
    title?: string;
    rate?: number;
    shipping?: boolean;
}

@document({
    collection: 'tax-rate',
    indices: []
})
export class TaxRateDocument extends BaseDocument<TaxRate> {
    @property()
    public title: string;

    @property()
    public rate: number = 0;

    @property()
    public shipping: boolean;

    public readAsAdmin() {
        return this;
    }

    public readAsPublic() {
        return this;
    }

    public getPresenter() {
        return new TaxRatePresenter(this);
    }
}
