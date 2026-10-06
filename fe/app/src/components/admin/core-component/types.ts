export type ClientType = string;

export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    badge?: string;
    description: string;
    inStock: boolean;
    tags?: string[];
    translations?: {
        es?: Partial<Pick<Product, 'name' | 'description' | 'badge' | 'category'>>;
    };
}

export interface CartItem extends Product {
    quantity: number;
}

export interface HeroConfig {
    headline: string;
    subheadline: string;
    cta: string;
    badge?: string;
}

export interface ClientConfig {
    id: string;
    name: string;
    tagline: string;
    type: ClientType;
    logoIcon: string;
    hero: HeroConfig;
    categories: string[];
    phone: string;
    hours: string;
    topBarMessage: string;
    freeDeliveryThreshold: number;
    translations?: {
        es?: Partial<Omit<ClientConfig, 'id' | 'type' | 'categories' | 'freeDeliveryThreshold' | 'translations' | 'hero'>> & {
            hero?: Partial<HeroConfig>;
            categories?: string[];
        };
    };
}

export interface EngineControle {
    apiData?: Record<string, any>;
    action?: (params: { type: string; data?: Record<string, any> }) => void;
    searchParameters?: Record<string, any>;
}
