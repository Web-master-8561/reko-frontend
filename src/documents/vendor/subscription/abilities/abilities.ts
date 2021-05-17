export class Abilities {
    public manageVendorBasicData: boolean;
    public manageVendorGeneralData: boolean;
    public manageVendorProducts: boolean;
    public manageVendorVariants: boolean;
    public manageVendorOrders: boolean;
    public maxProducts: number;
    public maxProductImages: number;
    public maxProductVideos: number;

    public canEditItself: {
        title: boolean;
        description: boolean;
        taxNumber: boolean;
        website: boolean;
        email: boolean;
        phone: boolean;
        company: boolean;
        defaultTaxRate: boolean;
    };

    constructor(options?: Abilities) {
        this.manageVendorBasicData = options?.manageVendorBasicData ?? false;
        this.manageVendorGeneralData = options?.manageVendorGeneralData ?? false;
        this.manageVendorProducts = options?.manageVendorProducts ?? false;
        this.manageVendorVariants = options?.manageVendorVariants ?? false;
        this.manageVendorOrders = options?.manageVendorOrders ?? false;
        this.maxProducts = options?.maxProducts ?? 0;
        this.maxProductImages = options?.maxProductImages ?? 0;
        this.maxProductVideos = options?.maxProductVideos ?? 0;

        this.canEditItself = {
            title: options?.canEditItself?.title ?? false,
            description: options?.canEditItself?.description ?? false,
            taxNumber: options?.canEditItself?.taxNumber ?? false,
            website: options?.canEditItself?.website ?? false,
            email: options?.canEditItself?.email ?? false,
            phone: options?.canEditItself?.phone ?? false,
            company: options?.canEditItself?.company ?? false,
            defaultTaxRate: options?.canEditItself?.defaultTaxRate ?? false,
        };
    }
}
