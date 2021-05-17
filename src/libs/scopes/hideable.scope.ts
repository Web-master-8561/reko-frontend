import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { Scope } from '@kifly/boxer/src/scope/scope';
import { FilterQuery } from 'mongodb';

export class HideableScope extends Scope {
    public static findOneQuery<T>(query?: FilterQuery<T>): FilterQuery<T> {
        return {
            $and: [
                ArchiveScope.findOneQuery(query),
                { hidden: false }
            ]
        } as any;
    }

    public static findManyQuery<T>(query?: FilterQuery<T>): FilterQuery<T> {
        return this.findOneQuery(query);
    }
}
