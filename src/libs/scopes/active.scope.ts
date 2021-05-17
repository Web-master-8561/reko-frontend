import { ArchiveScope } from '@kifly/beagle/modules/boxer/scopes/archive.scope';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { FilterQuery } from 'mongodb';

export class ActiveScope extends DefaultScope {
    public static findOneQuery<T>(query?: FilterQuery<T>): FilterQuery<T> {
        return {
            $and: [
                ArchiveScope.findOneQuery(query),
                { active: true }
            ]
        } as any;
    }

    public static findManyQuery<T>(query?: FilterQuery<T>): FilterQuery<T> {
        return this.findOneQuery(query);
    }
}
