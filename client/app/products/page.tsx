"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaArrowRight,
  FaSlidersH,
  FaChevronDown,
} from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import axiosInstance from "@/utils/axiosConfig";

interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  images: { image_url: string; is_primary: boolean }[];
  category_id: number;
  category_name: string;
  stock_quantity: number;
  // Optional — populate these from the backend to enable size/color
  // filtering for a given product. Products without a field are treated
  // as matching any filter on that field.
  sizes?: string[];
  colors?: string[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";

const SORT_LABELS: Record<SortOption, string> = {
  default: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name A–Z",
};

/* ── Size vocab differs by category ──
   "All Products" (and any apparel-style category) → letter sizes.
   Footwear-type categories → EU numeric shoe sizes.
   Categories with no meaningful size axis (accessories, bags, jewelry…)
   simply don't show a Size section at all. */
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];
const NO_SIZE_PATTERN = /accessor|bag|jewel|belt|hat|cap|scarf|watch|home|decor|candle|pillow|cushion/i;
const SHOE_PATTERN = /shoe|footwear|sneaker|boot|sandal|heel|loafer/i;

function getSizeOptionsForCategory(
  categoryId: number | null,
  categories: Category[],
): string[] {
  if (categoryId === null) return CLOTHING_SIZES; // "All Products"
  const cat = categories.find((c) => c.id === categoryId);
  const label = `${cat?.name ?? ""} ${cat?.slug ?? ""}`;
  if (NO_SIZE_PATTERN.test(label)) return [];
  if (SHOE_PATTERN.test(label)) return SHOE_SIZES;
  return CLOTHING_SIZES;
}

const COLOR_OPTIONS = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "White", hex: "#ffffff" },
  { name: "Grey", hex: "#8a8f98" },
  { name: "Gold", hex: "#c8a96e" },
  { name: "Cream", hex: "#f0ecd9" },
];

const PRICE_MIN = 2;
const PRICE_MAX = 1000;
const PRICE_STEP = 2;

// Module-scope cache. Survives a component unmount/remount within the
// same browser session (e.g. navigating to a product page and then
// hitting Back), so a revisit paints the real grid immediately instead
// of dropping into skeleton loaders and refetching. That refetch+skeleton
// swap was the actual cause of scroll position resetting on Back: the
// skeleton grid uses a different image aspect ratio than the real cards,
// so the page's height changes between the two states, which breaks the
// browser's scroll restoration.
interface ProductsData {
  products: Product[];
  categories: Category[];
}
let productsCache: ProductsData | null = null;

/* ────────────────────────────────────────────────────────────────────── */
/* Shared filter panel — used by both the desktop sidebar and the mobile  */
/* drawer so the two stay visually and behaviourally in sync.             */
/* ────────────────────────────────────────────────────────────────────── */
interface FilterPanelProps {
  categories: Category[];
  categoryCounts: Record<number, number>;
  category: number | null;
  onCategoryChange: (id: number | null) => void;
  sizeOptions: string[];
  priceMax: number;
  onPriceChange: (val: number) => void;
  sizes: string[];
  onSizesChange: (val: string[]) => void;
  colors: string[];
  onColorsChange: (val: string[]) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onClear: () => void;
  showInlineClear?: boolean;
}

