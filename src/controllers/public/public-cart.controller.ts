import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { onInit } from '@kifly/beagle/core/container/decorators/on-init';
import { BadRequest } from '@kifly/beagle/modules/express/errors';
import { Request } from '@kifly/beagle/modules/express/injectables/controller';
import { CartService } from '../../services/cart.service';
import { ScoringService } from '../../services/scoring/scoring.service';
import { VariantService } from '../../services/variant.service';
import { BaseController } from '../libs/base-controller';

@injectable()
export class PublicCartController extends BaseController {
    @inject()
    public scoringService: ScoringService;

    @inject()
    public cartService: CartService;

    @inject()
    public variantService: VariantService;

    @onInit()
    public initialize() {
        this.json.get('/:identifier', this.show.bind(this));
        this.json.put('/:identifier/item/:variant', this.addToCart.bind(this));
    }

    public async show(req: Request) {
        return this.cartService.findCart(req.params.identifier, true);
    }

    public async addToCart(req: Request) {
        const variant = await this.variantService.variantRepository.findById(req.params.variant);

        if (!variant) {
            throw new BadRequest('UnknownVariant');
        }

        const amount = req.body.amount ?? 0;

        if (!Number.isFinite(amount)) {
            new BadRequest('AmountMustBeANumber');
        }

        (amount > 0)
            ? await this.scoringService.emit('VARIANT_ADD_TO_CART', variant._id)
            : await this.scoringService.emit('VARIANT_REMOVE_FROM_CART', variant._id);

        return this.cartService.addToCart(req.params.identifier, variant, amount);
    }
}
