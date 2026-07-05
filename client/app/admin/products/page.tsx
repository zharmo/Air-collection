"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCloudUploadAlt,
  FaBoxOpen,
  FaChevronDown,
  FaStar,
  FaCheck,
  FaImage,
  FaPalette,
  FaRuler,
  FaTag,
  FaLayerGroup,
} from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";

/* ── Types ── */
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface ColorVariant {
  id?: number;
  colorName: string;
  color_name?: string;
  imageFile: File | null;
  imagePreview: string | null;
  imageUrl?: string;
  image_url?: string;
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
interface ProductImageUpload {
  id?: number;
  imageFile: File | null;
  imagePreview: string | null;
  imageUrl?: string;
  isPrimary: boolean;
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
  images: { id?: number; image_url: string; is_primary: boolean }[];
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  is_active: boolean;
  size_description?: string;
  // Not every list endpoint returns this, but the full product fetch used in
  // handleEdit often does — kept optional so we can read it defensively
  // without fighting the type checker (see the is_featured fix below).
  is_featured?: boolean;
}

/* ── Skeleton block ── */
function Skel({
  w = "100%",
  h = 14,
  r = 6,
}: {
  w?: string | number;
  h?: number;
  r?: number;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "pmShimmer 1.4s infinite",
      }}
    />
  );
}

/* ── Stock badge ── */
function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 20,
          background: "rgba(239,68,68,.1)",
          color: "#dc2626",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".06em",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ef4444",
            display: "inline-block",
          }}
        />
        Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 20,
          background: "rgba(245,158,11,.1)",
          color: "#d97706",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".06em",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#f59e0b",
            display: "inline-block",
          }}
        />
        {qty} Low Stock
      </span>
    );
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: "rgba(16,185,129,.1)",
        color: "#059669",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".06em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10b981",
          display: "inline-block",
        }}
      />
      {qty} In Stock
    </span>
  );
}

/* ── Form field ── */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontFamily: "Inter,sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontFamily: "Inter,sans-serif",
            fontSize: 11,
            color: "#94a3b8",
            marginTop: 5,
            margin: "5px 0 0",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* ── Section card ── */
