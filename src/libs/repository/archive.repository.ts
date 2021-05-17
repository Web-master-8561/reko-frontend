import { ArchiveDocument } from '@kifly/beagle/modules/boxer/documents/archive.document';
import { Repository } from '@kifly/beagle/modules/boxer/repository/repository';
import { FindOneOptions } from '@kifly/boxer/src/collections/collection';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { ObjectId } from 'mongodb';

export class ArchiveRepository<D extends ArchiveDocument<any>> extends Repository<D> {
    public async archive(id: string | ObjectId, options: FindOneOptions<D> = {}) {
        const item = await this.findById(id, options);

        item.deletedAt = new Date();

        return item.save();
    }

    public async restore(id: string | ObjectId, options: FindOneOptions<D> = {}) {
        options.scope = DefaultScope;

        const item = await this.findById(id, options);

        item.deletedAt = null;

        return item.save();
    }
}
