'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface ColorVariant {
    id?: number;
    colorName: string;
    imageFile: File | null;
    imagePreview: string | null;
    imageUrl?: string;
}

interface SizeVariant {
    id?: number;
    colorName: string;
    sizeName: string;
    sizeType: string;
    measurements: any;
    stock: number;
    isAvailable: boolean;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    compare_price?: number;
    stock_quantity: number;
    category_name: string;
    category_id: number;
    images: { image_url: string; is_primary: boolean }[];
    colors?: ColorVariant[];
    sizes?: SizeVariant[];
    is_active: boolean;
}

export default function ProductsManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'instock' | 'outofstock'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCount, setShowCount] = useState(4);

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        description: '',
        regularPrice: '',
        discountPrice: '',
        initialStock: '',
    });
    const [colors, setColors] = useState<ColorVariant[]>([]);
    const [sizes, setSizes] = useState<SizeVariant[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [categoryType, setCategoryType] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, filterType, selectedCategory, products]);

    const fetchProducts = async () => {
        try {
            const res = await axiosInstance.get('/products');
            setProducts(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axiosInstance.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filterType === 'instock') {
            filtered = filtered.filter(p => p.stock_quantity > 0);
        } else if (filterType === 'outofstock') {
            filtered = filtered.filter(p => p.stock_quantity === 0);
        }
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category_name === selectedCategory);
        }
        setFilteredProducts(filtered);
        setShowCount(4);
    };

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find(img => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const getFullImageUrl = (url: string) => {
        if (!url) return '/images/placeholders/placeholder.jpg';
        if (url.startsWith('/uploads')) return `${backendUrl}${url}`;
        return url;
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this product?')) {
            await axiosInstance.delete(`/products/${id}`);
            fetchProducts();
        }
    };

    const loadMore = () => setShowCount(prev => prev + 4);
    const displayedProducts = filteredProducts.slice(0, showCount);
    const totalProducts = filteredProducts.length;

    const getCategoryType = (catId: string): string => {
        const cat = categories.find(c => c.id.toString() === catId);
        if (!cat) return 'upper';
        const name = cat.name.toLowerCase();
        if (name.includes('baggy') || name.includes('formal') || name.includes('pant')) return 'pants';
        if (name.includes('footwear') || name.includes('sandal') || name.includes('clog')) return 'footwear';
        return 'upper';
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setSelectedCategoryId(catId);
        setFormData({ ...formData, categoryId: catId });
        setCategoryType(getCategoryType(catId));
    };

    const addColorVariant = () => {
        setColors([...colors, { colorName: '', imageFile: null, imagePreview: null }]);
    };
    const removeColorVariant = (idx: number) => {
        setColors(colors.filter((_, i) => i !== idx));
    };
    const updateColorName = (idx: number, name: string) => {
        const updated = [...colors];
        updated[idx].colorName = name;
        setColors(updated);
    };
    const handleColorImage = (idx: number, file: File) => {
        const updated = [...colors];
        updated[idx].imageFile = file;
        updated[idx].imagePreview = URL.createObjectURL(file);
        setColors(updated);
    };

    const addSizeVariant = () => {
        let newSize: SizeVariant = {
            colorName: '',
            sizeName: '',
            sizeType: categoryType,
            measurements: {},
            stock: 0,
            isAvailable: true,
        };
        if (categoryType === 'pants') {
            newSize.measurements = { waist: '', length: '' };
        } else if (categoryType === 'footwear') {
            newSize.measurements = {};
        } else {
            newSize.measurements = { chest: '', length: '' };
        }
        setSizes([...sizes, newSize]);
    };
    const removeSizeVariant = (idx: number) => {
        setSizes(sizes.filter((_, i) => i !== idx));
    };
    const updateSizeField = (idx: number, field: string, value: any) => {
        const updated = [...sizes];
        if (field === 'colorName') updated[idx].colorName = value;
        else if (field === 'sizeName') updated[idx].sizeName = value;
        else if (field === 'stock') updated[idx].stock = parseInt(value) || 0;
        else if (field === 'isAvailable') updated[idx].isAvailable = value;
        else if (field.startsWith('measurements.')) {
            const key = field.split('.')[1];
            updated[idx].measurements = { ...updated[idx].measurements, [key]: value };
        }
        setSizes(updated);
    };

    const uploadColorImage = async (productId: number, colorName: string, file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('color', colorName);
        fd.append('is_primary', 'false');
        const res = await axiosInstance.post(`/products/${productId}/images`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data.image_url;
    };

    const handleSaveProduct = async () => {
        setModalLoading(true);
        try {
            let productId: number;
            const productPayload = {
                name: formData.name,
                slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: formData.description,
                price: parseFloat(formData.regularPrice),
                compare_price: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
                stock_quantity: parseInt(formData.initialStock) || 0,
                category_id: parseInt(formData.categoryId),
                is_featured: false,
            };
            if (editingProduct) {
                await axiosInstance.put(`/products/${editingProduct.id}`, productPayload);
                productId = editingProduct.id;
            } else {
                const res = await axiosInstance.post('/products', productPayload);
                productId = res.data.data.id;
            }

            const colorPayload = [];
            for (const color of colors) {
                let imageUrl = color.imageUrl;
                if (color.imageFile) {
                    imageUrl = await uploadColorImage(productId, color.colorName, color.imageFile);
                }
                if (color.colorName && imageUrl) {
                    colorPayload.push({ colorName: color.colorName, imageUrl });
                }
            }

            const sizesPayload = sizes.map(s => ({
                colorName: s.colorName || '',
                sizeName: s.sizeName,
                sizeType: categoryType,
                measurements: s.measurements,
                stock: s.stock,
                isAvailable: s.isAvailable,
            }));

            const fullPayload = { ...productPayload, colors: colorPayload, sizes: sizesPayload };
            await axiosInstance.put(`/products/${productId}/full`, fullPayload);

            await fetchProducts();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Failed to save product');
        } finally {
            setModalLoading(false);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({ name: '', categoryId: '', description: '', regularPrice: '', discountPrice: '', initialStock: '' });
        setColors([]);
        setSizes([]);
        setSelectedCategoryId('');
        setCategoryType('');
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            categoryId: product.category_id.toString(),
            description: product.description || '',
            regularPrice: product.price.toString(),
            discountPrice: product.compare_price?.toString() || '',
            initialStock: product.stock_quantity.toString(),
        });
        setSelectedCategoryId(product.category_id.toString());
        setCategoryType(getCategoryType(product.category_id.toString()));
        setColors(product.colors?.map((c: any) => ({
            id: c.id,
            colorName: c.color_name,
            imageUrl: c.image_url,
            imagePreview: c.image_url,
            imageFile: null,
        })) || []);
        setSizes(product.sizes?.map((s: any) => ({
            id: s.id,
            colorName: (s.color_id ? product.colors?.find((c: any) => c.id === s.color_id)?.color_name : '') || '',
            sizeName: s.size_name,
            sizeType: s.size_type,
            measurements: s.measurements,
            stock: s.stock,
            isAvailable: s.is_available,
        })) || []);
        setShowModal(true);
    };

    const renderSizeRows = () => {
        if (categoryType === 'pants') {
            return sizes.map((size, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center border-bottom pb-2">
                    <div className="col-2">
                        <select className="form-select form-select-sm" value={size.colorName} onChange={e => updateSizeField(idx, 'colorName', e.target.value)}>
                            <option value="">All Colors</option>
                            {colors.map(c => <option key={c.colorName} value={c.colorName}>{c.colorName}</option>)}
                        </select>
                    </div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Size (S,M,L,XL)" value={size.sizeName} onChange={e => updateSizeField(idx, 'sizeName', e.target.value)} /></div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Waist (in)" value={size.measurements?.waist || ''} onChange={e => updateSizeField(idx, 'measurements.waist', e.target.value)} /></div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Length (in)" value={size.measurements?.length || ''} onChange={e => updateSizeField(idx, 'measurements.length', e.target.value)} /></div>
                    <div className="col-1"><input type="number" className="form-control form-control-sm" placeholder="Stock" value={size.stock} onChange={e => updateSizeField(idx, 'stock', e.target.value)} /></div>
                    <div className="col-2"><div className="form-check"><input className="form-check-input" type="checkbox" checked={size.isAvailable} onChange={e => updateSizeField(idx, 'isAvailable', e.target.checked)} /><label>Available</label></div></div>
                    <div className="col-1"><button className="btn btn-sm btn-danger" onClick={() => removeSizeVariant(idx)}><FaTimes /></button></div>
                </div>
            ));
        } else if (categoryType === 'footwear') {
            return sizes.map((size, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center border-bottom pb-2">
                    <div className="col-2">
                        <select className="form-select form-select-sm" value={size.colorName} onChange={e => updateSizeField(idx, 'colorName', e.target.value)}>
                            <option value="">All Colors</option>
                            {colors.map(c => <option key={c.colorName} value={c.colorName}>{c.colorName}</option>)}
                        </select>
                    </div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Size (39,40,41)" value={size.sizeName} onChange={e => updateSizeField(idx, 'sizeName', e.target.value)} /></div>
                    <div className="col-2"><input type="number" className="form-control form-control-sm" placeholder="Stock" value={size.stock} onChange={e => updateSizeField(idx, 'stock', e.target.value)} /></div>
                    <div className="col-2"><div className="form-check"><input className="form-check-input" type="checkbox" checked={size.isAvailable} onChange={e => updateSizeField(idx, 'isAvailable', e.target.checked)} /><label>Available</label></div></div>
                    <div className="col-1"><button className="btn btn-sm btn-danger" onClick={() => removeSizeVariant(idx)}><FaTimes /></button></div>
                </div>
            ));
        } else {
            return sizes.map((size, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center border-bottom pb-2">
                    <div className="col-2">
                        <select className="form-select form-select-sm" value={size.colorName} onChange={e => updateSizeField(idx, 'colorName', e.target.value)}>
                            <option value="">All Colors</option>
                            {colors.map(c => <option key={c.colorName} value={c.colorName}>{c.colorName}</option>)}
                        </select>
                    </div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Size (XS,S,M,L,XL)" value={size.sizeName} onChange={e => updateSizeField(idx, 'sizeName', e.target.value)} /></div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Chest (in)" value={size.measurements?.chest || ''} onChange={e => updateSizeField(idx, 'measurements.chest', e.target.value)} /></div>
                    <div className="col-2"><input type="text" className="form-control form-control-sm" placeholder="Length (in)" value={size.measurements?.length || ''} onChange={e => updateSizeField(idx, 'measurements.length', e.target.value)} /></div>
                    <div className="col-1"><input type="number" className="form-control form-control-sm" placeholder="Stock" value={size.stock} onChange={e => updateSizeField(idx, 'stock', e.target.value)} /></div>
                    <div className="col-2"><div className="form-check"><input className="form-check-input" type="checkbox" checked={size.isAvailable} onChange={e => updateSizeField(idx, 'isAvailable', e.target.checked)} /><label>Available</label></div></div>
                    <div className="col-1"><button className="btn btn-sm btn-danger" onClick={() => removeSizeVariant(idx)}><FaTimes /></button></div>
                </div>
            ));
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-dark" /></div>;

    return (
        <div className="position-relative">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h1 className="mb-0" style={{ fontWeight: 'normal' }}>Product Management</h1>
                <button
                    className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center shadow"
                    style={{ width: '48px', height: '48px', position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}
                    onClick={() => {
                        setEditingProduct(null);
                        setShowModal(true);
                    }}
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
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter row */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                <button className={`btn ${filterType === 'all' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setFilterType('all')}>ALL PRODUCTS</button>
                <button className={`btn ${filterType === 'instock' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setFilterType('instock')}>IN STOCK</button>
                <button className={`btn ${filterType === 'outofstock' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setFilterType('outofstock')}>OUT OF STOCK</button>
                <div className="dropdown">
                    <button className="btn btn-outline-dark rounded-0 dropdown-toggle" data-bs-toggle="dropdown">CATEGORIES ▼</button>
                    <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => setSelectedCategory('all')}>All Categories</button></li>
                        {categories.map(cat => <li key={cat.id}><button className="dropdown-item" onClick={() => setSelectedCategory(cat.name)}>{cat.name}</button></li>)}
                    </ul>
                </div>
            </div>

            {/* Products grid */}
            <div className="row g-4">
                {displayedProducts.map(product => (
                    <div key={product.id} className="col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex gap-3">
                                    <div className="flex-shrink-0 bg-light d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                        <img src={getPrimaryImage(product)} alt={product.name} className="img-fluid" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h5 className="mb-1" style={{ fontWeight: 'normal' }}>{product.name}</h5>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-link text-dark p-0" onClick={() => handleEdit(product)}><FaEdit size={18} /></button>
                                                <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDelete(product.id)}><FaTrash size={18} /></button>
                                            </div>
                                        </div>
                                        <p className="text-muted small mb-1">SKU: {product.sku || 'N/A'} • {product.category_name}</p>
                                        <div className="mt-2"><span className="fw-normal">${product.price}</span>{product.compare_price && <span className="text-muted ms-2"><del>${product.compare_price}</del></span>}</div>
                                        <div className="mt-2">{product.stock_quantity > 0 ? <span className="badge bg-success rounded-pill">{product.stock_quantity} IN STOCK</span> : <span className="badge bg-danger rounded-pill">OUT OF STOCK</span>}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load more */}
            {displayedProducts.length > 0 && (
                <div className="text-center mt-4">
                    <p className="text-muted">SHOWING {displayedProducts.length} OF {totalProducts} PRODUCTS</p>
                    {displayedProducts.length < totalProducts && <button className="btn btn-outline-dark rounded-0 px-4" onClick={loadMore}>LOAD MORE</button>}
                </div>
            )}
            {displayedProducts.length === 0 && <div className="text-center py-5"><p className="text-muted">No products found.</p></div>}

            {/* Full product modal (add/edit) */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content rounded-0">
                            <div className="modal-header border-0 pb-0"><h5 className="modal-title" style={{ fontWeight: 'normal' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h5><button className="btn-close" onClick={() => setShowModal(false)}></button></div>
                            <div className="modal-body pt-0">
                                <p className="text-muted">Fill in the details to publish a new piece to the collection.</p>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="mb-3"><label className="form-label">PRODUCT NAME</label><input type="text" className="form-control rounded-0" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                        <div className="mb-3"><label className="form-label">CATEGORY</label><select className="form-select rounded-0" value={formData.categoryId} onChange={handleCategoryChange}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                        <div className="mb-3"><label className="form-label">DESCRIPTION</label><textarea rows={4} className="form-control rounded-0" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="mb-3" style={{ fontWeight: 'normal' }}>Inventory & Pricing</h6>
                                        <div className="mb-3"><label>INITIAL STOCK</label><input type="number" className="form-control rounded-0" value={formData.initialStock} onChange={e => setFormData({ ...formData, initialStock: e.target.value })} /></div>
                                        <div className="mb-3"><label>REGULAR PRICE (USD)</label><input type="number" step="0.01" className="form-control rounded-0" value={formData.regularPrice} onChange={e => setFormData({ ...formData, regularPrice: e.target.value })} /></div>
                                        <div className="mb-3"><label>DISCOUNT PRICE (Optional)</label><input type="number" step="0.01" className="form-control rounded-0" value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })} /></div>
                                    </div>
                                </div>

                                <h6 className="mt-3" style={{ fontWeight: 'normal' }}>Color Variants</h6>
                                {colors.map((color, idx) => (
                                    <div key={idx} className="border p-3 mb-3">
                                        <div className="d-flex gap-2 mb-2">
                                            <input type="text" className="form-control w-25" placeholder="Color name" value={color.colorName} onChange={e => updateColorName(idx, e.target.value)} />
                                            <button className="btn btn-sm btn-danger" onClick={() => removeColorVariant(idx)}><FaTimes /> Remove</button>
                                        </div>
                                        {color.imagePreview ? (
                                            <div><img src={color.imagePreview} style={{ maxHeight: '100px' }} /><button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => { const upd = [...colors]; upd[idx].imagePreview = null; upd[idx].imageFile = null; setColors(upd); }}>Change</button></div>
                                        ) : (
                                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleColorImage(idx, e.target.files[0])} />
                                        )}
                                    </div>
                                ))}
                                <button className="btn btn-outline-dark btn-sm" onClick={addColorVariant}><FaPlus /> Add Color Variant</button>

                                {selectedCategoryId && (
                                    <>
                                        <h6 className="mt-4" style={{ fontWeight: 'normal' }}>Size Variants</h6>
                                        <div className="border p-3">
                                            {renderSizeRows()}
                                            <button className="btn btn-outline-dark btn-sm mt-2" onClick={addSizeVariant}><FaPlus /> Add Size</button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary rounded-0" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-dark rounded-0" onClick={handleSaveProduct} disabled={modalLoading}>{modalLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Publish Product')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}