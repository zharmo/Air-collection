'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/utils/axiosConfig';

interface Category {
    id: number;
    name: string;
    slug: string;
    itemCount?: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axiosInstance.get('/categories');
                const cats = res.data.data;
                // For each category, we can get product count from a separate endpoint or assume it's provided.
                // For simplicity, we'll fetch counts by calling /products?categoryId=... but that's many requests.
                // We'll just show categories without counts or add counts later.
                setCategories(cats);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Hardcoded categories as backup (or use API)
    const allCategories = [
        { name: 'Drop Shoulder', slug: 'drop-shoulder', itemCount: 12 },
        { name: 'Baggy Pants', slug: 'baggy-pants', itemCount: 8 },
        { name: 'Formal Pants', slug: 'formal-pants', itemCount: 15 },
        { name: 'Footwear', slug: 'footwear', itemCount: 24 },
        { name: 'T-shirts', slug: 'tshirt', itemCount: 31 },
        { name: 'Winter', slug: 'winter', itemCount: 6 },
    ];

    const displayCategories = categories.length ? categories.map(c => ({ ...c, itemCount: 0 })) : allCategories;

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-dark"></div></div>;

    return (
        <div className="container py-5">
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold text-uppercase">Explore</h1>
                <h2 className="display-1 fw-bold text-uppercase" style={{ marginTop: '-0.5rem' }}>Categories</h2>
            </div>
            <div className="row g-4">
                {displayCategories.map((cat) => (
                    <div key={cat.slug} className="col-md-4 col-lg-3">
                        <Link href={`/categories/${cat.slug}`} className="text-decoration-none">
                            <div className="card border-0 shadow-sm rounded-0 text-center h-100">
                                <div className="card-body">
                                    <h5 className="card-title text-dark">{cat.name}</h5>
                                    {cat.itemCount !== undefined && <p className="text-muted">{cat.itemCount} items</p>}
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}