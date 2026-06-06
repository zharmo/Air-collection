'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaImage, FaTimes, FaTags, FaBoxOpen, FaCheckCircle, FaInbox } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

interface Category {
    id: number;
    name: string;
    slug: string;
    product_count?: number;
    description?: string;
    image?: string | null;
}

export default function CategoriesManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        filterCategories();
    }, [searchTerm, categories]);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const fetchCategories = async () => {
        try {
            const res = await axiosInstance.get('/categories');
            const cats = res.data.data;
            // Fetch product counts
            const productsRes = await axiosInstance.get('/products');
            const products = productsRes.data.data;
            const countMap: Record<number, number> = {};
            products.forEach((product: any) => {
                const catId = product.category_id;
                if (catId) countMap[catId] = (countMap[catId] || 0) + 1;
            });
            const catsWithCount = cats.map((cat: Category) => ({
                ...cat,
                product_count: countMap[cat.id] || 0,
            }));
            setCategories(catsWithCount);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    const filterCategories = () => {
        let filtered = [...categories];
        if (searchTerm) {
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredCategories(filtered);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this category? All products will lose this category association.')) {
            try {
                await axiosInstance.delete(`/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error('Delete failed', error);
            }
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', slug: '', description: '' });
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
        });
        setImageFile(null);
        setImagePreview(cat.image || null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be under 5MB');
            event.target.value = '';
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearSelectedImage = () => {
        setImageFile(null);
        setImagePreview(editingCategory?.image || null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Category name is required');
            return;
        }
        let slug = formData.slug.trim();
        if (!slug) {
            slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('slug', slug);
            payload.append('description', formData.description);
            if (imageFile) {
                payload.append('image', imageFile);
            }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (editingCategory) {
                await axiosInstance.put(`/categories/${editingCategory.id}`, payload, config);
            } else {
                await axiosInstance.post('/categories', payload, config);
            }
            await fetchCategories();
            closeModal();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
    const categoriesWithImages = categories.filter(cat => Boolean(cat.image)).length;
    const emptyCategories = categories.filter(cat => !cat.product_count).length;

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes acFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .ac-fade-up {
                    animation: acFadeUp .4s ease both;
                }

                .ac-delay-1 {
                    animation-delay: .08s;
                }

                .ac-shell {
                    --ac-bg: #f8fafc;
                    --ac-surface: #ffffff;
                    --ac-border: #e2e8f0;
                    --ac-text-1: #0f172a;
                    --ac-text-2: #64748b;
                    --ac-text-3: #94a3b8;
                    --ac-accent: #4f46e5;
                    font-family: Geist, "SF Pro Display", system-ui, sans-serif;
                    color: var(--ac-text-1);
                    background: var(--ac-bg);
                    min-height: 100vh;
                    padding-bottom: 48px;
                }

                .ac-topbar {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 28px;
                    animation: acFadeUp .4s both;
                }

                .ac-page-sub {
                    font-size: .82rem;
                    color: var(--ac-text-2);
                    margin: 4px 0 0;
                }

                .ac-stats {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .ac-stat-card {
                    background: var(--ac-surface);
                    border: 1px solid var(--ac-border);
                    border-radius: 14px;
                    padding: 18px 20px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    box-shadow: 0 2px 16px rgba(0, 0, 0, .055);
                    transition: box-shadow .2s, transform .2s;
                    animation: acFadeUp .4s both;
                }

                .ac-stat-card:hover {
                    box-shadow: 0 6px 24px rgba(0, 0, 0, .09);
                    transform: translateY(-2px);
                }

                .ac-stat-icon {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .ac-stat-label {
                    font-size: .72rem;
                    font-weight: 600;
                    letter-spacing: .05em;
                    text-transform: uppercase;
                    color: var(--ac-text-2);
                    margin: 0 0 3px;
                }

                .ac-stat-value {
                    font-size: 1.35rem;
                    font-weight: 800;
                    letter-spacing: -.04em;
                    color: var(--ac-text-1);
                    margin: 0;
                }

                .ac-toolbar {
                    background: #fff;
                    border: 1px solid var(--ac-border);
                    border-radius: 14px;
                    padding: 14px 18px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
                }

                .ac-search-wrap {
                    position: relative;
                    flex: 1;
                    min-width: 200px;
                }

                .ac-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 12px;
                    pointer-events: none;
                }

                .ac-input {
                    width: 100%;
                    height: 40px;
                    padding: 0 34px 0 36px;
                    font-family: Inter, sans-serif;
                    font-size: 13px;
                    color: #0f172a;
                    background: #f8fafc;
                    border: 1px solid var(--ac-border);
                    border-radius: 10px;
                    outline: none;
                    transition: all .18s;
                }

                .ac-input:focus {
                    background: #fff;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, .12);
                }

                .ac-input::placeholder {
                    color: #94a3b8;
                }

                .ac-search-clear {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    width: 22px;
                    height: 22px;
                }

                .ac-category-card {
                    border: 1px solid var(--ac-border) !important;
                    border-radius: 14px;
                    box-shadow: 0 2px 16px rgba(0, 0, 0, .055) !important;
                    overflow: hidden;
                    transition: box-shadow .25s ease, transform .25s ease;
                }

                .ac-category-card:hover {
                    box-shadow: 0 6px 24px rgba(0, 0, 0, .09) !important;
                    transform: translateY(-2px);
                }

                .ac-category-image {
                    border-radius: 10px;
                }

                .ac-card-title {
                    font-size: .96rem;
                    font-weight: 700;
                    color: var(--ac-text-1);
                    margin: 0 0 4px;
                    letter-spacing: -.01em;
                }

                .ac-card-meta {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    color: var(--ac-text-2);
                    font-size: .78rem;
                    font-weight: 600;
                }

                .ac-card-actions {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .ac-action-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    border: 1px solid var(--ac-border);
                    background: var(--ac-bg);
                    color: var(--ac-text-2);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all .15s;
                }

                .ac-action-btn.edit:hover {
                    border-color: var(--ac-accent);
                    color: var(--ac-accent);
                    background: rgba(79, 70, 229, .06);
                }

                .ac-action-btn.delete:hover {
                    border-color: #ef4444;
                    color: #dc2626;
                    background: rgba(239, 68, 68, .08);
                }

                .ac-floating-add {
                    position: fixed;
                    bottom: 28px;
                    right: 28px;
                    z-index: 800;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: #6366f1;
                    color: #fff;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 16px rgba(99, 102, 241, .45);
                    animation: acFadeUp .4s ease .16s both;
                    transition: transform .2s ease, box-shadow .2s ease;
                }

                .ac-floating-add:hover {
                    transform: scale(1.08);
                    box-shadow: 0 8px 28px rgba(99, 102, 241, .5);
                }

                @media (max-width: 992px) {
                    .ac-stats {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 640px) {
                    .ac-shell {
                        padding-bottom: 32px;
                    }

                    .ac-topbar {
                        margin-bottom: 20px;
                    }

                    .ac-stats {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="position-relative ac-shell">
            {/* Header */}
            <div className="ac-topbar">
                <div>
                    <h1 className="mb-0">Category Management</h1>
                    <p className="ac-page-sub">
                        {categories.length} total categories, {filteredCategories.length} currently visible.
                    </p>
                </div>
            </div>

            <div className="ac-stats">
                {[
                    { label: 'Total Categories', value: categories.length, icon: FaTags, color: '#4f46e5' },
                    { label: 'Products Assigned', value: totalProducts, icon: FaBoxOpen, color: '#0369a1' },
                    { label: 'With Images', value: categoriesWithImages, icon: FaImage, color: '#16a34a' },
                    { label: 'Empty', value: emptyCategories, icon: FaInbox, color: '#b45309' },
                ].map(({ label, value, icon: Icon, color }, index) => (
                    <div key={label} className="ac-stat-card" style={{ animationDelay: `${index * 80}ms` }}>
                        <div className="ac-stat-icon" style={{ background: `${color}18`, color }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="ac-stat-label">{label}</p>
                            <p className="ac-stat-value">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="ac-toolbar ac-fade-up ac-delay-1">
                <div className="ac-search-wrap">
                    <FaSearch className="ac-search-icon" />
                    <input
                        type="text"
                        className="ac-input"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="ac-search-clear"
                            onClick={() => setSearchTerm('')}
                            aria-label="Clear search"
                        >
                            <FaTimes size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories Grid */}
            <div className="row g-4">
                {filteredCategories.map((cat, index) => (
                    <div
                        key={cat.id}
                        className="col-md-6 col-lg-4 ac-fade-up"
                        style={{ animationDelay: `${0.12 + index * 0.04}s` }}
                    >
                        <div className="card border-0 shadow-sm h-100 ac-category-card">
                            <div className="card-body p-4">
                                <div className="ratio ratio-16x9 bg-light mb-3 overflow-hidden ac-category-image">
                                    {cat.image ? (
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-100 h-100 object-fit-cover"
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center text-muted">
                                            <FaImage size={28} />
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="ac-card-title">{cat.name}</h5>
                                        <span className="ac-card-meta">
                                            <FaCheckCircle size={11} />
                                            {cat.product_count} Products
                                        </span>
                                    </div>
                                    <div className="ac-card-actions">
                                        <button
                                            className="ac-action-btn edit"
                                            onClick={() => openEditModal(cat)}
                                            aria-label="Edit category"
                                        >
                                            <FaEdit size={13} />
                                        </button>
                                        <button
                                            className="ac-action-btn delete"
                                            onClick={() => handleDelete(cat.id)}
                                            aria-label="Delete category"
                                        >
                                            <FaTrash size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-5">
                    <p className="text-muted">No categories found.</p>
                </div>
            )}

            {/* Modal for Add/Edit Category */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 1050 }}>
                    <div className="modal-dialog">
                        <div className="modal-content rounded-0">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Category Image</label>
                                    <div className="border bg-light d-flex align-items-center justify-content-center mb-2 overflow-hidden" style={{ minHeight: '180px' }}>
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Category preview"
                                                className="w-100 h-100 object-fit-cover"
                                                style={{ maxHeight: '240px' }}
                                            />
                                        ) : (
                                            <div className="text-muted text-center py-4">
                                                <FaImage size={32} className="mb-2" />
                                                <div>No image selected</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            className="form-control rounded-0"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        {imageFile && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary rounded-0"
                                                onClick={clearSelectedImage}
                                                aria-label="Clear selected image"
                                            >
                                                <FaTimes />
                                            </button>
                                        )}
                                    </div>
                                    <small className="text-muted">Upload JPG, PNG, or WEBP under 5MB.</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Category Name *</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-0"
                                        placeholder="e.g., Baggy Pants"
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (!editingCategory) {
                                                // Auto‑generate slug
                                                const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                                setFormData(prev => ({ ...prev, slug }));
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Slug (URL friendly)</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-0"
                                        placeholder="baggy-pants"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                    <small className="text-muted">Leave empty to auto‑generate</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description (optional)</label>
                                    <textarea
                                        className="form-control rounded-0"
                                        rows={3}
                                        placeholder="Brief description..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline-secondary rounded-0" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-dark rounded-0" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="ac-floating-add"
                onClick={openAddModal}
                title="Add Category"
            >
                <FaPlus size={20} />
            </button>
        </div>
        </>
    );
}
