'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
}

interface Cart {
    items: CartItem[];
    total: number;
}

interface CartContextType {
    cart: Cart;
    loading: boolean;
    addToCart: (productId: number, quantity: number, options?: { size?: string; color?: string; name?: string; price?: number; image?: string }) => Promise<boolean>;
    removeFromCart: (itemId: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'air_collection_cart';

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};

const loadCartFromStorage = (): Cart => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return { items: parsed.items || [], total: parsed.total || 0 };
        } catch {}
    }
    return { items: [], total: 0 };
};

const saveCartToStorage = (cart: Cart) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
};

const computeTotal = (items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        setLoading(true);
        const loaded = loadCartFromStorage();
        setCart(loaded);
        setLoading(false);
    };

    const addToCart = async (productId: number, quantity: number, options?: { size?: string; color?: string; name?: string; price?: number; image?: string }) => {
        try {
            const current = loadCartFromStorage();
            const { size, color, name, price, image } = options || {};
            const existingIndex = current.items.findIndex(
                item => item.product_id === productId && item.size === (size || null) && item.color === (color || null)
            );
            if (existingIndex !== -1) {
                current.items[existingIndex].quantity += quantity;
            } else {
                const newItem: CartItem = {
                    id: Date.now() + Math.random(),
                    product_id: productId,
                    name: name || 'Product',
                    price: price || 0,
                    quantity,
                    size,
                    color,
                    image: image || '',
                };
                current.items.push(newItem);
            }
            current.total = computeTotal(current.items);
            saveCartToStorage(current);
            setCart(current);
            return true;
        } catch (error) {
            console.error('Add to cart error:', error);
            return false;
        }
    };

    const removeFromCart = async (itemId: number) => {
        const current = loadCartFromStorage();
        current.items = current.items.filter(item => item.id !== itemId);
        current.total = computeTotal(current.items);
        saveCartToStorage(current);
        setCart(current);
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        const current = loadCartFromStorage();
        const index = current.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            current.items[index].quantity = Math.max(1, quantity);
            current.total = computeTotal(current.items);
            saveCartToStorage(current);
            setCart(current);
        }
    };

    const clearCart = async () => {
        saveCartToStorage({ items: [], total: 0 });
        setCart({ items: [], total: 0 });
    };

    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};