import { Abilities } from '../abilities';

export class BasicAbilities implements Abilities {
    public manageVendorBasicData = true;
    public manageVendorGeneralData = true;
    public manageVendorProducts = true;
    public manageVendorVariants = true;
    public manageVendorOrders = true;
    public maxProducts = 5;
    public maxProductImages = 1;
    public maxProductVideos = 0;

    public canEditItself = {
        title: true,
        defaultTaxRate: true,
        description: false,
        taxNumber: true,
        website: false,
        email: false,
        phone: false,
        company: false
    };
}