function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,.07)",
        borderRadius: 12,
        padding: "24px 28px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 22,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(99,102,241,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} style={{ color: "#6366f1" }} />
        </div>
        <span
          style={{
            fontFamily: "Inter,sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            letterSpacing: "-.01em",
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function ProductsManagement() {
  /* ── State ── */
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "instock" | "outofstock"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(4);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    regularPrice: "",
    discountPrice: "",
    initialStock: "",
    sizeDescription: "",
  });
  const [colors, setColors] = useState<ColorVariant[]>([]);
  const [productImages, setProductImages] = useState<ProductImageUpload[]>([]);
  // ── FIX: track IDs of existing server images the user wants to delete ──
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [sizes, setSizes] = useState<SizeVariant[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryType, setCategoryType] = useState<string>("");
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const catMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  useEffect(() => {
    filterProducts();
  }, [searchTerm, filterType, selectedCategory, products]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node))
        setShowCatMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  /* ── Handlers ── */
  const fetchProducts = async () => {
    try {
      const r = await axiosInstance.get("/products");
      setProducts(r.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const r = await axiosInstance.get("/categories");
      setCategories(r.data.data);
    } catch (e) {
      console.error(e);
    }
  };
  const filterProducts = () => {
    let f = [...products];
    if (searchTerm)
      f = f.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    if (filterType === "instock") f = f.filter((p) => p.stock_quantity > 0);
    if (filterType === "outofstock")
      f = f.filter((p) => p.stock_quantity === 0);
    if (selectedCategory !== "all")
      f = f.filter((p) => p.category_name === selectedCategory);
    setFilteredProducts(f);
    setShowCount(4);
  };
  const getPrimaryImage = (p: Product) => {
    const img = p.images?.find((i) => i.is_primary);
    const path = img?.image_url || p.images?.[0]?.image_url;
    if (!path) return "/images/placeholders/placeholder.jpg";
    return path.startsWith("/uploads") ? `${backendUrl}${path}` : path;
  };
  const getFullImageUrl = (url: string) => {
    if (!url) return "/images/placeholders/placeholder.jpg";
    return url.startsWith("/uploads") ? `${backendUrl}${url}` : url;
  };
  const handleDelete = async (id: number) => {
    if (confirm("Delete this product?")) {
      await axiosInstance.delete(`/products/${id}`);
      fetchProducts();
    }
  };
  const loadMore = () => setShowCount((p) => p + 4);
  const displayedProducts = filteredProducts.slice(0, showCount);
  const totalProducts = filteredProducts.length;
  const getCategoryType = (catId: string) => {
    const cat = categories.find((c) => c.id.toString() === catId);
    if (!cat) return "upper";
    const n = cat.name.toLowerCase();
    if (n.includes("baggy") || n.includes("formal") || n.includes("pant"))
      return "pants";
    if (n.includes("footwear") || n.includes("sandal") || n.includes("clog"))
      return "footwear";
    return "upper";
  };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelectedCategoryId(v);
    setFormData({ ...formData, categoryId: v });
    setCategoryType(getCategoryType(v));
  };
  const addColorVariant = () =>
    setColors([
      ...colors,
      { colorName: "", imageFile: null, imagePreview: null },
    ]);
  const removeColorVariant = (i: number) =>
    setColors(colors.filter((_, j) => j !== i));
  const updateColorName = (i: number, n: string) => {
    const u = [...colors];
    u[i].colorName = n;
    setColors(u);
  };
  const handleColorImage = (i: number, f: File) => {
    const u = [...colors];
    u[i].imageFile = f;
    u[i].imagePreview = URL.createObjectURL(f);
    setColors(u);
  };
  const handleProductImages = (files: FileList | null) => {
    if (!files?.length) return;
    const hasPrimary = productImages.some((img) => img.isPrimary);
    const uploads = Array.from(files).map((f, i) => ({
      imageFile: f,
      imagePreview: URL.createObjectURL(f),
      isPrimary: !hasPrimary && productImages.length === 0 && i === 0,
    }));
    setProductImages([...productImages, ...uploads]);
  };

  // ── FIX: removeProductImage now works for both new uploads AND existing server images ──
  const removeProductImage = (i: number) => {
    const img = productImages[i];

    // If this is an existing server image (has an id), track it for deletion on save
    if (img.id) {
      setDeletedImageIds((prev) => [...prev, img.id!]);
    }

    const u = productImages.filter((_, j) => j !== i);

    // If the removed image was primary, promote the next one
    if (img.isPrimary && u.length > 0) {
      u[0] = { ...u[0], isPrimary: true };
    }

    setProductImages(u);
  };

  const setPrimaryProductImage = (i: number) =>
    setProductImages(
      productImages.map((img, j) => ({ ...img, isPrimary: j === i })),
    );
  const addSizeVariant = () => {
    const s: SizeVariant = {
      colorName: "",
      sizeName: "",
      sizeType: categoryType,
      measurements: {},
      stock: 0,
      isAvailable: true,
    };
    if (categoryType === "pants") s.measurements = { waist: "", length: "" };
    else if (categoryType !== "footwear")
      s.measurements = { chest: "", length: "" };
    setSizes([...sizes, s]);
  };
  const removeSizeVariant = (i: number) =>
    setSizes(sizes.filter((_, j) => j !== i));
  const updateSizeField = (i: number, field: string, value: any) => {
    const u = [...sizes];
    if (field === "colorName") u[i].colorName = value;
    else if (field === "sizeName") u[i].sizeName = value;
    else if (field === "stock") u[i].stock = parseInt(value) || 0;
    else if (field === "isAvailable") u[i].isAvailable = value;
    else if (field.startsWith("measurements.")) {
      const k = field.split(".")[1];
      u[i].measurements = { ...u[i].measurements, [k]: value };
    }
    setSizes(u);
  };
  const uploadProductImage = async (
    productId: number,
    file: File,
    opts: { colorName?: string; isPrimary?: boolean } = {},
  ) => {
    const fd = new FormData();
    fd.append("image", file);
    if (opts.colorName) fd.append("color", opts.colorName);
    fd.append("is_primary", opts.isPrimary ? "true" : "false");
    const r = await axiosInstance.post(`/products/${productId}/images`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data.data.image_url;
  };

  // ── FIX: slugs are now always unique, so two products can share the same
  // name. Previously the slug was just name.toLowerCase().replace(...) with
  // nothing else, so "Classic Shirt" and "Classic Shirt" produced the exact
  // same slug — if the backend enforces a unique constraint on slug (which
  // is standard), the second save would be rejected. This appends the
  // product's own id when editing (keeps the slug stable across edits) or a
  // timestamp + random suffix when creating (guarantees uniqueness). ──
  const generateUniqueSlug = (name: string, existingId?: number) => {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const suffix = existingId
      ? String(existingId)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `${base}-${suffix}`;
  };

  const handleSaveProduct = async () => {
    // ── FIX: basic guard so we don't silently send NaN/empty values to the
    // backend when a required field was skipped (name, category, price). ──
    if (!formData.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    if (!formData.categoryId) {
      alert("Please select a category.");
      return;
    }
    if (!formData.regularPrice || parseFloat(formData.regularPrice) <= 0) {
      alert("Please enter a valid regular price.");
      return;
    }

    setModalLoading(true);
    try {
      let productId: number;
      const payload = {
        name: formData.name,
        // ── FIX: unique slug (see generateUniqueSlug above) so duplicate
        // product names are allowed ──
        slug: generateUniqueSlug(formData.name, editingProduct?.id),
        description: formData.description,
        price: parseFloat(formData.regularPrice),
        compare_price: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        stock_quantity: parseInt(formData.initialStock) || 0,
        category_id: parseInt(formData.categoryId),
        // ── FIX: this used to be hardcoded to false on every save, which
        // meant editing any product (even just fixing a typo) would
        // silently un-feature it if it had been marked featured elsewhere.
        // Now it preserves whatever the product already had, and only
        // defaults to false for brand-new products. ──
        is_featured: editingProduct
          ? Boolean((editingProduct as any).is_featured)
          : false,
        size_description: formData.sizeDescription || null,
      };
      if (editingProduct) {
        await axiosInstance.put(`/products/${editingProduct.id}`, payload);
        productId = editingProduct.id;
      } else {
        const r = await axiosInstance.post("/products", payload);
        productId = r.data.data.id;
      }

      // ── FIX: delete any server images the user removed during editing ──
      for (const imgId of deletedImageIds) {
        try {
          await axiosInstance.delete(`/products/${productId}/images/${imgId}`);
        } catch (e) {
          console.error(`Failed to delete image ${imgId}:`, e);
        }
      }

      const primaryExisting = productImages.find(
        (img) => img.id && img.isPrimary,
      );
      if (primaryExisting?.id)
        await axiosInstance.put(
          `/products/${productId}/images/${primaryExisting.id}/primary`,
        );
      for (const img of productImages)
        if (img.imageFile)
          await uploadProductImage(productId, img.imageFile, {
            isPrimary: img.isPrimary,
          });
      const colorPayload = [];
      for (const c of colors) {
        let url = c.imageUrl;
        if (c.imageFile)
          url = await uploadProductImage(productId, c.imageFile, {
            colorName: c.colorName,
          });
        if (c.colorName && url)
          colorPayload.push({ colorName: c.colorName, imageUrl: url });
      }
      const sizesPayload = sizes.map((s) => ({
        colorName: s.colorName || "",
        sizeName: s.sizeName,
        sizeType: s.sizeType || categoryType,
        measurements: s.measurements,
        stock: s.stock,
        isAvailable: s.isAvailable,
      }));
      await axiosInstance.put(`/products/${productId}/full`, {
        ...payload,
        colors: colorPayload,
        sizes: sizesPayload,
      });
      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
      alert(
        (e as any)?.response?.data?.message ||
          (e as Error)?.message ||
          "Failed to save product",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: "",
      description: "",
      regularPrice: "",
      discountPrice: "",
      initialStock: "",
      sizeDescription: "",
    });
    setProductImages([]);
    setColors([]);
    setSizes([]);
    setSelectedCategoryId("");
    setCategoryType("");
    // ── FIX: clear deleted image tracking on reset ──
    setDeletedImageIds([]);
  };

  const handleEdit = async (p: Product) => {
    let full: any = p;
    try {
      const r = await axiosInstance.get(`/products/${p.id}`);
      full = r.data.data;
    } catch (e) {
      console.error("Failed to fetch full product for edit, using list data", e);
    }

    // ── FIX: category_id.toString() would throw if this ever came back
    // null/undefined from the API — guard it instead of assuming it's
    // always present. ──
    const catId = full.category_id != null ? full.category_id.toString() : "";
    const catType = getCategoryType(catId);

    setEditingProduct(full);
    setFormData({
      name: full.name,
      categoryId: catId,
      description: full.description || "",
      regularPrice: full.price.toString(),
      discountPrice: full.compare_price?.toString() || "",
      initialStock: full.stock_quantity.toString(),
      sizeDescription: full.size_description || "",
    });
    setSelectedCategoryId(catId);
    setCategoryType(catType);

    setProductImages(
      full.images?.map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        imagePreview: getFullImageUrl(img.image_url),
        imageFile: null,
        isPrimary: img.is_primary,
      })) || [],
    );

    // ── FIX: reset deleted image IDs when opening edit modal ──
    setDeletedImageIds([]);

    const loadedColors = full.colors || [];
    setColors(
      loadedColors.map((c: any) => ({
        id: c.id,
        colorName: c.color_name,
        imageUrl: c.image_url,
        imagePreview: getFullImageUrl(c.image_url),
        imageFile: null,
      })),
    );

    setSizes(
      (full.sizes || []).map((s: any) => {
        const matchedColor = loadedColors.find((c: any) => c.id === s.color_id);
        return {
          id: s.id,
          colorName: matchedColor?.color_name || "",
          sizeName: s.size_name,
          sizeType: s.size_type || catType,
          measurements: s.measurements || {},
          stock: s.stock ?? 0,
          isAvailable: s.is_available ?? true,
        };
      }),
    );

    setShowModal(true);
  };

  /* ── Size rows renderer ── */
  const renderSizeRows = () => {
    const inputStyle = {
      width: "100%",
      height: 36,
      padding: "0 10px",
      fontFamily: "Inter,sans-serif",
      fontSize: 12,
      color: "#0f172a",
      background: "#f8fafc",
      border: "1px solid rgba(0,0,0,.1)",
      borderRadius: 6,
      outline: "none",
    };
    const selectStyle = { ...inputStyle, cursor: "pointer" };
    const colorOpts = (
      <>
        <option value="">All Colors</option>
        {colors.map((c, ci) => (
          // ── FIX: index-based key instead of colorName, since two color
          // variants can briefly share the same (or empty) name while
          // being typed, which caused a React duplicate-key warning ──
          <option key={`color-opt-${ci}`} value={c.colorName}>
            {c.colorName}
          </option>
        ))}
      </>
    );

    if (categoryType === "pants")
      return sizes.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 80px auto 36px",
            gap: 8,
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <select
            style={selectStyle}
            value={s.colorName}
            onChange={(e) => updateSizeField(i, "colorName", e.target.value)}
          >
            {colorOpts}
          </select>
          <input
            style={inputStyle}
            placeholder="S / M / L / XL"
            value={s.sizeName}
            onChange={(e) => updateSizeField(i, "sizeName", e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder='Waist (")'
            value={s.measurements?.waist || ""}
            onChange={(e) =>
              updateSizeField(i, "measurements.waist", e.target.value)
            }
          />
          <input
            style={inputStyle}
            placeholder='Length (")'
            value={s.measurements?.length || ""}
            onChange={(e) =>
              updateSizeField(i, "measurements.length", e.target.value)
            }
          />
          <input
            style={inputStyle}
            type="number"
            placeholder="Qty"
            value={s.stock}
            onChange={(e) => updateSizeField(i, "stock", e.target.value)}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontFamily: "Inter,sans-serif",
              fontSize: 12,
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={s.isAvailable}
              onChange={(e) =>
                updateSizeField(i, "isAvailable", e.target.checked)
              }
              style={{ accentColor: "#6366f1" }}
            />{" "}
            Available
          </label>
          <button
            onClick={() => removeSizeVariant(i)}
            style={{
              width: 36,
              height: 36,
              border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 6,
              background: "rgba(239,68,68,.06)",
              color: "#dc2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaTimes size={11} />
          </button>
        </div>
      ));
    if (categoryType === "footwear")
      return sizes.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 80px auto 36px",
            gap: 8,
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <select
            style={selectStyle}
            value={s.colorName}
            onChange={(e) => updateSizeField(i, "colorName", e.target.value)}
          >
            {colorOpts}
          </select>
          <input
            style={inputStyle}
            placeholder="39 / 40 / 41"
            value={s.sizeName}
            onChange={(e) => updateSizeField(i, "sizeName", e.target.value)}
          />
          <input
            style={inputStyle}
            type="number"
            placeholder="Qty"
            value={s.stock}
            onChange={(e) => updateSizeField(i, "stock", e.target.value)}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontFamily: "Inter,sans-serif",
              fontSize: 12,
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={s.isAvailable}
              onChange={(e) =>
                updateSizeField(i, "isAvailable", e.target.checked)
              }
              style={{ accentColor: "#6366f1" }}
            />{" "}
            Available
          </label>
          <button
            onClick={() => removeSizeVariant(i)}
            style={{
              width: 36,
              height: 36,
              border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 6,
              background: "rgba(239,68,68,.06)",
              color: "#dc2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaTimes size={11} />
          </button>
        </div>
      ));
    return sizes.map((s, i) => (
      <div
        key={i}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 80px auto 36px",
          gap: 8,
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}
      >
        <select
          style={selectStyle}
          value={s.colorName}
          onChange={(e) => updateSizeField(i, "colorName", e.target.value)}
        >
          {colorOpts}
        </select>
        <input
          style={inputStyle}
          placeholder="XS / S / M / L / XL"
          value={s.sizeName}
          onChange={(e) => updateSizeField(i, "sizeName", e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder='Chest (")'
          value={s.measurements?.chest || ""}
          onChange={(e) =>
            updateSizeField(i, "measurements.chest", e.target.value)
          }
        />
        <input
          style={inputStyle}
          placeholder='Length (")'
          value={s.measurements?.length || ""}
          onChange={(e) =>
            updateSizeField(i, "measurements.length", e.target.value)
          }
        />
        <input
          style={inputStyle}
          type="number"
          placeholder="Qty"
          value={s.stock}
          onChange={(e) => updateSizeField(i, "stock", e.target.value)}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif",
            fontSize: 12,
            color: "#64748b",
            whiteSpace: "nowrap",
          }}
        >
          <input
            type="checkbox"
            checked={s.isAvailable}
            onChange={(e) =>
              updateSizeField(i, "isAvailable", e.target.checked)
            }
            style={{ accentColor: "#6366f1" }}
          />{" "}
          Available
        </label>
        <button
          onClick={() => removeSizeVariant(i)}
          style={{
            width: 36,
            height: 36,
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 6,
            background: "rgba(239,68,68,.06)",
            color: "#dc2626",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaTimes size={11} />
        </button>
      </div>
    ));
  };

  const inStock = products.filter((p) => p.stock_quantity > 0).length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const lowStock = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= 5,
  ).length;

  /* ───────── RENDER ───────── */
  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
                @keyframes pmShimmer { to { background-position: -200% 0; } }
                @keyframes pmFadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                @keyframes pmFadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes pmSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }

                :root {
                    --pm-ink:     #0f172a;
                    --pm-soft:    #64748b;
                    --pm-faint:   #94a3b8;
                    --pm-border:  rgba(0,0,0,0.07);
                    --pm-white:   #ffffff;
                    --pm-bg:      #f8f9fb;
                    --pm-muted:   #f1f5f9;
                    --pm-indigo:  #6366f1;
                    --pm-green:   #10b981;
                    --pm-red:     #ef4444;
                    --pm-amber:   #f59e0b;
                    --pm-shadow:  0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06);
                    --pm-shadow-h:0 4px 6px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.1);
                    --pm-radius:  12px;
                }
                .pm-root { font-family:'Inter',sans-serif; color:var(--pm-ink); }
                .pm-root * { box-sizing:border-box; }
                input, select, textarea { font-family:'Inter',sans-serif !important; }
                input:focus, select:focus, textarea:focus { outline:none; border-color:var(--pm-indigo) !important; box-shadow:0 0 0 3px rgba(99,102,241,.12) !important; }

                .pm-card { background:var(--pm-white); border:1px solid var(--pm-border); border-radius:var(--pm-radius); box-shadow:var(--pm-shadow); transition:box-shadow .25s, transform .25s; }
                .pm-card:hover { box-shadow:var(--pm-shadow-h); transform:translateY(-2px); }

                .pm-product-card { background:var(--pm-white); border:1px solid var(--pm-border); border-radius:var(--pm-radius); box-shadow:var(--pm-shadow); overflow:hidden; display:flex; align-items:stretch; transition:box-shadow .25s, transform .22s; animation: pmFadeUp .35s ease both; }
                .pm-product-card:hover { box-shadow:var(--pm-shadow-h); transform:translateY(-2px); }
                .pm-product-img-wrap { width:120px; min-height:100%; align-self:stretch; background:#f7f6f3; flex-shrink:0; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
                .pm-product-img-wrap img { width:100%; height:100%; object-fit:cover; padding:0; transition:transform .4s ease; }
                .pm-product-card:hover .pm-product-img-wrap img { transform:scale(1.06); }

                .pm-action-btn { width:32px; height:32px; border-radius:8px; border:1px solid var(--pm-border); background:var(--pm-white); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .18s; color:var(--pm-soft); }
                .pm-action-btn:hover.edit  { background:rgba(99,102,241,.08); border-color:rgba(99,102,241,.3); color:#6366f1; }
                .pm-action-btn:hover.del   { background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.3); color:#dc2626; }

                .pm-chip { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:20px; font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; border:1px solid var(--pm-border); background:var(--pm-white); color:var(--pm-soft); transition:all .18s; }
                .pm-chip:hover { border-color:var(--pm-indigo); color:var(--pm-indigo); }
                .pm-chip.active { background:var(--pm-indigo); color:#fff; border-color:var(--pm-indigo); }

                .pm-fab { position:fixed; bottom:28px; right:28px; z-index:800; width:52px; height:52px; border-radius:50%; background:var(--pm-indigo); color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(99,102,241,.45); transition:transform .2s, box-shadow .2s; }
                .pm-fab:hover { transform:scale(1.08); box-shadow:0 8px 28px rgba(99,102,241,.5); }

                .pm-modal-overlay { position:fixed; inset:0; z-index:1000; background:rgba(10,15,30,.5); backdrop-filter:blur(6px); display:flex; align-items:flex-start; justify-content:center; padding:32px 20px; overflow-y:auto; animation:pmFadeIn .22s ease; }
                .pm-modal { background:var(--pm-bg); border-radius:16px; width:100%; max-width:960px; box-shadow:0 24px 80px rgba(0,0,0,.2); animation:pmSlideUp .3s cubic-bezier(.16,1,.3,1); overflow:hidden; }
                .pm-modal-head { background:var(--pm-white); border-bottom:1px solid var(--pm-border); padding:24px 32px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:10; }
                .pm-modal-body { padding:24px 28px 0; max-height:calc(100vh - 200px); overflow-y:auto; }
                .pm-modal-body::-webkit-scrollbar { width:4px; }
                .pm-modal-body::-webkit-scrollbar-thumb { background:var(--pm-border); border-radius:2px; }
                .pm-modal-foot { background:var(--pm-white); border-top:1px solid var(--pm-border); padding:20px 28px; display:flex; align-items:center; justify-content:flex-end; gap:12px; position:sticky; bottom:0; z-index:10; }

                .pm-input { width:100%; height:40px; padding:0 12px; font-family:'Inter',sans-serif; font-size:13px; color:var(--pm-ink); background:var(--pm-muted); border:1px solid var(--pm-border); border-radius:8px; outline:none; transition:all .18s; }
                .pm-input:focus { background:#fff; border-color:var(--pm-indigo); box-shadow:0 0 0 3px rgba(99,102,241,.12); }
                .pm-input::placeholder { color:var(--pm-faint); }
                .pm-textarea { width:100%; padding:12px; font-family:'Inter',sans-serif; font-size:13px; color:var(--pm-ink); background:var(--pm-muted); border:1px solid var(--pm-border); border-radius:8px; outline:none; resize:vertical; min-height:100px; transition:all .18s; line-height:1.6; }
                .pm-textarea:focus { background:#fff; border-color:var(--pm-indigo); box-shadow:0 0 0 3px rgba(99,102,241,.12); }
                .pm-select { width:100%; height:40px; padding:0 32px 0 12px; font-family:'Inter',sans-serif; font-size:13px; color:var(--pm-ink); background:var(--pm-muted) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; border:1px solid var(--pm-border); border-radius:8px; outline:none; appearance:none; cursor:pointer; transition:all .18s; }
                .pm-select:focus { background-color:#fff; border-color:var(--pm-indigo); box-shadow:0 0 0 3px rgba(99,102,241,.12); }

                .pm-upload-zone { border:2px dashed var(--pm-border); border-radius:10px; padding:28px; text-align:center; cursor:pointer; transition:all .22s; background:var(--pm-muted); }
                .pm-upload-zone:hover, .pm-upload-zone.drag-over { border-color:var(--pm-indigo); background:rgba(99,102,241,.04); }

                .pm-img-thumb { position:relative; border:1px solid var(--pm-border); border-radius:8px; overflow:hidden; background:#f7f6f3; width:100px; height:100px; flex-shrink:0; }
                .pm-img-thumb img { width:100%; height:100%; object-fit:contain; padding:8px; }
                .pm-img-thumb-actions { position:absolute; inset:0; background:rgba(10,15,30,.5); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; opacity:0; transition:opacity .2s; }
                .pm-img-thumb:hover .pm-img-thumb-actions { opacity:1; }
                .pm-img-thumb.primary-img { border-color:var(--pm-indigo); box-shadow:0 0 0 2px rgba(99,102,241,.35); }

                .pm-color-card { background:var(--pm-muted); border:1px solid var(--pm-border); border-radius:10px; padding:16px; position:relative; }

                /* ── Layout helpers for the modal form (allow mobile override) ── */
                .pm-modal-2col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
                .pm-price-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
                .pm-size-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

                .pm-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:0 18px; height:38px; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; border-radius:8px; cursor:pointer; transition:all .2s; border:none; }
                .pm-btn-primary { background:var(--pm-indigo); color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.35); }
                .pm-btn-primary:hover:not(:disabled) { background:#4f46e5; box-shadow:0 4px 16px rgba(99,102,241,.45); }
                .pm-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
                .pm-btn-ghost { background:var(--pm-white); color:var(--pm-soft); border:1px solid var(--pm-border); }
                .pm-btn-ghost:hover { color:var(--pm-ink); border-color:var(--pm-ink); }
                .pm-btn-outline { background:none; color:var(--pm-indigo); border:1px solid rgba(99,102,241,.35); }
                .pm-btn-outline:hover { background:rgba(99,102,241,.06); border-color:var(--pm-indigo); }
                .pm-btn-sm { height:30px; padding:0 12px; font-size:10px; border-radius:6px; }

                .pm-mono { font-family:'JetBrains Mono',monospace; }

                .pm-product-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

                @media (max-width:900px)  { .pm-product-grid { grid-template-columns:1fr; } }

                /* ══════════════════════════════════════════════════════════
                   MOBILE — Add / Edit Product modal
                   Goal: full-screen modal, header + footer always in view,
                   footer buttons never lost, and no iOS Safari auto-zoom
                   (which was the real cause of the "zoom" / lost button bug —
                   Safari zooms the page when a focused input is under 16px).
                   ══════════════════════════════════════════════════════════ */
                @media (max-width:700px) {
                    .pm-modal-overlay {
                        padding:0;
                        align-items:stretch;
                        justify-content:stretch;
                    }
                    .pm-modal {
                        width:100%;
                        max-width:100%;
                        height:100dvh;
                        max-height:100dvh;
                        border-radius:0;
                        display:flex;
                        flex-direction:column;
                        animation:pmFadeIn .2s ease;
                    }
                    .pm-modal-head {
                        flex:0 0 auto;
                        padding:16px 18px;
                    }
                    .pm-modal-body {
                        flex:1 1 auto;
                        max-height:none;
                        padding:16px 16px 28px;
                        overflow-y:auto;
                        -webkit-overflow-scrolling:touch;
                    }
                    .pm-modal-foot {
                        flex:0 0 auto;
                        padding:12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
                        gap:10px;
                        flex-wrap:nowrap;
                        box-shadow:0 -4px 16px rgba(0,0,0,.06);
                    }
                    /* Hide the helper caption on small screens so the action
                       buttons always have room and stay visible/tappable */
                    .pm-modal-foot p { display:none; }
                    .pm-modal-foot .pm-btn {
                        flex:1 1 0;
                        height:46px;
                        font-size:12px;
                    }

                    .pm-modal-2col { grid-template-columns:1fr; gap:0; }
                    .pm-price-grid { grid-template-columns:1fr 1fr; }

                    /* 16px minimum stops iOS Safari from zooming the viewport
                       on focus — this was pushing the Save/Update button
                       off-screen */
                    .pm-input, .pm-select, .pm-textarea { font-size:16px !important; }
                    .pm-input, .pm-select { height:46px; }
                    .pm-textarea { min-height:110px; }

                    .pm-size-table-scroll > div { min-width:560px; }

                    .pm-upload-zone { padding:22px 16px; }
                    .pm-fab { bottom:calc(20px + env(safe-area-inset-bottom, 0px)); right:20px; width:50px; height:50px; }
                }
                @media (max-width:420px) {
                    .pm-price-grid { grid-template-columns:1fr; }
                }
                @media (max-width:480px)  { .pm-product-img-wrap { width:90px; } }
            `}</style>

      <div className="pm-root">
        {/* ── Page header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
            animation: "pmFadeUp .35s ease",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-.02em",
                color: "var(--pm-ink)",
                margin: 0,
              }}
            >
              Product Management
            </h1>
          </div>
          {/* Summary chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Total",
                val: products.length,
                bg: "rgba(99,102,241,.08)",
                color: "#6366f1",
              },
              {
                label: "In Stock",
                val: inStock,
                bg: "rgba(16,185,129,.08)",
                color: "#059669",
              },
              {
                label: "Low",
                val: lowStock,
                bg: "rgba(245,158,11,.08)",
                color: "#d97706",
              },
              {
                label: "Out",
                val: outOfStock,
                bg: "rgba(239,68,68,.08)",
                color: "#dc2626",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: s.bg,
                }}
              >
                <span
                  style={{
                    fontFamily: "JetBrains Mono,monospace",
                    fontSize: 15,
                    fontWeight: 700,
                    color: s.color,
                  }}
                >
                  {s.val}
                </span>
                <span
                  style={{
                    fontFamily: "Inter,sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: s.color,
                    marginLeft: 6,
                    opacity: 0.7,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,.07)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 1px 3px rgba(0,0,0,.04)",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <FaSearch
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: 12,
              }}
            />
            <input
              type="text"
              className="pm-input"
              style={{ paddingLeft: 36, background: "#f8fafc" }}
              placeholder="Search by name or SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>

          {/* Stock filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "instock", "outofstock"] as const).map((f) => (
              <button
                key={f}
                className={`pm-chip${filterType === f ? " active" : ""}`}
                onClick={() => setFilterType(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "instock"
                    ? "In Stock"
                    : "Out of Stock"}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div ref={catMenuRef} style={{ position: "relative" }}>
            <button
              className="pm-chip"
              style={
                showCatMenu ? { borderColor: "#6366f1", color: "#6366f1" } : {}
              }
              onClick={() => setShowCatMenu((s) => !s)}
            >
              <FaLayerGroup size={10} />
              {selectedCategory === "all" ? "All Categories" : selectedCategory}
              <FaChevronDown
                size={8}
                style={{
                  transition: "transform .2s",
                  transform: showCatMenu ? "rotate(180deg)" : "none",
                }}
              />
            </button>
            {showCatMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.09)",
                  borderRadius: 10,
                  minWidth: 190,
                  boxShadow: "0 8px 32px rgba(0,0,0,.12)",
                  zIndex: 200,
                  padding: "6px 0",
                  animation: "pmFadeUp .18s ease",
                }}
              >
                {["all", ...categories.map((c) => c.name)].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setSelectedCategory(n === "all" ? "all" : n);
                      setShowCatMenu(false);
                    }}
                    style={{
                      width: "100%",
                      background:
                        selectedCategory === (n === "all" ? "all" : n)
                          ? "rgba(99,102,241,.07)"
                          : "none",
                      border: "none",
                      padding: "10px 16px",
                      textAlign: "left",
                      fontFamily: "Inter,sans-serif",
                      fontSize: 12,
                      fontWeight:
                        selectedCategory === (n === "all" ? "all" : n)
                          ? 600
                          : 400,
                      color:
                        selectedCategory === (n === "all" ? "all" : n)
                          ? "#6366f1"
                          : "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {n === "all" ? "All Categories" : n}
                    {selectedCategory === (n === "all" ? "all" : n) && (
                      <FaCheck size={10} style={{ color: "#6366f1" }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Loading skeletons ── */}
        {loading ? (
          <div className="pm-product-grid">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{ width: 110, background: "#f7f6f3", flexShrink: 0 }}
                />
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <Skel w="65%" h={13} />
                  <Skel w="45%" h={10} />
                  <Skel w="50%" h={13} />
                  <Skel w="80px" h={22} r={20} />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          /* ── Empty state ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(99,102,241,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <FaBoxOpen size={28} style={{ color: "#6366f1" }} />
            </div>
            <h3
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--pm-ink)",
                margin: 0,
              }}
            >
              No products found
            </h3>
            <p
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 13,
                color: "#64748b",
                margin: 0,
                maxWidth: 280,
              }}
            >
              Try adjusting your search or filters, or add a new product to get
              started.
            </p>
            <button
              className="pm-btn pm-btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <FaPlus size={10} /> Add Product
            </button>
          </div>
        ) : (
          <>
            <p
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 12,
                color: "#94a3b8",
                marginBottom: 14,
              }}
            >
              Showing{" "}
              <span style={{ color: "var(--pm-ink)", fontWeight: 600 }}>
                {displayedProducts.length}
              </span>{" "}
              of {totalProducts} products
            </p>

            {/* ── Product grid ── */}
            <div className="pm-product-grid">
              {displayedProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="pm-product-card"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  {/* Image */}
                  <div className="pm-product-img-wrap">
                    <img src={getPrimaryImage(p)} alt={p.name} />
                    {p.stock_quantity === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,.38)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Inter,sans-serif",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,.9)",
                          }}
                        >
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "Inter,sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--pm-ink)",
                          margin: 0,
                          lineHeight: 1.35,
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </h3>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          className="pm-action-btn edit"
                          onClick={() => handleEdit(p)}
                          title="Edit"
                        >
                          <FaEdit size={13} />
                        </button>
                        <button
                          className="pm-action-btn del"
                          onClick={() => handleDelete(p.id)}
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>

                    <p
                      style={{
                        fontFamily: "Inter,sans-serif",
                        fontSize: 11,
                        color: "#94a3b8",
                        margin: 0,
                      }}
                    >
                      {p.sku ? (
                        <span className="pm-mono" style={{ fontSize: 11 }}>
                          SKU: {p.sku}
                        </span>
                      ) : (
                        "No SKU"
                      )}{" "}
                      &nbsp;·&nbsp; {p.category_name}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        marginTop: 2,
                      }}
                    >
                      <span
                        className="pm-mono"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--pm-ink)",
                        }}
                      >
                        ${p.price}
                      </span>
                      {p.compare_price && (
                        <span
                          style={{
                            fontFamily: "Inter,sans-serif",
                            fontSize: 12,
                            color: "#94a3b8",
                            textDecoration: "line-through",
                          }}
                        >
                          ${p.compare_price}
                        </span>
                      )}
                      {p.compare_price && (
                        <span
                          style={{
                            fontFamily: "Inter,sans-serif",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#059669",
                            background: "rgba(16,185,129,.1)",
                            padding: "2px 7px",
                            borderRadius: 10,
                          }}
                        >
                          −
                          {Math.round(
                            ((p.compare_price - p.price) / p.compare_price) *
                              100,
                          )}
                          %
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <StockBadge qty={p.stock_quantity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {displayedProducts.length < totalProducts && (
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <button className="pm-btn pm-btn-ghost" onClick={loadMore}>
                  Load More{" "}
                  <span
                    style={{
                      fontFamily: "JetBrains Mono,monospace",
                      fontSize: 11,
                      opacity: 0.6,
                    }}
                  >
                    ({totalProducts - displayedProducts.length} remaining)
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        className="pm-fab"
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        title="Add Product"
      >
        <FaPlus size={20} />
      </button>

      {/* ══════════════════════════════════════
                MODAL
            ══════════════════════════════════════ */}
      {showModal && (
        <div
          className="pm-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="pm-modal">
            {/* Modal head */}
            <div className="pm-modal-head">
              <div>
                <div
                  style={{
                    fontFamily: "Inter,sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    marginBottom: 3,
                  }}
                >
                  {editingProduct ? "Edit Product" : "New Product"}
                </div>
                <h2
                  style={{
                    fontFamily: "Inter,sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--pm-ink)",
                    margin: 0,
                    letterSpacing: "-.01em",
                  }}
                >
                  {editingProduct ? editingProduct.name : "Add to Collection"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,.1)",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  transition: "all .18s",
                }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="pm-modal-body">
              <div className="pm-modal-2col">
                {/* ── Col 1: Basic Info ── */}
                <div>
                  <FormSection icon={FaTag} title="Basic Information">
                    <Field label="Product Name *">
                      <input
                        className="pm-input"
                        type="text"
                        placeholder="e.g. Classic Linen Shirt"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Category *">
                      <select
                        className="pm-select"
                        value={formData.categoryId}
                        onChange={handleCategoryChange}
                      >
                        <option value="">Select a category…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Description">
                      <textarea
                        className="pm-textarea"
                        placeholder="Describe the product, materials, fit, and feel…"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </FormSection>
                </div>

                {/* ── Col 2: Pricing & Images ── */}
                <div>
                  <FormSection icon={FaTag} title="Pricing & Inventory">
                    <div className="pm-price-grid">
                      <Field label="Regular Price (USD) *">
                        <div style={{ position: "relative" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#94a3b8",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            $
                          </span>
                          <input
                            className="pm-input pm-mono"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            style={{ paddingLeft: 26 }}
                            value={formData.regularPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                regularPrice: e.target.value,
                              })
                            }
                          />
                        </div>
                      </Field>
                      <Field
                        label="Compare Price"
                        hint="Strike-through price shown to buyers"
                      >
                        <div style={{ position: "relative" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#94a3b8",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            $
                          </span>
                          <input
                            className="pm-input pm-mono"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            style={{ paddingLeft: 26 }}
                            value={formData.discountPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountPrice: e.target.value,
                              })
                            }
                          />
                        </div>
                      </Field>
                    </div>
                    <Field label="Initial Stock Quantity">
                      <input
                        className="pm-input pm-mono"
                        type="number"
                        placeholder="0"
                        value={formData.initialStock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialStock: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </FormSection>

                  {/* ── Product Images ── */}
                  <FormSection icon={FaImage} title="Product Images">
                    {/* Upload zone */}
                    <div
                      className={`pm-upload-zone${imgDragOver ? " drag-over" : ""}`}
                      style={{ marginBottom: 16 }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setImgDragOver(true);
                      }}
                      onDragLeave={() => setImgDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setImgDragOver(false);
                        handleProductImages(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaCloudUploadAlt
                        size={24}
                        style={{ color: "#94a3b8", marginBottom: 8 }}
                      />
                      <p
                        style={{
                          fontFamily: "Inter,sans-serif",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#64748b",
                          margin: "0 0 3px",
                        }}
                      >
                        Drop images here or{" "}
                        <span style={{ color: "#6366f1", fontWeight: 600 }}>
                          browse
                        </span>
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter,sans-serif",
                          fontSize: 11,
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        PNG, JPG up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          handleProductImages(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {/* Thumbnails */}
                    {productImages.length > 0 && (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
                      >
                        {productImages.map((img, idx) => (
                          <div
                            key={`${img.id || "n"}-${idx}`}
                            className={`pm-img-thumb${img.isPrimary ? " primary-img" : ""}`}
                          >
                            <img
                              src={img.imagePreview || img.imageUrl || ""}
                              alt="Product"
                            />
                            <div className="pm-img-thumb-actions">
                              {!img.isPrimary && (
                                <button
                                  onClick={() => setPrimaryProductImage(idx)}
                                  style={{
                                    background: "rgba(99,102,241,.9)",
                                    border: "none",
                                    borderRadius: 5,
                                    color: "#fff",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: ".08em",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Set Primary
                                </button>
                              )}
                              {img.isPrimary && (
                                <span
                                  style={{
                                    background: "rgba(16,185,129,.9)",
                                    borderRadius: 5,
                                    color: "#fff",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: ".08em",
                                    padding: "4px 8px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <FaStar size={8} /> Primary
                                </span>
                              )}
                              {/* ── FIX: Remove button now shows for ALL images (new uploads AND existing server images) ── */}
                              <button
                                onClick={() => removeProductImage(idx)}
                                style={{
                                  background: "rgba(239,68,68,.85)",
                                  border: "none",
                                  borderRadius: 5,
                                  color: "#fff",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: ".08em",
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                            {img.isPrimary && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  background: "#6366f1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FaStar size={8} style={{ color: "#fff" }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>
                </div>
              </div>

              {/* ── Color Variants ── */}
              <FormSection icon={FaPalette} title="Color Variants">
                {colors.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "#94a3b8",
                      fontFamily: "Inter,sans-serif",
                      fontSize: 13,
                    }}
                  >
                    No color variants added yet. Click below to add one.
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  {colors.map((c, idx) => (
                    <div key={idx} className="pm-color-card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: 8,
                        }}
                      >
                        <button
                          onClick={() => removeColorVariant(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            transition: "color .15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ef4444")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#94a3b8")
                          }
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                      <Field label="Color Name">
                        <input
                          className="pm-input"
                          type="text"
                          placeholder="e.g. Midnight Black"
                          value={c.colorName}
                          onChange={(e) => updateColorName(idx, e.target.value)}
                        />
                      </Field>
                      {c.imagePreview ? (
                        <div
                          style={{
                            position: "relative",
                            border: "1px solid rgba(0,0,0,.07)",
                            borderRadius: 8,
                            overflow: "hidden",
                            height: 80,
                            background: "#f7f6f3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={c.imagePreview}
                            alt={c.colorName}
                            style={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                              padding: 8,
                            }}
                          />
                          <button
                            onClick={() => {
                              const u = [...colors];
                              u[idx].imagePreview = null;
                              u[idx].imageFile = null;
                              setColors(u);
                            }}
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "rgba(239,68,68,.85)",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaTimes size={9} />
                          </button>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 80,
                            border: "2px dashed rgba(0,0,0,.1)",
                            borderRadius: 8,
                            cursor: "pointer",
                            gap: 6,
                            transition: "all .18s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#6366f1";
                            e.currentTarget.style.background =
                              "rgba(99,102,241,.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(0,0,0,.1)";
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          <FaImage size={16} style={{ color: "#94a3b8" }} />
                          <span
                            style={{
                              fontFamily: "Inter,sans-serif",
                              fontSize: 10,
                              fontWeight: 500,
                              color: "#94a3b8",
                            }}
                          >
                            Upload image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleColorImage(idx, e.target.files[0])
                            }
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="pm-btn pm-btn-outline pm-btn-sm"
                  onClick={addColorVariant}
                >
                  <FaPlus size={9} /> Add Color Variant
                </button>
              </FormSection>

              {/* ── Size Variants ── */}
              {selectedCategoryId && (
                <FormSection icon={FaRuler} title="Size Variants">
                  {sizes.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: "#94a3b8",
                        fontFamily: "Inter,sans-serif",
                        fontSize: 13,
                      }}
                    >
                      No sizes added. Click below to add a size variant.
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div className="pm-size-table-scroll">
                      {/* Column headers */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            categoryType === "footwear"
                              ? "1fr 1fr 80px auto 36px"
                              : "1fr 1fr 1fr 1fr 80px auto 36px",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        {[
                          "Color",
                          "Size",
                          ...(categoryType === "footwear"
                            ? []
                            : categoryType === "pants"
                              ? ["Waist", "Length"]
                              : ["Chest", "Length"]),
                          "Stock",
                          "Status",
                          "",
                        ].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              fontFamily: "Inter,sans-serif",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                              color: "#94a3b8",
                              padding: "0 0 8px",
                            }}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                      {renderSizeRows()}
                    </div>
                  )}
                  <div style={{ marginTop: 14 }}>
                    <button
                      className="pm-btn pm-btn-outline pm-btn-sm"
                      onClick={addSizeVariant}
                    >
                      <FaPlus size={9} /> Add Size
                    </button>
                  </div>
                </FormSection>
              )}

              {/* ── Size Guide Description ── */}
              {selectedCategoryId && (
                <FormSection icon={FaRuler} title="Size Guide Description">
                  <Field
                    label="Size Guide / Fit Notes"
                    hint="Shown to customers below the size selector on the product page. Describe how sizes fit, measurement tips, or a full size chart in plain text."
                  >
                    <textarea
                      className="pm-textarea"
                      style={{ minHeight: 130 }}
                      placeholder={
                        categoryType === "pants"
                          ? "e.g. Waist measured at the natural waistline. For a relaxed fit, go up one size.\n\nS  = W28–30\"\nM  = W30–32\"\nL  = W32–34\"\nXL = W34–36\""
                          : categoryType === "footwear"
                            ? "e.g. True to size. If between sizes, size up.\n\nEU 39 = UK 6  = US 7\nEU 40 = UK 7  = US 8\nEU 41 = UK 8  = US 9\nEU 42 = UK 9  = US 10"
                            : "e.g. Measured flat across the chest. For a relaxed fit, size up one.\n\nXS = 34–36\"\nS  = 36–38\"\nM  = 38–40\"\nL  = 40–42\"\nXL = 42–44\""
                      }
                      value={formData.sizeDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sizeDescription: e.target.value,
                        })
                      }
                    />
                  </Field>
                </FormSection>
              )}

              <div style={{ height: 8 }} />
            </div>

            {/* Modal footer */}
            <div className="pm-modal-foot">
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  color: "#94a3b8",
                  flex: 1,
                  margin: 0,
                }}
              >
                {editingProduct
                  ? `Editing: ${editingProduct.name}`
                  : "All fields marked with * are required."}
              </p>
              <button
                className="pm-btn pm-btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="pm-btn pm-btn-primary"
                onClick={handleSaveProduct}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,.35)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "pmShimmer .7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    &nbsp;Saving…
                  </>
                ) : (
                  <>
                    <FaCheck size={10} />{" "}
                    {editingProduct ? "Update Product" : "Publish Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
