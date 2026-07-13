const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const VALID_DISCOUNT_TYPES = ['percentage', 'fixed'];

// ── GET all promo codes ──
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM promocodes ORDER BY created_at DESC`
        );
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Get promocodes error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch promo codes' });
    }
});

// ── GET featured promo code (for homepage) ──
router.get('/featured', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM promocodes 
             WHERE featured = TRUE 
             AND is_active = TRUE 
             AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1`
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ success: true, data: null });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Get featured promocode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch featured promo code' });
    }
});

// ── CREATE a new promo code ──
router.post('/', async (req, res) => {
    const {
        code,
        discount_type,
        discount_value,
        min_order_amount,
        expires_at,
        max_uses,
        featured,
        allowed_categories,
        excluded_categories,
    } = req.body;

    if (!code || !discount_type || discount_value === undefined || discount_value === null) {
        return res.status(400).json({ success: false, message: 'Code, discount type, and value are required' });
    }

    if (!VALID_DISCOUNT_TYPES.includes(discount_type)) {
        return res.status(400).json({ success: false, message: 'Discount type must be "percentage" or "fixed"' });
    }

    const numericDiscountValue = parseFloat(discount_value);
    if (!Number.isFinite(numericDiscountValue) || numericDiscountValue <= 0) {
        return res.status(400).json({ success: false, message: 'Discount value must be a number greater than 0' });
    }

    if (discount_type === 'percentage' && numericDiscountValue > 100) {
        return res.status(400).json({ success: false, message: 'A percentage discount cannot exceed 100' });
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM promocodes WHERE LOWER(code) = LOWER($1)',
            [code]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Promo code already exists' });
        }

        if (featured) {
            await pool.query(`UPDATE promocodes SET featured = FALSE WHERE featured = TRUE`);
        }

        const result = await pool.query(
            `INSERT INTO promocodes 
             (code, discount_type, discount_value, min_order_amount, expires_at, max_uses, featured, allowed_categories, excluded_categories) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
                code.trim().toUpperCase(),
                discount_type,
                numericDiscountValue,
                parseFloat(min_order_amount) || 0,
                expires_at || null,
                max_uses ? parseInt(max_uses, 10) : null,
                featured || false,
                allowed_categories || [],
                excluded_categories || [],
            ]
        );

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Create promocode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create promo code' });
    }
});

// ── VALIDATE promo code with category restrictions ──
router.post('/validate', async (req, res) => {
    const { code, email, subtotal, categoryIds } = req.body;

    if (!code) {
        return res.status(400).json({
            valid: false,
            message: 'Promo code is required'
        });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM promocodes 
             WHERE LOWER(code) = LOWER($1) 
             AND is_active = TRUE`,
            [code.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                valid: false,
                message: 'Invalid promo code'
            });
        }

        const promo = result.rows[0];

        // Check expiry
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            return res.status(400).json({
                valid: false,
                message: 'This code has expired'
            });
        }

        // Check max uses
        if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
            return res.status(400).json({
                valid: false,
                message: 'This code has been fully used'
            });
        }

        // Check minimum order amount
        const minAmount = parseFloat(promo.min_order_amount) || 0;
        const subtotalAmount = parseFloat(subtotal) || 0;

        if (subtotalAmount < minAmount) {
            return res.status(400).json({
                valid: false,
                message: `Minimum order for this code is $${minAmount.toFixed(2)}`
            });
        }

        // ── CATEGORY RESTRICTION CHECK ──
        const allowedCats = promo.allowed_categories || [];
        const excludedCats = promo.excluded_categories || [];
        const userCategoryIds = categoryIds || [];

        // Mode 1: ALLOWED categories – all items must be in allowed list
        if (allowedCats.length > 0) {
            const allowedSet = new Set(allowedCats);
            const allAllowed = userCategoryIds.every(id => allowedSet.has(id));
            if (!allAllowed) {
                // Get category names for better error message
                const categoryNamesResult = await pool.query(
                    `SELECT name FROM categories WHERE id = ANY($1)`,
                    [allowedCats]
                );
                const names = categoryNamesResult.rows.map(row => row.name).join(', ');
                return res.status(400).json({
                    valid: false,
                    message: `This code only works for: ${names}. Please remove other items.`
                });
            }
        }

        // Mode 2: EXCLUDED categories – no item can be in excluded list
        if (excludedCats.length > 0) {
            const excludedSet = new Set(excludedCats);
            const hasExcluded = userCategoryIds.some(id => excludedSet.has(id));
            if (hasExcluded) {
                // Get category names for better error message
                const categoryNamesResult = await pool.query(
                    `SELECT name FROM categories WHERE id = ANY($1)`,
                    [excludedCats]
                );
                const names = categoryNamesResult.rows.map(row => row.name).join(', ');
                return res.status(400).json({
                    valid: false,
                    message: `This code does not work for: ${names}. Please remove these items.`
                });
            }
        }

        // Success - return discount details
        return res.status(200).json({
            valid: true,
            code: promo.code,
            discountType: promo.discount_type,
            discountValue: parseFloat(promo.discount_value),
            message: 'Promo code applied successfully!'
        });

    } catch (err) {
        console.error('Validate promo error:', err);
        return res.status(500).json({
            valid: false,
            message: 'Server error, please try again'
        });
    }
});

