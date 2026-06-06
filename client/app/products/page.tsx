'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import axiosInstance from '@/utils/axiosConfig';

interface Product {
    id: number;
    name: string;
    price: number;
    compare_price?: number;
    images: { image_url: string; is_primary: boolean }[];
    category_id: number;
    category_name: string;
    stock_quantity: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function AllProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { addToCart } = useCart();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, selectedCategory, products]);

    const fetchProducts = async () => {
        try {
            const res = await axiosInstance.get('/products');
            setProducts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axiosInstance.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedCategory) {
            filtered = filtered.filter(p => p.category_id === selectedCategory);
        }
        setFilteredProducts(filtered);
    };

    const handleAddToCart = (product: Product) => {
        addToCart(product.id, 1);
    };

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find(img => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory(null);
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h1 className="fw-bold">All Products</h1>
                <button
                    className="btn btn-outline-dark rounded-0 d-lg-none"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? <FaTimes /> : <FaFilter />} Filters
                </button>
            </div>

            <div className="row g-4">
                {/* Filters Sidebar */}
                <div className={`col-lg-3 ${showFilters ? 'd-block' : 'd-none d-lg-block'}`}>
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">Search</h5>
                            <div className="input-group mb-4">
                                <span className="input-group-text bg-white"><FaSearch /></span>
                                <input
                                    type="text"
                                    className="form-control rounded-0"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <h5 className="fw-bold mb-3">Categories</h5>
                            <div className="list-group list-group-flush">
                                <button
                                    className={`list-group-item list-group-item-action border-0 px-0 ${selectedCategory === null ? 'fw-bold text-dark' : 'text-muted'}`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All Categories
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className={`list-group-item list-group-item-action border-0 px-0 ${selectedCategory === cat.id ? 'fw-bold text-dark' : 'text-muted'}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {(searchTerm || selectedCategory) && (
                                <button className="btn btn-sm btn-link text-dark mt-3 p-0" onClick={clearFilters}>
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="col-lg-9">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="display-1 mb-3">🕊️</div>
                            <h3>No products found</h3>
                            <p className="text-muted">Try adjusting your search or filter.</p>
                            <button className="btn btn-dark rounded-0" onClick={clearFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted mb-3">{filteredProducts.length} product(s) found</p>
                            <div className="row g-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="col-md-6 col-lg-4">
                                        <div className="card border-0 shadow-sm h-100 rounded-0">
                                            <Link href={`/products/${product.id}`}>
                                                <div className="d-flex align-items-center justify-content-center p-3" style={{ height: '220px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                                    <img
                                                        src={getPrimaryImage(product)}
                                                        alt={product.name}
                                                        className="img-fluid"
                                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            </Link>
                                            <div className="card-body text-center">
                                                <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                                    <h6 className="card-title">{product.name}</h6>
                                                </Link>
                                                <p className="text-muted small">{product.category_name}</p>
                                                <div className="mb-2">
                                                    <span className="fw-bold">${product.price}</span>
                                                    {product.compare_price && (
                                                        <span className="text-muted ms-2"><del>${product.compare_price}</del></span>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-dark rounded-0 w-100"
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.stock_quantity === 0}
                                                >
                                                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}