function FilterPanel({
  categories,
  categoryCounts,
  category,
  onCategoryChange,
  sizeOptions,
  priceMax,
  onPriceChange,
  sizes,
  onSizesChange,
  colors,
  onColorsChange,
  searchTerm,
  onSearchChange,
  onClear,
  showInlineClear = true,
}: FilterPanelProps) {
  const toggleSize = (s: string) =>
    onSizesChange(
      sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s],
    );
  const toggleColor = (c: string) =>
    onColorsChange(
      colors.includes(c) ? colors.filter((x) => x !== c) : [...colors, c],
    );

  const sliderPct = ((priceMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <>
      {/* Search */}
      <div className="ap-search-wrap">
        <input
          type="text"
          className="ap-search-input"
          placeholder="Search products…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm ? (
          <button className="ap-search-clear" onClick={() => onSearchChange("")}>
            <FaTimes size={11} />
          </button>
        ) : (
          <FaSearch className="ap-search-icon" />
        )}
      </div>

      {/* Categories */}
      <div className="ap-filter-section">
        <p className="ap-sidebar-title">Categories</p>
        <div className="ap-pill-list">
          <button
            className={`ap-pill${category === null ? " active" : ""}`}
            onClick={() => onCategoryChange(null)}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`ap-pill${category === cat.id ? " active" : ""}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.name}
              <span className="ap-pill-count">{categoryCounts[cat.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="ap-filter-section">
        <p className="ap-sidebar-title">Price Range</p>
        <div className="ap-range-wrap">
          <input
            type="range"
            className="ap-range-input"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceMax}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            style={{ "--pct": `${sliderPct}%` } as React.CSSProperties}
          />
        </div>
        <div className="ap-range-labels">
          <span>${PRICE_MIN}</span>
          <span>{priceMax >= PRICE_MAX ? `$${PRICE_MAX}+` : `$${priceMax}`}</span>
        </div>
      </div>

      {/* Size — only shown when this category actually has a size axis */}
      {sizeOptions.length > 0 && (
        <div className="ap-filter-section">
          <p className="ap-sidebar-title">Size</p>
          <div className="ap-size-grid">
            {sizeOptions.map((s) => (
              <button
                key={s}
                className={`ap-size-btn${sizes.includes(s) ? " active" : ""}`}
                onClick={() => toggleSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      <div className="ap-filter-section">
        <p className="ap-sidebar-title">Color</p>
        <div className="ap-color-list">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              aria-label={c.name}
              className={`ap-color-swatch${colors.includes(c.name) ? " active" : ""}`}
              style={{ background: c.hex }}
              onClick={() => toggleColor(c.name)}
            />
          ))}
        </div>
      </div>

      {showInlineClear && (
        <button className="ap-clear-btn" onClick={onClear}>
          <FaTimes size={9} /> Clear All Filters
        </button>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function AllProductsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(
    productsCache?.products ?? [],
  );
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(
    productsCache?.categories ?? [],
  );
  // Only block on loading when nothing is cached yet.
  const [loading, setLoading] = useState(!productsCache);

  /* ── Applied filters — seeded from the URL so that navigating to a
     product and hitting Back lands you exactly where you left off,
     category and all, instead of resetting to the unfiltered grid. ── */
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategoryRaw] = useState<number | null>(() => {
    const c = searchParams.get("category");
    return c ? Number(c) : null;
  });
  const [priceMax, setPriceMax] = useState(() => {
    const p = searchParams.get("price");
    return p ? Number(p) : PRICE_MAX;
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
    const s = searchParams.get("size");
    return s ? s.split(",").filter(Boolean) : [];
  });
  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    const c = searchParams.get("color");
    return c ? c.split(",").filter(Boolean) : [];
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const s = searchParams.get("sort") as SortOption | null;
    return s && s in SORT_LABELS ? s : "default";
  });

  // Changing category invalidates the previous size selection, since the
  // size vocabulary (letters vs. shoe numbers vs. none) is category-specific.
  const setSelectedCategory = (id: number | null) => {
    setSelectedCategoryRaw(id);
    setSelectedSizes([]);
  };

  // ── Draft filters (mobile drawer only — committed on "Apply Filters") ──
  const [draftCategory, setDraftCategory] = useState<number | null>(null);
  const [draftPriceMax, setDraftPriceMax] = useState(PRICE_MAX);
  const [draftSizes, setDraftSizes] = useState<string[]>([]);
  const [draftColors, setDraftColors] = useState<string[]>([]);
  const setDraftCategoryChecked = (id: number | null) => {
    setDraftCategory(id);
    setDraftSizes([]);
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { addToCart } = useCart();
  const sortRef = useRef<HTMLDivElement>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  /* ── Data fetching ── */
  useEffect(() => {
    if (productsCache) return; // already have data, skip refetch
    fetchProducts();
    fetchCategories();
  }, []);
  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, priceMax, selectedSizes, selectedColors, sortBy, products]);

  /* Keep the URL in sync with the applied filters. Using replace (not
     push) means every filter tweak updates the SAME history entry, so
     Back from a product page returns to this listing with the last
     filter state intact — category, price, sizes, colors, sort, search. */
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== null) params.set("category", String(selectedCategory));
    if (priceMax < PRICE_MAX) params.set("price", String(priceMax));
    if (selectedSizes.length) params.set("size", selectedSizes.join(","));
    if (selectedColors.length) params.set("color", selectedColors.join(","));
    if (sortBy !== "default") params.set("sort", sortBy);
    if (searchTerm) params.set("q", searchTerm);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, priceMax, selectedSizes, selectedColors, sortBy, searchTerm]);

  /* Close sort menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Lock body scroll when mobile filter is open */
  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/products");
      const data: Product[] = res.data.data ?? [];
      setProducts(data);
      productsCache = { products: data, categories: productsCache?.categories ?? [] };
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      const data: Category[] = res.data.data ?? [];
      setCategories(data);
      productsCache = { products: productsCache?.products ?? [], categories: data };
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchTerm)
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    if (selectedCategory)
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    if (priceMax < PRICE_MAX)
      filtered = filtered.filter((p) => p.price <= priceMax);
    if (selectedSizes.length)
      filtered = filtered.filter(
        (p) => !p.sizes || p.sizes.some((s) => selectedSizes.includes(s)),
      );
    if (selectedColors.length)
      filtered = filtered.filter(
        (p) => !p.colors || p.colors.some((c) => selectedColors.includes(c)),
      );

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1, {
      name: product.name,
      price: Number(product.price),
      image: getPrimaryImage(product),
    });
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.is_primary);
    const imagePath = primary?.image_url || product.images?.[0]?.image_url;
    if (!imagePath) return "/images/placeholders/placeholder.jpg";
    if (imagePath.startsWith("/uploads")) return `${backendUrl}${imagePath}`;
    return imagePath;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryRaw(null);
    setPriceMax(PRICE_MAX);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy("default");
  };

  const isFiltersActive =
    !!searchTerm ||
    selectedCategory !== null ||
    priceMax < PRICE_MAX ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    sortBy !== "default";

  const activeFilterCount =
    (selectedCategory !== null ? 1 : 0) +
    (priceMax < PRICE_MAX ? 1 : 0) +
    (selectedSizes.length > 0 ? 1 : 0) +
    (selectedColors.length > 0 ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const categoryCounts = categories.reduce<Record<number, number>>((acc, cat) => {
    acc[cat.id] = products.filter((p) => p.category_id === cat.id).length;
    return acc;
  }, {});

  const sizeOptions = getSizeOptionsForCategory(selectedCategory, categories);
  const draftSizeOptions = getSizeOptionsForCategory(draftCategory, categories);

  const getDiscount = (p: Product) =>
    p.compare_price
      ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
      : null;

  const formatPrice = (value: number) => Number(value).toFixed(2);

  /* ── Mobile drawer open/apply/clear (draft flow) ── */
  const openMobileFilters = () => {
    setDraftCategory(selectedCategory);
    setDraftPriceMax(priceMax);
    setDraftSizes(selectedSizes);
    setDraftColors(selectedColors);
    setShowMobileFilters(true);
  };

  const applyMobileFilters = () => {
    setSelectedCategoryRaw(draftCategory);
    setPriceMax(draftPriceMax);
    setSelectedSizes(draftSizes);
    setSelectedColors(draftColors);
    setShowMobileFilters(false);
  };

  const clearDraftFilters = () => {
    setDraftCategory(null);
    setDraftPriceMax(PRICE_MAX);
    setDraftSizes([]);
    setDraftColors([]);
    setSearchTerm("");
  };

  /* ─────────────────────────────────────────────────── */

  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                :root {
                    --ink:        #0a0a0a;
                    --ink-soft:   #5c5c5c;
                    --ink-faint:  #aaa;
                    --white:      #ffffff;
                    --warm:       #fafaf7;
                    --muted:      #f4f2ef;
                    --product-bg: #f7f6f3;
                    --accent:     #c8a96e;
                    --accent-lt:  #f0e8d8;
                    --success:    #2d7a4f;
                    --danger:     #c0392b;
                    --border:     rgba(0,0,0,0.08);
                    --border-md:  rgba(0,0,0,0.13);
                    --shadow-sm:  0 2px 16px rgba(0,0,0,0.06);
                    --shadow-md:  0 8px 40px rgba(0,0,0,0.11);
                    --shadow-lg:  0 20px 60px rgba(0,0,0,0.14);
                }

                /* ── Page shell ── */
                .ap-page {
                    min-height: 100vh;
                    background: var(--warm);
                }

                /* ── Page header ── */
                .ap-header {
                    background: var(--white);
                    border-bottom: 1px solid var(--border);
                    padding: 48px max(24px, calc((100vw - 1360px)/2 + 40px)) 32px;
                }
                .ap-header-eyebrow {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 500;
                    letter-spacing: .22em; text-transform: uppercase;
                    color: var(--ink-faint); margin-bottom: 10px;
                    display: flex; align-items: center; gap: 10px;
                }
                .ap-header-eyebrow::before {
                    content: ''; display: block;
                    width: 28px; height: 1px; background: var(--accent);
                }
                .ap-header h1 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(36px, 5vw, 58px);
                    font-weight: 500; line-height: 1; letter-spacing: -.01em;
                    color: var(--ink); margin: 0 0 8px;
                }
                .ap-header-sub {
                    font-family: 'Jost', sans-serif;
                    font-size: 14px; font-weight: 300;
                    color: var(--ink-soft); margin: 0;
                }

                /* ── Layout ── */
                .ap-layout {
                    max-width: 1360px; margin: 0 auto;
                    padding: 40px 40px 80px;
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    gap: 40px;
                    align-items: start;
                }

                /* ── Sidebar ── */
                .ap-sidebar {
                    position: sticky;
                    top: 90px;
                    background: var(--white);
                    border: 1px solid var(--border);
                    padding: 28px 24px;
                    max-height: calc(100vh - 110px);
                    overflow-y: auto;
                }

                .ap-sidebar-title {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: .22em; text-transform: uppercase;
                    color: var(--ink); margin-bottom: 14px;
                    display: flex; align-items: center; gap: 8px;
                }
                .ap-sidebar-title svg { color: var(--accent); }

                /* filter sections */
                .ap-filter-section {
                    margin-bottom: 26px;
                    padding-bottom: 26px;
                    border-bottom: 1px solid var(--border);
                }
                .ap-filter-section:last-of-type { border-bottom: none; }

                /* search */
                .ap-search-wrap {
                    position: relative; margin-bottom: 26px;
                    padding-bottom: 26px; border-bottom: 1px solid var(--border);
                }
                .ap-search-input {
                    width: 100%; height: 44px;
                    padding: 0 36px 0 14px;
                    font-family: 'Jost', sans-serif;
                    font-size: 13px; font-weight: 300; color: var(--ink);
                    background: var(--muted); border: 1px solid transparent; outline: none;
                    transition: border-color .2s, background .2s;
                }
                .ap-search-input:focus { background: var(--white); border-color: var(--ink); }
                .ap-search-input::placeholder { color: var(--ink-faint); }
                .ap-search-icon {
                    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                    color: var(--ink-faint); pointer-events: none; font-size: 12px;
                }
                .ap-search-clear {
                    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: var(--ink-soft); padding: 4px;
                    display: flex; align-items: center;
                    transition: color .2s;
                }
                .ap-search-clear:hover { color: var(--ink); }

                /* category pills */
                .ap-pill-list {
                    display: flex; flex-wrap: wrap; gap: 8px;
                }
                .ap-pill {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 500;
                    letter-spacing: .05em;
                    color: var(--ink-soft); background: var(--white);
                    border: 1px solid var(--border-md);
                    border-radius: 999px;
                    padding: 9px 16px; cursor: pointer;
                    display: inline-flex; align-items: center; gap: 6px;
                    transition: all .18s ease;
                    white-space: nowrap;
                }
                .ap-pill:hover { border-color: var(--ink); color: var(--ink); }
                .ap-pill.active {
                    background: var(--ink); border-color: var(--ink); color: var(--white);
                }
                .ap-pill-count { font-size: 10px; opacity: .6; }
                .ap-pill.active .ap-pill-count { opacity: .75; }

                /* price range */
                .ap-range-wrap { padding: 4px 2px 2px; }
                .ap-range-input {
                    -webkit-appearance: none; appearance: none;
                    width: 100%; height: 2px;
                    border-radius: 2px;
                    background: linear-gradient(to right,
                        var(--ink) 0%, var(--ink) var(--pct, 50%),
                        var(--border-md) var(--pct, 50%), var(--border-md) 100%);
                    cursor: pointer; outline: none;
                }
                .ap-range-input::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 16px; height: 16px; border-radius: 50%;
                    background: var(--ink); border: 3px solid var(--white);
                    box-shadow: 0 0 0 1px var(--ink);
                    cursor: pointer; transition: transform .15s;
                }
                .ap-range-input::-webkit-slider-thumb:hover { transform: scale(1.15); }
                .ap-range-input::-moz-range-thumb {
                    width: 16px; height: 16px; border-radius: 50%;
                    background: var(--ink); border: 3px solid var(--white);
                    box-shadow: 0 0 0 1px var(--ink);
                    cursor: pointer; transition: transform .15s;
                }
                .ap-range-input::-moz-range-track { height: 2px; background: transparent; }
                .ap-range-labels {
                    display: flex; justify-content: space-between;
                    margin-top: 12px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 500;
                    color: var(--ink-soft);
                }

                /* size grid */
                .ap-size-grid {
                    display: grid; grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }
                .ap-size-btn {
                    font-family: 'Jost', sans-serif;
                    font-size: 12px; font-weight: 500;
                    color: var(--ink); background: var(--white);
                    border: 1px solid var(--border-md);
                    padding: 10px 0; cursor: pointer;
                    transition: all .18s ease;
                }
                .ap-size-btn:hover { border-color: var(--ink); }
                .ap-size-btn.active {
                    background: var(--ink); border-color: var(--ink); color: var(--white);
                }

                /* color swatches */
                .ap-color-list { display: flex; flex-wrap: wrap; gap: 12px; }
                .ap-color-swatch {
                    width: 28px; height: 28px; border-radius: 50%;
                    border: 1px solid var(--border-md);
                    cursor: pointer; padding: 0;
                    position: relative;
                    transition: transform .15s ease;
                }
                .ap-color-swatch:hover { transform: scale(1.1); }
                .ap-color-swatch.active {
                    box-shadow: 0 0 0 2px var(--white), 0 0 0 3px var(--ink);
                }

                /* clear filters */
                .ap-clear-btn {
                    margin-top: 4px; width: 100%;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 600;
                    letter-spacing: .18em; text-transform: uppercase;
                    color: var(--ink-soft); background: none;
                    border: 1px solid var(--border-md);
                    padding: 12px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all .2s;
                }
                .ap-clear-btn:hover { color: var(--ink); border-color: var(--ink); }

                /* ── Toolbar ── */
                .ap-toolbar {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
                }
                .ap-count {
                    font-family: 'Jost', sans-serif;
                    font-size: 12px; font-weight: 400;
                    color: var(--ink-faint); letter-spacing: .04em;
                }
                .ap-count strong { color: var(--ink); font-weight: 600; }

                /* sort dropdown */
                .ap-sort-wrap { position: relative; }
                .ap-sort-btn {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 500;
                    letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ink); background: var(--white);
                    border: 1px solid var(--border-md);
                    padding: 10px 18px; cursor: pointer;
                    display: flex; align-items: center; gap: 10px;
                    transition: border-color .2s;
                    white-space: nowrap;
                }
                .ap-sort-btn:hover { border-color: var(--ink); }
                .ap-sort-chevron { transition: transform .25s; color: var(--ink-faint); font-size: 10px; }
                .ap-sort-chevron.open { transform: rotate(180deg); }
                .ap-sort-menu {
                    position: absolute; top: calc(100% + 6px); right: 0;
                    background: var(--white); border: 1px solid var(--border-md);
                    min-width: 200px; z-index: 200;
                    box-shadow: var(--shadow-md);
                    animation: menuIn .2s cubic-bezier(.16,1,.3,1);
                }
                .ap-sort-option {
                    display: block; width: 100%; background: none; border: none; cursor: pointer;
                    padding: 12px 18px; text-align: left;
                    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
                    letter-spacing: .06em; color: var(--ink-soft);
                    border-bottom: 1px solid var(--border);
                    transition: background .14s, color .14s;
                }
                .ap-sort-option:last-child { border-bottom: none; }
                .ap-sort-option:hover { background: var(--muted); color: var(--ink); }
                .ap-sort-option.selected { color: var(--ink); font-weight: 600; background: var(--accent-lt); }

                /* mobile filter button */
                .ap-mobile-filter-btn {
                    display: none;
                    align-items: center; gap: 8px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 600;
                    letter-spacing: .16em; text-transform: uppercase;
                    color: var(--ink); background: var(--white);
                    border: 1px solid var(--border-md);
                    padding: 10px 18px; cursor: pointer;
                    transition: border-color .2s;
                }
                .ap-mobile-filter-btn:hover { border-color: var(--ink); }
                .ap-filter-badge {
                    min-width: 16px; height: 16px; border-radius: 50%;
                    background: var(--accent); color: var(--ink);
                    font-size: 9px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; padding: 0 4px;
                }

                /* ── Product grid ── */
                .ap-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }

                /* ── Product card ── */
                .ap-card {
                    background: var(--white);
                    display: flex; flex-direction: column;
                    position: relative;
                    transition: box-shadow .35s cubic-bezier(.16,1,.3,1), transform .35s cubic-bezier(.16,1,.3,1);
                    cursor: pointer;
                }
                .ap-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-3px);
                }

                /* card image */
                .ap-card-img {
                    background: var(--product-bg);
                    aspect-ratio: 6/7;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; position: relative;
                }
                .ap-card-img img {
                    width: 100%; height: 100%;
                    object-fit: cover; padding: 0;
                    transition: transform .55s cubic-bezier(.16,1,.3,1);
                }
                .ap-card:hover .ap-card-img img { transform: scale(1.06); }

                /* badges */
                .ap-badge-wrap {
                    position: absolute; top: 12px; left: 12px;
                    display: flex; flex-direction: column; gap: 5px; z-index: 2;
                }
                .ap-badge {
                    font-family: 'Jost', sans-serif;
                    font-size: 9px; font-weight: 700;
                    letter-spacing: .08em; text-transform: uppercase;
                    padding: 3px 6px; display: inline-block; width: fit-content;
                }
                .ap-badge-sale    { background: var(--ink); color: #fff; }
                .ap-badge-new     { background: var(--accent); color: var(--ink); }
                .ap-badge-sold    { background: rgba(255,255,255,.9); color: var(--danger); border: 1px solid rgba(192,57,43,.2); }

                /* hover overlay */
                .ap-card-overlay {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    background: var(--ink); padding: 12px 10px;
                    transform: translateY(100%);
                    transition: transform .32s cubic-bezier(.16,1,.3,1);
                    z-index: 3;
                }
                .ap-card:hover .ap-card-overlay { transform: translateY(0); }
                .ap-overlay-btn {
                    width: 100%; background: none; border: none;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: .2em; text-transform: uppercase;
                    color: #fff; cursor: pointer; padding: 6px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: opacity .2s;
                }
                .ap-overlay-btn:hover { opacity: .7; }
                .ap-overlay-btn:disabled { opacity: .35; cursor: not-allowed; }

                /* card body */
                .ap-card-body { padding: 16px 4px 8px; flex: 1; display: flex; flex-direction: column; }
                .ap-card-cat {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 500;
                    letter-spacing: .16em; text-transform: uppercase;
                    color: var(--ink-faint); margin-bottom: 4px;
                }
                .ap-card-name {
                    font-family: 'Jost', sans-serif;
                    font-size: 14px; font-weight: 400;
                    color: var(--ink); text-decoration: none; letter-spacing: .01em;
                    display: block; margin-bottom: 10px; line-height: 1.4;
                    flex: 1;
                    transition: opacity .2s;
                }
                .ap-card-name:hover { opacity: .55; }
                .ap-card-price-row { display: flex; align-items: baseline; gap: 8px; }
                .ap-card-price {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px; font-weight: 600; color: var(--ink);
                }
                .ap-card-compare {
                    font-family: 'Jost', sans-serif;
                    font-size: 12px; font-weight: 300;
                    color: var(--ink-faint); text-decoration: line-through;
                }

                /* ── Empty state ── */
                .ap-empty {
                    grid-column: 1 / -1;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 100px 24px; text-align: center; gap: 20px;
                }
                .ap-empty-icon {
                    width: 80px; height: 80px; border-radius: 50%;
                    background: var(--muted);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 32px; margin-bottom: 8px;
                }
                .ap-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px; font-weight: 500;
                    color: var(--ink); margin: 0;
                }
                .ap-empty p {
                    font-family: 'Jost', sans-serif;
                    font-size: 14px; font-weight: 300;
                    color: var(--ink-soft); margin: 0; max-width: 300px;
                }
                .ap-empty-btn {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 600;
                    letter-spacing: .18em; text-transform: uppercase;
                    color: #fff; background: var(--ink);
                    border: none; padding: 14px 32px; cursor: pointer;
                    display: flex; align-items: center; gap: 10px;
                    transition: opacity .2s;
                }
                .ap-empty-btn:hover { opacity: .75; }

                /* ── Skeleton loading ── */
                .ap-skeleton-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .ap-skeleton-card { background: var(--white); overflow: hidden; }
                .ap-skeleton-img {
                    aspect-ratio: 6/7;
                    background: linear-gradient(90deg, var(--muted) 25%, var(--warm) 50%, var(--muted) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.4s infinite;
                }
                .ap-skeleton-line {
                    height: 12px; margin: 16px 4px 8px;
                    background: linear-gradient(90deg, var(--muted) 25%, var(--warm) 50%, var(--muted) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.4s infinite;
                }
                .ap-skeleton-line.short { width: 55%; height: 10px; margin-top: 6px; }
                @keyframes shimmer { to { background-position: -200% 0; } }

                /* ── Mobile filter drawer ── */
                .ap-mobile-overlay {
                    position: fixed; inset: 0; z-index: 1000;
                    background: rgba(10,10,10,.5);
                    backdrop-filter: blur(4px);
                    animation: fadeIn .22s ease;
                }
                .ap-mobile-drawer {
                    position: fixed; top: 0; right: 0; bottom: 0;
                    width: min(340px, 88vw);
                    background: var(--white);
                    z-index: 1001; overflow-y: auto;
                    padding: 0;
                    display: flex; flex-direction: column;
                    animation: slideInRight .3s cubic-bezier(.16,1,.3,1);
                }
                .ap-drawer-head {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 24px;
                    border-bottom: 1px solid var(--border);
                    position: sticky; top: 0; background: var(--white); z-index: 2;
                    flex-shrink: 0;
                }
                .ap-drawer-head-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px; font-weight: 600;
                    color: var(--ink);
                }
                .ap-drawer-close {
                    background: none; border: none; cursor: pointer;
                    color: var(--ink-soft); padding: 6px;
                    display: flex; align-items: center;
                    transition: color .2s;
                }
                .ap-drawer-close:hover { color: var(--ink); }
                .ap-drawer-body { padding: 24px; flex: 1; overflow-y: auto; }
                .ap-drawer-footer {
                    display: flex; gap: 12px; padding: 18px 24px;
                    border-top: 1px solid var(--border);
                    background: var(--white); flex-shrink: 0;
                    position: sticky; bottom: 0;
                }
                .ap-drawer-footer .ap-clear-btn { margin-top: 0; flex: 0 0 auto; width: auto; padding: 12px 18px; }
                .ap-apply-btn {
                    flex: 1;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 700;
                    letter-spacing: .18em; text-transform: uppercase;
                    color: #fff; background: var(--ink);
                    border: none; cursor: pointer;
                    transition: opacity .2s;
                }
                .ap-apply-btn:hover { opacity: .82; }

                /* ── Keyframes ── */
                @keyframes fadeIn        { from { opacity: 0 } to { opacity: 1 } }
                @keyframes menuIn        { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
                @keyframes slideInRight  { from { transform:translateX(100%) } to { transform:translateX(0) } }

                /* ── Responsive ── */
                @media (max-width: 1100px) {
                    .ap-layout { grid-template-columns: 220px 1fr; padding: 28px 24px 60px; gap: 28px; }
                    .ap-grid   { grid-template-columns: repeat(2, 1fr); }
                    .ap-skeleton-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .ap-layout { grid-template-columns: 1fr; padding: 20px 16px 60px; }
                    .ap-sidebar { display: none; }
                    .ap-mobile-filter-btn { display: flex; }
                    .ap-grid   { grid-template-columns: repeat(2, 1fr); gap: 18px; }
                    .ap-skeleton-grid { grid-template-columns: repeat(2, 1fr); }
                    .ap-header { padding: 32px 20px 24px; }
                }
                @media (max-width: 480px) {
                    .ap-grid { grid-template-columns: 1fr 1fr; gap: 15px; }
                    .ap-card-img img { padding: 0; }
                }
            `}</style>

      {/* ── Page header ── */}
      <div className="ap-header">
        <p className="ap-header-eyebrow">The Collection</p>
        <h1>All Products</h1>
      </div>

      <div className="ap-layout">
        {/* ── Desktop sidebar ── */}
        <aside className="ap-sidebar">
          <p className="ap-sidebar-title">
            <FaSlidersH size={11} /> Filters
          </p>
          <FilterPanel
            categories={categories}
            categoryCounts={categoryCounts}
            category={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sizeOptions={sizeOptions}
            priceMax={priceMax}
            onPriceChange={setPriceMax}
            sizes={selectedSizes}
            onSizesChange={setSelectedSizes}
            colors={selectedColors}
            onColorsChange={setSelectedColors}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClear={clearFilters}
            showInlineClear={isFiltersActive}
          />
        </aside>

        {/* ── Main content ── */}
        <main>
          {/* Toolbar */}
          <div className="ap-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Mobile filter trigger */}
              <button className="ap-mobile-filter-btn" onClick={openMobileFilters}>
                <FaFilter size={11} /> Filters
                {activeFilterCount > 0 && (
                  <span className="ap-filter-badge">{activeFilterCount}</span>
                )}
              </button>

              <p className="ap-count">
                Showing <strong>{filteredProducts.length}</strong> of{" "}
                {products.length} products
              </p>
            </div>

            {/* Sort */}
            <div className="ap-sort-wrap" ref={sortRef}>
              <button
                className="ap-sort-btn"
                onClick={() => setShowSortMenu((s) => !s)}
              >
                Sort: {SORT_LABELS[sortBy]}
                <FaChevronDown
                  className={`ap-sort-chevron${showSortMenu ? " open" : ""}`}
                />
              </button>
              {showSortMenu && (
                <div className="ap-sort-menu">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      className={`ap-sort-option${sortBy === key ? " selected" : ""}`}
                      onClick={() => {
                        setSortBy(key);
                        setShowSortMenu(false);
                      }}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div className="ap-skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="ap-skeleton-card">
                  <div
                    className="ap-skeleton-img"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                  <div
                    className="ap-skeleton-line"
                    style={{ animationDelay: `${i * 0.08 + 0.1}s` }}
                  />
                  <div
                    className="ap-skeleton-line short"
                    style={{ animationDelay: `${i * 0.08 + 0.15}s` }}
                  />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">🕊️</div>
              <h3>Nothing found</h3>
              <p>
                Try adjusting your search terms or clearing the active filters.
              </p>
              <button className="ap-empty-btn" onClick={clearFilters}>
                Clear Filters <FaArrowRight size={10} />
              </button>
            </div>
          ) : (
            <div className="ap-grid">
              {filteredProducts.map((product, idx) => {
                const discount = getDiscount(product);
                const outOfStock = product.stock_quantity === 0;

                return (
                  <div
                    key={product.id}
                    className="ap-card"
                    onMouseEnter={() => setHoveredId(product.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    {/* Image area */}
                    <div className="ap-card-img">
                      {/* Badges */}
                      <div className="ap-badge-wrap">
                        {outOfStock && (
                          <span className="ap-badge ap-badge-sold">
                            Sold Out
                          </span>
                        )}
                        {discount && !outOfStock && (
                          <span className="ap-badge ap-badge-sale">
                            −{discount}%
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        style={{ display: "contents" }}
                      >
                        <img
                          src={getPrimaryImage(product)}
                          alt={product.name}
                        />
                      </Link>

                      {/* Hover CTA */}
                      <div className="ap-card-overlay">
                        <button
                          className="ap-overlay-btn"
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock}
                        >
                          {outOfStock ? (
                            "Out of Stock"
                          ) : (
                            <>
                              Add to Cart <FaArrowRight size={9} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="ap-card-body">
                      <p className="ap-card-cat">{product.category_name}</p>
                      <Link
                        href={`/products/${product.id}`}
                        className="ap-card-name"
                      >
                        {product.name}
                      </Link>
                      <div className="ap-card-price-row">
                        <span className="ap-card-price">${formatPrice(product.price)}</span>
                        {product.compare_price && (
                          <span className="ap-card-compare">
                            ${formatPrice(product.compare_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile filter drawer ── */}
      {showMobileFilters && (
        <>
          <div
            className="ap-mobile-overlay"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="ap-mobile-drawer">
            <div className="ap-drawer-head">
              <span className="ap-drawer-head-title">Filters</span>
              <button
                className="ap-drawer-close"
                onClick={() => setShowMobileFilters(false)}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="ap-drawer-body">
              <FilterPanel
                categories={categories}
                categoryCounts={categoryCounts}
                category={draftCategory}
                onCategoryChange={setDraftCategoryChecked}
                sizeOptions={draftSizeOptions}
                priceMax={draftPriceMax}
                onPriceChange={setDraftPriceMax}
                sizes={draftSizes}
                onSizesChange={setDraftSizes}
                colors={draftColors}
                onColorsChange={setDraftColors}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onClear={clearDraftFilters}
                showInlineClear={false}
              />
            </div>

            <div className="ap-drawer-footer">
              <button className="ap-clear-btn" onClick={clearDraftFilters}>
                Clear All
              </button>
              <button className="ap-apply-btn" onClick={applyMobileFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* useSearchParams requires a Suspense boundary at build time in the
   Next.js app router — wrapping here keeps that self-contained so this
   file can be dropped in as a page without editing its parent. */
export default function AllProductsPage() {
  return (
    <Suspense fallback={null}>
      <AllProductsPageInner />
    </Suspense>
  );
}
