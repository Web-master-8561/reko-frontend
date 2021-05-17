import { PaginationOptions } from '@kifly/beagle/modules/boxer/repository/repository';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { mapValues } from 'lodash';

export abstract class MongoTransformer {
    public static async paginationOptions(optionsCallback: (req: Request) => Promise<PaginationOptions<any>>) {
        return async (req: Request): Promise<PaginationOptions<any>> => {
            const options = await optionsCallback(req);

            const page = parseInt(req.query._page as any, 10) || 0;
            const limit = parseInt(req.query._limit as any, 10) || 50;
            const sort = mapValues(req.query._sort || {}, (item) => MongoTransformer
                .sortValues
                .find((v) => (v.match === item))
                ?.value
            );

            return {
                ...options,
                page: page,
                limit: limit,
                sort: { ...(sort as any), ...(options.sort || {}) }
            };
        };
    };

    public static async query(optionsCallback: any = (req: Request) => Promise.resolve({})) {
        return (req: Request): any => optionsCallback(req);
    };

    private static sortValues = [
        { match: -1, value: 1 },
        { match: '-1', value: -1 },
        { match: '1', value: 1 },
        { match: 1, value: 1 },
        { match: '0', value: 1 },
        { match: 0, value: 1 }
    ];

    private static arrayQueryOperators = [
        '$and', '$or', '$nor'
    ];
}
