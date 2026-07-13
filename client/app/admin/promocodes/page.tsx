"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCopy,
  FaCheck,
  FaTimes,
  FaTags,
  FaTicketAlt,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";

// ---------- Types ----------
interface PromoCode {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  min_order_amount: number | string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number | string;
  is_active: boolean;
  featured: boolean;
  allowed_categories: number[];
  excluded_categories: number[];
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FormState {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_order_amount: string;
  expires_at: string;
  max_uses: string;
  featured: boolean;
  category_mode: "all" | "include" | "exclude";
  selected_categories: number[];
}

const EMPTY_FORM: FormState = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  expires_at: "",
  max_uses: "",
  featured: false,
  category_mode: "all",
  selected_categories: [],
};

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
};

const money = (value: unknown): string => `$${toNumber(value).toFixed(2)}`;

const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copiedCode, setCopiedCode] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(t);
  }, [message]);

  // ── Fetch both promocodes and categories ──
  const fetchData = async () => {
    try {
      const [promosRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/promocodes`),
        axiosInstance.get('/categories'),
      ]);

      const promosData = await promosRes.json();
      if (promosData.success && Array.isArray(promosData.data)) {
        setPromoCodes(promosData.data);
      } else {
        setPromoCodes([]);
      }

      if (catsRes.data?.data) {
        setCategories(catsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Couldn't load data. Check your connection." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelection = (categoryId: number) => {
    setFormData((prev) => {
      const selected = prev.selected_categories;
      if (selected.includes(categoryId)) {
        return { ...prev, selected_categories: selected.filter(id => id !== categoryId) };
      } else {
        return { ...prev, selected_categories: [...selected, categoryId] };
      }
    });
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingCode(null);
    setShowCreateForm(false);
  };

  const openCreateForm = () => {
    setEditingCode(null);
    setFormData(EMPTY_FORM);
    setShowCreateForm(true);
  };

  const openEditForm = (promo: PromoCode) => {
    setEditingCode(promo);
    const allowedCats = promo.allowed_categories || [];
    const excludedCats = promo.excluded_categories || [];
    let category_mode: "all" | "include" | "exclude" = "all";
    let selected_categories: number[] = [];

    if (allowedCats.length > 0) {
      category_mode = "include";
      selected_categories = allowedCats;
    } else if (excludedCats.length > 0) {
      category_mode = "exclude";
      selected_categories = excludedCats;
    }

    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: String(toNumber(promo.discount_value)),
      min_order_amount: String(toNumber(promo.min_order_amount)),
      expires_at: toDatetimeLocal(promo.expires_at),
      max_uses: promo.max_uses !== null ? String(promo.max_uses) : "",
      featured: promo.featured,
      category_mode,
      selected_categories,
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const discountValue = parseFloat(formData.discount_value);
    if (!formData.code.trim()) {
      setMessage({ type: "error", text: "Enter a code before saving." });
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setMessage({ type: "error", text: "Enter a discount value greater than 0." });
      return;
    }
    if (formData.discount_type === "percentage" && discountValue > 100) {
      setMessage({ type: "error", text: "A percentage discount can't exceed 100." });
      return;
    }

    const payload: any = {
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: discountValue,
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      expires_at: formData.expires_at || null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
      featured: formData.featured,
      allowed_categories: [],
      excluded_categories: [],
    };

    if (formData.category_mode === "include") {
      payload.allowed_categories = formData.selected_categories;
    } else if (formData.category_mode === "exclude") {
      payload.excluded_categories = formData.selected_categories;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(editingCode);
      const url = isEditing
        ? `${API_URL}/promocodes/${editingCode!.id}`
        : `${API_URL}/promocodes`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: isEditing ? "Promo code updated." : "Promo code created.",
        });
        resetForm();
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Couldn't save this code." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/promocodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Code ${!currentStatus ? "activated" : "deactivated"}.` });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Couldn't update this code." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (id: number, currentFeatured: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/promocodes/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentFeatured }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: !currentFeatured ? "Code featured on homepage!" : "Code removed from homepage.",
        });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Couldn't update featured status." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const deletePromoCode = async (id: number) => {
    if (!confirm("Delete this promo code? This can't be undone.")) return;

    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/promocodes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Promo code deleted." });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Couldn't delete this code." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never expires";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Never expires";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilExpiry = (dateString: string | null) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    if (Number.isNaN(expiry.getTime())) return null;
    const diffTime = expiry.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const stats = useMemo(() => {
    const total = promoCodes.length;
    const active = promoCodes.filter((p) => p.is_active).length;
    const expired = promoCodes.filter((p) => {
      const days = getDaysUntilExpiry(p.expires_at);
      return days !== null && days < 0;
    }).length;
    const totalRedemptions = promoCodes.reduce((sum, p) => sum + toNumber(p.used_count), 0);
    return { total, active, expired, totalRedemptions };
  }, [promoCodes]);

  // ── Helper to get category names from IDs ──
  const getCategoryNames = (ids: number[]) => {
    if (!ids || ids.length === 0) return "All Categories";
    const names = ids.map(id => {
      const cat = categories.find(c => c.id === id);
      return cat ? cat.name : `#${id}`;
    });
    return names.join(', ');
  };

  if (loading) {
    return (
      <div className="promo-codes-page">
        <style>{pageStyles}</style>
        <div className="promo-loading">
          <div className="promo-spinner" />
          <p>Loading promo codes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-codes-page">
      <style>{pageStyles}</style>

      <div className="promo-header">
        <div>
          <h1>Promo Codes</h1>
          <p className="promo-subtitle">Create and manage discount codes for your customers.</p>
        </div>
        <button className="btn-primary-custom" onClick={showCreateForm ? resetForm : openCreateForm}>
          {showCreateForm ? <FaTimes size={13} /> : <FaPlus size={13} />}
          {showCreateForm ? "Cancel" : "New Promo Code"}
        </button>
      </div>

      <div className="promo-stats">
        {[
          { label: 'Total codes', value: stats.total },
          { label: 'Active', value: stats.active, active: true },
          { label: 'Expired', value: stats.expired, expired: true },
          { label: 'Total redemptions', value: stats.totalRedemptions },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <span className={`stat-value ${stat.active ? 'stat-active' : ''} ${stat.expired ? 'stat-expired' : ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {message.text && (
        <div className={message.type === "success" ? "message-success" : "message-error"}>
          <span>{message.text}</span>
          <button className="toast-close" onClick={() => setMessage({ type: "", text: "" })}>
            <FaTimes />
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="promo-create-form">
          <h5>{editingCode ? "Edit Promo Code" : "Create New Promo Code"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="promo-form-grid">
              <div className="promo-form-group">
                <label htmlFor="code">Code *</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. ELEVEN20"
                  required
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="promo-form-group">
                <label htmlFor="discount_type">Discount Type *</label>
                <select
                  id="discount_type"
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div className="promo-form-group">
                <label htmlFor="discount_value">Discount Value *</label>
                <input
                  id="discount_value"
                  name="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discount_type === "percentage" ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  placeholder={formData.discount_type === "percentage" ? "e.g. 20" : "e.g. 10.00"}
                  required
                />
              </div>

              <div className="promo-form-group">
                <label htmlFor="min_order_amount">Minimum Order Amount</label>
                <input
                  id="min_order_amount"
                  name="min_order_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={handleInputChange}
                  placeholder="0.00 for no minimum"
                />
              </div>

              <div className="promo-form-group">
                <label htmlFor="expires_at">Expiry Date</label>
                <input
                  id="expires_at"
                  name="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                />
              </div>

              <div className="promo-form-group">
                <label htmlFor="max_uses">Maximum Uses</label>
                <input
                  id="max_uses"
                  name="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* ── CATEGORY RESTRICTION ── */}
              <div className="promo-form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Category Restriction</label>
                <select
                  name="category_mode"
                  value={formData.category_mode}
                  onChange={handleInputChange}
                  className="promo-select"
                >
                  <option value="all">All Categories (no restriction)</option>
                  <option value="include">✓ Include only specific categories</option>
                  <option value="exclude">✗ Exclude specific categories</option>
                </select>
              </div>

              {formData.category_mode !== "all" && (
                <div className="promo-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>
                    {formData.category_mode === "include"
                      ? "Select categories to ALLOW"
                      : "Select categories to EXCLUDE"}
                  </label>
                  <div className="category-select-grid">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-select-btn ${
                          formData.selected_categories.includes(cat.id) ? "selected" : ""
                        }`}
                        onClick={() => handleCategorySelection(cat.id)}
                      >
                        {formData.selected_categories.includes(cat.id) ? <FaCheck size={12} /> : "○"}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <small className="text-muted">
                    {formData.selected_categories.length === 0
                      ? "No categories selected. Click to select."
                      : `${formData.selected_categories.length} category(ies) selected.`}
                  </small>
                </div>
              )}

              {/* ── Featured checkbox ── */}
              <div className="promo-form-group" style={{ gridColumn: "1 / -1" }}>
                <div className="promo-checkbox-group">
                  <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="featured">
                    ⭐ Feature on Homepage – Show this promo code in the homepage banner
                  </label>
                </div>
              </div>

              <div className="promo-form-actions">
                <button type="submit" className="btn-primary-custom" disabled={submitting}>
                  {submitting ? "Saving…" : editingCode ? "Update Code" : "Create Code"}
                </button>
                <button type="button" className="btn-secondary-custom" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="promo-card">
        {promoCodes.length === 0 ? (
          <div className="empty-state">
            <FaTicketAlt />
            <h5>No promo codes yet</h5>
            <p>Create your first promo code to start offering discounts.</p>
            <button className="btn-primary-custom" onClick={openCreateForm}>
              <FaPlus size={13} />
              Create First Code
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="promo-table">
              <thead>
                <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Categories</th><th>Status</th><th>Featured</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {promoCodes.map((promo) => {
                  const daysUntilExpiry = getDaysUntilExpiry(promo.expires_at);
                  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
                  const isExpiringSoon =
                    daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

                  let statusBadge = "promo-status-active";
                  let statusText = "Active";
                  if (!promo.is_active) {
                    statusBadge = "promo-status-inactive";
                    statusText = "Inactive";
                  } else if (isExpired) {
                    statusBadge = "promo-status-expired";
                    statusText = "Expired";
                  } else if (isExpiringSoon) {
                    statusBadge = "promo-status-soon";
                    statusText = `${daysUntilExpiry}d left`;
                  }

                  const isRowBusy = busyId === promo.id;

                  // Category restriction display
                  let categoryDisplay = "All Categories";
                  if (promo.allowed_categories && promo.allowed_categories.length > 0) {
                    categoryDisplay = `✓ ${getCategoryNames(promo.allowed_categories)}`;
                  } else if (promo.excluded_categories && promo.excluded_categories.length > 0) {
                    categoryDisplay = `✗ Excludes: ${getCategoryNames(promo.excluded_categories)}`;
                  }

                  return (
                    <tr key={promo.id}>
                      <td>
                        <div className="code-cell">
                          <span className="promo-code-display">{promo.code}</span>
                          <button
                            className={`copy-btn ${copiedCode === promo.code ? "copied" : ""}`}
                            onClick={() => copyToClipboard(promo.code)}
                            title="Copy code"
                          >
                            {copiedCode === promo.code ? <FaCheck size={13} /> : <FaCopy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        {promo.discount_type === "percentage"
                          ? `${toNumber(promo.discount_value)}%`
                          : money(promo.discount_value)}
                      </td>
                      <td>
                        {toNumber(promo.min_order_amount) > 0
                          ? money(promo.min_order_amount)
                          : "None"}
                      </td>
                      <td>
                        {promo.max_uses !== null
                          ? `${toNumber(promo.used_count)} / ${promo.max_uses}`
                          : `${toNumber(promo.used_count)} (Unlimited)`}
                      </td>
                      <td>
                        <span>{formatDate(promo.expires_at)}</span>
                        {isExpiringSoon && !isExpired && promo.is_active && (
                          <span className="expiry-hint expiry-warning">Expiring soon</span>
                        )}
                        {isExpired && <span className="expiry-hint expiry-expired">Expired</span>}
                      </td>
                      <td>
                        <span className="category-badge" title={categoryDisplay}>
                          {categoryDisplay.length > 25
                            ? categoryDisplay.substring(0, 25) + '…'
                            : categoryDisplay}
                        </span>
                      </td>
                      <td>
                        <span className={`promo-status-badge ${statusBadge}`}>{statusText}</span>
                      </td>
                      <td>
                        {promo.is_active ? (
                          promo.featured ? (
                            <button
                              className="btn-featured-active"
                              onClick={() => toggleFeatured(promo.id, promo.featured)}
                              title="Remove from homepage"
                              disabled={isRowBusy}
                            >
                              <FaStar size={13} /> Featured
                            </button>
                          ) : (
                            <button
                              className="btn-featured-inactive"
                              onClick={() => toggleFeatured(promo.id, promo.featured)}
                              title="Feature on homepage"
                              disabled={isRowBusy}
                            >
                              <FaRegStar size={13} /> Feature
                            </button>
                          )
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-outline-custom"
                            onClick={() => openEditForm(promo)}
                            title="Edit"
                            disabled={isRowBusy}
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            className={promo.is_active ? "btn-danger-custom" : "btn-success-custom"}
                            onClick={() => toggleActiveStatus(promo.id, promo.is_active)}
                            title={promo.is_active ? "Deactivate" : "Activate"}
                            disabled={isRowBusy}
                          >
                            {isRowBusy ? "…" : promo.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn-outline-custom btn-outline-danger"
                            onClick={() => deletePromoCode(promo.id)}
                            title="Delete"
                            disabled={isRowBusy}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyles = `
  .promo-codes-page {
    font-family: 'Inter', system-ui, sans-serif;
    color: #0f172a;
  }

  .promo-codes-page h1 {
    font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: #0f172a;
    margin: 0 0 6px 0;
  }

  .promo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
  }

  .promo-subtitle {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0;
  }

  .promo-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    height: 320px;
    color: #64748b;
  }

  .promo-spinner {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid #e2e8f0;
    border-top-color: #0f172a;
    animation: promo-spin 0.7s linear infinite;
  }

  @keyframes promo-spin {
    to { transform: rotate(360deg); }
  }

  .promo-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-label {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-value {
    font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: #0f172a;
  }

  .stat-active { color: #16a34a; }
  .stat-expired { color: #dc2626; }

  .promo-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
    padding: 24px;
  }

  .promo-create-form {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .promo-create-form h5 {
    margin: 0 0 18px 0;
    font-weight: 700;
    font-size: 1.05rem;
    color: #0f172a;
  }

  .promo-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .promo-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .promo-form-group label {
    font-size: 0.83rem;
    font-weight: 600;
    color: #1e293b;
  }

  .promo-form-group input,
  .promo-form-group select {
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }

  .promo-form-group input:focus,
  .promo-form-group select:focus {
    outline: none;
    border-color: #0f172a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
  }

  .promo-select {
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    font-family: inherit;
  }

  .category-select-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0;
  }

  .category-select-btn {
    padding: 6px 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 500;
    color: #1e293b;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .category-select-btn:hover {
    background: #f1f5f9;
  }

  .category-select-btn.selected {
    background: #0f172a;
    color: white;
    border-color: #0f172a;
  }

  .promo-checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 4px;
  }

  .promo-checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .promo-checkbox-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
  }

  .promo-form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 12px;
    margin-top: 4px;
  }

  button {
    font-family: inherit;
  }

  .btn-primary-custom {
    background: #0f172a;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .btn-primary-custom:hover:not(:disabled) { background: #1e293b; }
  .btn-primary-custom:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-secondary-custom {
    background: #e2e8f0;
    color: #1e293b;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    font-size: 0.9rem;
  }

  .btn-secondary-custom:hover { background: #cbd5e1; }

  .btn-danger-custom {
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: background 0.15s;
  }

  .btn-danger-custom:hover:not(:disabled) { background: #fecaca; }

  .btn-success-custom {
    background: #dcfce7;
    color: #15803d;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: background 0.15s;
  }

  .btn-success-custom:hover:not(:disabled) { background: #bbf7d0; }

  .btn-featured-active {
    background: #fef3c7;
    color: #92400e;
    border: none;
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: background 0.15s;
  }

  .btn-featured-active:hover:not(:disabled) { background: #fde68a; }

  .btn-featured-inactive {
    background: #f1f5f9;
    color: #64748b;
    border: 1px dashed #cbd5e1;
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s;
  }

  .btn-featured-inactive:hover:not(:disabled) {
    background: #e2e8f0;
    border-color: #94a3b8;
    color: #1e293b;
  }

  .btn-outline-custom {
    background: transparent;
    color: #334155;
    border: 1px solid #d1d5db;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
  }

  .btn-outline-custom:hover:not(:disabled) { background: #f1f5f9; }

  .btn-outline-danger { color: #dc2626; border-color: #fca5a5; }
  .btn-outline-danger:hover:not(:disabled) { background: #fef2f2; }

  button:disabled { opacity: 0.55; cursor: not-allowed; }

  .promo-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .promo-table th {
    text-align: left;
    padding: 12px 16px;
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 2px solid #e2e8f0;
  }

  .promo-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .promo-table tr:last-child td { border-bottom: none; }
  .promo-table tr:hover td { background: #fafbfc; }

  .code-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .promo-status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .promo-status-active { background: #dcfce7; color: #166534; }
  .promo-status-inactive { background: #f1f5f9; color: #475569; }
  .promo-status-expired { background: #fee2e2; color: #991b1b; }
  .promo-status-soon { background: #fef3c7; color: #92400e; }

  .category-badge {
    display: inline-block;
    font-size: 0.75rem;
    color: #1e293b;
    background: #f1f5f9;
    padding: 3px 10px;
    border-radius: 4px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .promo-code-display {
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 0.95rem;
    color: #0f172a;
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 6px;
    display: inline-block;
    letter-spacing: 0.02em;
  }

  .message-success,
  .message-error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }

  .message-success { background: #dcfce7; color: #166534; }
  .message-error { background: #fee2e2; color: #991b1b; }

  .toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    padding: 2px 6px;
  }

  .toast-close:hover { opacity: 1; }

  .copy-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s;
    display: inline-flex;
  }

  .copy-btn:hover { background: #e2e8f0; color: #0f172a; }
  .copy-btn.copied { color: #16a34a; }

  .expiry-hint {
    display: block;
    font-size: 0.75rem;
    margin-top: 2px;
    font-weight: 600;
  }

  .expiry-warning { color: #d97706; }
  .expiry-expired { color: #dc2626; }

  .text-muted { color: #94a3b8; }

  .table-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .empty-state {
    text-align: center;
    padding: 64px 20px;
    color: #64748b;
  }

  .empty-state svg {
    font-size: 42px;
    color: #cbd5e1;
    margin-bottom: 16px;
  }

  .empty-state h5 {
    color: #1e293b;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .empty-state p {
    margin-bottom: 20px;
  }

  .empty-state .btn-primary-custom {
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .promo-stats { grid-template-columns: repeat(2, 1fr); }
    .promo-form-grid { grid-template-columns: 1fr; }
    .promo-table { font-size: 0.8rem; }
    .promo-table th, .promo-table td { padding: 10px 10px; }
    .category-select-grid { gap: 6px; }
    .category-select-btn { font-size: 0.75rem; padding: 4px 10px; }
  }
`;