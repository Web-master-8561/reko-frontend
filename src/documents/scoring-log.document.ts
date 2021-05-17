import { Base, BaseDocument } from '@kifly/boxer/src/document/base.document';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { property } from '@kifly/boxer/src/document/decorators/property';

export interface ScoringLog extends Base {
    type: string;
    payload: any;
}

@document({
    collection: 'scoring-log'
})
export class ScoringLogDocument extends BaseDocument<ScoringLog> {
    @property()
    public type: string;

    @property()
    public payload: any;
}
