import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { NotFound } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { CategoryService } from '../../services/category.service';
import { ScoringService } from '../../services/scoring/scoring.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicCategoryController extends BaseController {
    @inject()
    public categoryService: CategoryService;

    @inject()
    public scoringService: ScoringService;

    @onInit()
    public initialize() {
        this.json.get('/', this.list.bind(this));
        this.json.get('/:id', this.getByIdOrSlug.bind(this));
    }

    public async getByIdOrSlug(req: Request) {
        const identifier = req.params.id;

        const bySlug = await this.categoryService.getBySlug(identifier, {
            populate: [
                { path: 'attributes' }
            ]
        });

        if (bySlug) {
            return bySlug;
        }

        const byId = await this.categoryService.repository.findById(identifier, {
            populate: [
                { path: 'attributes' }
            ]
        });

        if (!byId) {
            throw new NotFound('UnknownCategory');
        }

        return byId;
    }

    public async list(req: Request) {
        return this.categoryService.repository.findMany({}, {
            populate: [
                { path: 'attributes' }
            ]
        });
    }
}
