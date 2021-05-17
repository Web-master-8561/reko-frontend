import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Controller, Request } from '@kifly/beagle/modules/express/injectables/controller';
import { CategoryService } from '../../services/category.service';

@injectable()
export class AdminCategoryController extends Controller {
    @inject()
    public categoryService: CategoryService;

    @onInit()
    public initialize() {
        this.json.post('/', this.create.bind(this));
    }

    public async create(req: Request) {
        if (!req.body.title) {
            throw new BadRequest('MissingTitle');
        }

        if (!req.body.description) {
            throw new BadRequest('MissingDescription');
        }

        return this.categoryService.create(req.body);
    }
}
