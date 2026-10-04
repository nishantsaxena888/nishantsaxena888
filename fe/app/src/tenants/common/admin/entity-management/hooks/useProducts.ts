import { useState, useCallback, useEffect } from 'react';
import type { Product } from '../types';
import { productService } from '../services/productService';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productService.getProducts();
            setProducts(data);
        } catch (err) {
            setError('Failed to fetch products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
        setLoading(true);
        try {
            const newProduct = await productService.createProduct(product);
            setProducts(prev => [...prev, newProduct]);
            return newProduct;
        } catch (err) {
            setError('Failed to add product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        setLoading(true);
        try {
            const updatedProduct = await productService.updateProduct(id, updates);
            setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
            return updatedProduct;
        } catch (err) {
            setError('Failed to update product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        setLoading(true);
        try {
            await productService.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setError('Failed to delete product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteProductsBulk = async (ids: string[]) => {
        setLoading(true);
        try {
            await Promise.all(ids.map(id => productService.deleteProduct(id)));
            setProducts(prev => prev.filter(p => !ids.includes(p.id!)));
        } catch (err) {
            setError('Failed to delete products');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteProductsBulk,
    };
};
