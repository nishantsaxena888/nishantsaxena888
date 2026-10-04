import type { Product } from "../types";
import productsMock from "../mock/products.json";

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Using local storage to persist mock data across sessions
const STORAGE_KEY = 'pos_admin_products';

const getStoredProducts = (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productsMock));
        return productsMock as Product[];
    }
    return JSON.parse(stored);
};

const setStoredProducts = (products: Product[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const productService = {
    async getProducts(): Promise<Product[]> {
        await delay(500);
        return getStoredProducts();
    },

    async getProductById(id: string): Promise<Product | undefined> {
        await delay(300);
        const products = getStoredProducts();
        return products.find(p => p.id === id);
    },

    async createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
        await delay(800);
        const products = getStoredProducts();
        const newProduct: Product = {
            ...product,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setStoredProducts([...products, newProduct]);
        return newProduct;
    },

    async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
        await delay(800);
        const products = getStoredProducts();
        const index = products.findIndex(p => p.id === id);
        if (index === -1) throw new Error("Product not found");

        const updatedProduct = {
            ...products[index],
            ...product,
            updatedAt: new Date().toISOString(),
        };

        products[index] = updatedProduct;
        setStoredProducts([...products]);
        return updatedProduct;
    },

    async deleteProduct(id: string): Promise<void> {
        await delay(500);
        const products = getStoredProducts();
        setStoredProducts(products.filter(p => p.id !== id));
    }
};
