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

interface Product {
    id: number;
    category_id: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [productCounts, setProductCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const [categoriesRes, productsRes] = await Promise.all([
                    axiosInstance.get('/categories'),
                    axiosInstance.get('/products'),
                ]);

                const cats = categoriesRes.data.data;
                const products = productsRes.data.data;
                const counts = products.reduce((acc: Record<number, number>, product: Product) => {
                    const categoryId = Number(product.category_id);
                    if (!Number.isNaN(categoryId)) {
                        acc[categoryId] = (acc[categoryId] || 0) + 1;
                    }
                    return acc;
                }, {});

                setCategories(cats);
                setProductCounts(counts);
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

    const displayCategories = categories.length
        ? categories.map((category) => ({
            ...category,
            itemCount: productCounts[Number(category.id)] || 0,
        }))
        : allCategories;

    if (loading) {
        return (
            <>
                <CategoriesStyles />
                <div className="categories-loading">
                    <div className="spinner-border text-dark"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <CategoriesStyles />
            <div className="categories-page">
                <div className="ap-header">
                    <p className="ap-header-eyebrow">The Collection</p>
                    <h1>Categories</h1>
                </div>

                <div className="row g-4">
                    {displayCategories.map((cat) => (
                        <div key={cat.slug} className="col-md-4 col-lg-3">
                            <Link href={`/categories/${cat.slug}`} className="text-decoration-none">
                                <div className="card border-0 shadow-sm rounded-0 text-center h-100">
                                    <div className="card-body">
                                        <h5 className="card-title text-dark">{cat.name}</h5>
                                        {cat.itemCount !== undefined && (
                                            <p className="text-muted">
                                                {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function CategoriesStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

            .categories-page {
                width: 100%;
                max-width: 1220px;
                margin: 0 auto;
                padding: 52px 28px 76px;
            }

            .categories-loading {
                min-height: 60vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ap-header {
                text-align: center;
                padding: 18px 20px 46px;
            }

            .ap-header-eyebrow {
                font-family: 'Jost', sans-serif;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: .22em;
                text-transform: uppercase;
                color: #c8a96e;
                margin: 0 0 10px;
            }

            .ap-header h1 {
                font-family: 'Cormorant Garamond', serif;
                font-size: clamp(42px, 5vw, 72px);
                font-weight: 500;
                color: #0a0a0a;
                line-height: .95;
                margin: 0;
            }

            .categories-page .card-title {
                font-family: 'Jost', sans-serif;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: .16em;
                text-transform: uppercase;
            }

            .categories-page .text-muted {
                font-family: 'Jost', sans-serif;
                font-size: 13px;
                font-weight: 300;
            }

            @media (max-width: 768px) {
                .categories-page { padding: 34px 16px 60px; }
                .ap-header { padding: 8px 12px 32px; }
            }
        `}</style>
    );
}
