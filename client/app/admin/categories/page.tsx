'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

interface Category {
    id: number;
    name: string;
    slug: string;
    product_count?: number;
    description?: string;
}

export default function CategoriesManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        filterCategories();
    }, [searchTerm, categories]);

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
        setShowModal(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
        });
        setShowModal(true);
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
            const payload = {
                name: formData.name,
                slug: slug,
                description: formData.description,
            };
            if (editingCategory) {
                await axiosInstance.put(`/categories/${editingCategory.id}`, payload);
            } else {
                await axiosInstance.post('/categories', payload);
            }
            await fetchCategories();
            setShowModal(false);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <div className="position-relative">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h1 className="mb-0" style={{ fontWeight: 500 }}>Category Management</h1>
                {/* Floating + button */}
                <button
                    className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center shadow"
                    style={{ width: '48px', height: '48px', position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}
                    onClick={openAddModal}
                >
                    <FaPlus size={24} />
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                    <span className="input-group-text bg-white"><FaSearch /></span>
                    <input
                        type="text"
                        className="form-control rounded-0"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories Grid */}
            <div className="row g-4">
                {filteredCategories.map(cat => (
                    <div key={cat.id} className="col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="card-title mb-1" style={{ fontWeight: 500 }}>{cat.name}</h5>
                                        <p className="text-muted small mb-0">{cat.product_count} Products</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-link text-dark p-0"
                                            onClick={() => openEditModal(cat)}
                                        >
                                            <FaEdit size={18} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-link text-danger p-0"
                                            onClick={() => handleDelete(cat.id)}
                                        >
                                            <FaTrash size={18} />
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
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
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
                                <button className="btn btn-outline-secondary rounded-0" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-dark rounded-0" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}