import { Abilities } from '../abilities';

export class InfinityAbilities implements Abilities {
    public manageVendorBasicData = true;
    public manageVendorGeneralData = true;
    public manageVendorProducts = true;
    public manageVendorVariants = true;
    public manageVendorOrders = true;
    public maxProducts = Number.MAX_SAFE_INTEGER;
    public maxProductImages = 5;
    public maxProductVideos = 3;

    public canEditItself = {
        title: true,
        defaultTaxRate: true,
        description: true,
        taxNumber: true,
        website: true,
        email: true,
        phone: true,
        company: true
    };
}
