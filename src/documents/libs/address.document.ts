import { ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { property } from '@kifly/boxer/src/document/decorators/property';
import { IsDefined, IsIn } from 'class-validator';
import { countriesFlatten } from '../../modules/country/libs/countries';
import { Address } from './address';

@document({
    collection: 'address',
    defaultScope: ArchiveScope
})
export class AddressDocument extends ArchiveDocument<Address> {
    @property()
    public title: string;

    @IsDefined({ message: 'required' })
    @IsIn(countriesFlatten, { message: 'must-be-a-country' })
    @property()
    public country: string;

    @property()
    public state: string;

    @IsDefined({ message: 'required' })
    @property()
    public city: string;

    @IsDefined({ message: 'required' })
    @property()
    public zip: string;

    @IsDefined({ message: 'required' })
    @property()
    public address1: string;

    @property()
    public address2: string;

    @property()
    public comment: string;

    @property()
    public user: string;

    public getArtifact(): Address {
        return new Address(this);
    }
}
