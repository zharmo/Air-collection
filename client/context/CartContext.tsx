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
    addToCart: (
        productId: number,
        quantity: number,
        options?: {
            size?: string;
            color?: string;
            name?: string;
            price?: number;
            image?: string;
        }
    ) => Promise<boolean>;
    removeFromCart: (itemId: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    updateItemSize: (itemId: number, size: string) => Promise<void>;
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

/* ─── Storage helpers ─── */

const loadCartFromStorage = (): Cart => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure every item has required fields so old/corrupt data doesn't break the UI
            const items: CartItem[] = (parsed.items || []).map((item: CartItem) => ({
                id: item.id,
                product_id: item.product_id,
                name: item.name || 'Product',
                price: typeof item.price === 'number' ? item.price : 0,
                quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
                size: item.size ?? undefined,
                color: item.color ?? undefined,
                image: item.image ?? '',
            }));
            return { items, total: computeTotal(items) };
        }
    } catch (e) {
        console.error('CartContext: failed to load cart from storage', e);
    }
    return { items: [], total: 0 };
};

const saveCartToStorage = (cart: Cart) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('CartContext: failed to save cart to storage', e);
    }
};

/* ─── Pure helpers ─── */

const computeTotal = (items: CartItem[]): number =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

/**
 * Generate a unique integer ID.
 * Math.floor avoids the float comparison bug that caused id mismatches.
 */
const generateId = (): number => Math.floor(Date.now() + Math.random() * 1000);

/* ─── Provider ─── */

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);

    /* Sync state → storage and re-render */
    const applyCart = (updated: Cart) => {
        updated.total = computeTotal(updated.items);
        saveCartToStorage(updated);
        // Spread so React always sees a new reference
        setCart({ items: [...updated.items], total: updated.total });
    };

    const fetchCart = async () => {
        setLoading(true);
        const loaded = loadCartFromStorage();
        setCart(loaded);
        setLoading(false);
    };

    const addToCart = async (
        productId: number,
        quantity: number,
        options?: {
            size?: string;
            color?: string;
            name?: string;
            price?: number;
            image?: string;
        }
    ): Promise<boolean> => {
        try {
            const current = loadCartFromStorage();
            const { size, color, name, price, image } = options || {};

            // Normalise undefined → undefined (not null) for consistent comparison
            const normSize  = size  || undefined;
            const normColor = color || undefined;

            const existingIndex = current.items.findIndex(
                (item) =>
                    item.product_id === productId &&
                    item.size === normSize &&
                    item.color === normColor
            );

            if (existingIndex !== -1) {
                // Increment quantity of existing variant
                current.items[existingIndex].quantity += quantity;

                // Also refresh image/price in case they changed (e.g. after a product update)
                if (image) current.items[existingIndex].image = image;
                if (typeof price === 'number') current.items[existingIndex].price = price;
            } else {
                // Guard: price must be a positive number to show correctly in the cart
                if (typeof price !== 'number' || price <= 0) {
                    console.warn('CartContext: addToCart called with missing/zero price', { productId, price });
                }

                const newItem: CartItem = {
                    id: generateId(),
                    product_id: productId,
                    name: name?.trim() || 'Product',
                    price: typeof price === 'number' && price > 0 ? price : 0,
                    quantity: Math.max(1, quantity),
                    size: normSize,
                    color: normColor,
                    image: image ?? '',
                };
                current.items.push(newItem);
            }

            applyCart(current);
            return true;
        } catch (error) {
            console.error('CartContext: addToCart error', error);
            return false;
        }
    };

    const removeFromCart = async (itemId: number): Promise<void> => {
        const current = loadCartFromStorage();
        const before = current.items.length;
        current.items = current.items.filter((item) => item.id !== itemId);
        if (current.items.length === before) {
            console.warn('CartContext: removeFromCart – item not found', itemId);
        }
        applyCart(current);
    };

    const updateQuantity = async (itemId: number, quantity: number): Promise<void> => {
        const current = loadCartFromStorage();
        const index = current.items.findIndex((item) => item.id === itemId);
        if (index !== -1) {
            current.items[index].quantity = Math.max(1, quantity);
            applyCart(current);
        } else {
            console.warn('CartContext: updateQuantity – item not found', itemId);
        }
    };

    const updateItemSize = async (itemId: number, size: string): Promise<void> => {
        const current = loadCartFromStorage();
        const index = current.items.findIndex((item) => item.id === itemId);

        if (index === -1) {
            console.warn('CartContext: updateItemSize - item not found', itemId);
            return;
        }

        const nextSize = size || undefined;
        const item = current.items[index];
        const duplicateIndex = current.items.findIndex(
            (cartItem, cartIndex) =>
                cartIndex !== index &&
                cartItem.product_id === item.product_id &&
                cartItem.color === item.color &&
                cartItem.size === nextSize
        );

        if (duplicateIndex !== -1) {
            current.items[duplicateIndex].quantity += item.quantity;
            current.items.splice(index, 1);
        } else {
            current.items[index].size = nextSize;
        }

        applyCart(current);
    };

    const clearCart = async (): Promise<void> => {
        applyCart({ items: [], total: 0 });
    };

    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider
            value={{ cart, loading, addToCart, removeFromCart, updateQuantity, updateItemSize, clearCart, fetchCart }}
        >
            {children}
        </CartContext.Provider>
    );
};