// ── REDEEM promo code ──
router.post('/redeem', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Promo code is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE promocodes
             SET used_count = used_count + 1
             WHERE LOWER(code) = LOWER($1)
               AND is_active = TRUE
               AND (max_uses IS NULL OR used_count < max_uses)
             RETURNING *`,
            [code.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ success: false, message: 'Promo code could not be redeemed (inactive, missing, or fully used)' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Redeem promocode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to redeem promo code' });
    }
});

// ── UPDATE promo code ──
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        code,
        discount_type,
        discount_value,
        min_order_amount,
        expires_at,
        max_uses,
        is_active,
        featured,
        allowed_categories,
        excluded_categories,
    } = req.body;

    if (discount_type !== undefined && !VALID_DISCOUNT_TYPES.includes(discount_type)) {
        return res.status(400).json({ success: false, message: 'Discount type must be "percentage" or "fixed"' });
    }

    if (discount_value !== undefined) {
        const numericDiscountValue = parseFloat(discount_value);
        if (!Number.isFinite(numericDiscountValue) || numericDiscountValue <= 0) {
            return res.status(400).json({ success: false, message: 'Discount value must be a number greater than 0' });
        }
    }

    try {
        if (code) {
            const existing = await pool.query(
                'SELECT id FROM promocodes WHERE LOWER(code) = LOWER($1) AND id != $2',
                [code, id]
            );
            if (existing.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Another promo code already uses that code' });
            }
        }

        if (featured === true) {
            await pool.query(`UPDATE promocodes SET featured = FALSE WHERE featured = TRUE`);
        }

        const fields = [];
        const values = [];
        let i = 1;

        const set = (column, value) => {
            fields.push(`${column} = $${i}`);
            values.push(value);
            i += 1;
        };

        if (code !== undefined) set('code', code.trim().toUpperCase());
        if (discount_type !== undefined) set('discount_type', discount_type);
        if (discount_value !== undefined) set('discount_value', parseFloat(discount_value));
        if (min_order_amount !== undefined) set('min_order_amount', parseFloat(min_order_amount) || 0);
        if (expires_at !== undefined) set('expires_at', expires_at || null);
        if (max_uses !== undefined) set('max_uses', max_uses ? parseInt(max_uses, 10) : null);
        if (is_active !== undefined) set('is_active', is_active);
        if (featured !== undefined) set('featured', featured);
        if (allowed_categories !== undefined) set('allowed_categories', allowed_categories);
        if (excluded_categories !== undefined) set('excluded_categories', excluded_categories);

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE promocodes SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Update promocode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update promo code' });
    }
});

// ── DELETE promo code ──
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM promocodes WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        return res.status(200).json({ success: true, message: 'Promo code deleted' });
    } catch (err) {
        console.error('Delete promocode error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete promo code' });
    }
});

// ── Toggle featured status ──
router.patch('/:id/featured', async (req, res) => {
    const { id } = req.params;
    const { featured } = req.body;

    if (featured === undefined) {
        return res.status(400).json({ success: false, message: 'Featured status is required' });
    }

    try {
        if (featured) {
            await pool.query(`UPDATE promocodes SET featured = FALSE WHERE featured = TRUE`);
        }

        const result = await pool.query(
            `UPDATE promocodes SET featured = $1 WHERE id = $2 RETURNING *`,
            [featured, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Toggle featured error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update featured status' });
    }
});

module.exports = router;