'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '@/utils/axiosConfig';

interface WishlistItem {
    product_id: number;
    name: string;
    price: number;
    image?: string;
}

interface Wishlist {
    items: WishlistItem[];
}

interface WishlistContextType {
    wishlist: Wishlist;
    loading: boolean;
    addToWishlist: (productId: number) => Promise<void>;
    removeFromWishlist: (productId: number) => Promise<void>;
    fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<Wishlist>({ items: [] });
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            setWishlist({ items: [] });
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.get('/wishlist');
            setWishlist(res.data.data);
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (productId: number) => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        try {
            await axiosInstance.post('/wishlist/add', { productId });
            await fetchWishlist();
        } catch (error) {
            console.error('Add to wishlist error', error);
        }
    };

    const removeFromWishlist = async (productId: number) => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        try {
            await axiosInstance.delete(`/wishlist/remove?productId=${productId}`);
            await fetchWishlist();
        } catch (error) {
            console.error('Remove from wishlist error', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist({ items: [] });
        }
    }, [user]);

    return (
        <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, fetchWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};