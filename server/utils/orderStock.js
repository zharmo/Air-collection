class StockError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'StockError';
        this.statusCode = statusCode;
    }
}

const getItemProductId = (item) => Number(item.productId || item.product_id);

const getItemQuantity = (item) => Number(item.quantity);

const lockMatchingSize = async (client, productId, sizeName, colorName) => {
    if (colorName) {
        const exactSize = await client.query(
            `SELECT ps.*
             FROM product_sizes ps
             JOIN product_colors pc ON pc.id = ps.color_id
             WHERE ps.product_id = $1
               AND LOWER(ps.size_name) = LOWER($2)
               AND LOWER(pc.color_name) = LOWER($3)
             ORDER BY ps.position ASC, ps.id ASC
             LIMIT 1
             FOR UPDATE OF ps`,
            [productId, sizeName, colorName]
        );

        if (exactSize.rows.length > 0) return exactSize.rows[0];
    }

    const generalSize = await client.query(
        `SELECT *
         FROM product_sizes
         WHERE product_id = $1
           AND LOWER(size_name) = LOWER($2)
           AND color_id IS NULL
         ORDER BY position ASC, id ASC
         LIMIT 1
         FOR UPDATE`,
        [productId, sizeName]
    );

    return generalSize.rows[0] || null;
};

const validateAndReserveOrderStock = async (client, items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new StockError('Order items are required');
    }

    for (const item of items) {
        const productId = getItemProductId(item);
        const quantity = getItemQuantity(item);

        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            throw new StockError('Invalid order item quantity');
        }

        const productResult = await client.query(
            `SELECT id, name, stock_quantity, is_active
             FROM products
             WHERE id = $1
             FOR UPDATE`,
            [productId]
        );

        const product = productResult.rows[0];
        if (!product || product.is_active === false) {
            throw new StockError(`${item.name || 'This product'} is no longer available`);
        }

        const productStock = Number(product.stock_quantity) || 0;
        if (productStock <= 0) {
            throw new StockError(`${product.name} is stock out`);
        }

        if (quantity > productStock) {
            throw new StockError(`Only ${productStock} ${product.name} left in stock`);
        }

        const sizeCount = await client.query(
            'SELECT COUNT(*)::int AS count FROM product_sizes WHERE product_id = $1',
            [productId]
        );
        const hasSizes = Number(sizeCount.rows[0]?.count || 0) > 0;

        if (hasSizes) {
            if (!item.size) {
                throw new StockError(`Please select a size for ${product.name}`);
            }

            const size = await lockMatchingSize(client, productId, item.size, item.color);

            if (!size || size.is_available === false || Number(size.stock) <= 0) {
                throw new StockError(`${product.name} size ${item.size} is stock out`);
            }

            const sizeStock = Number(size.stock) || 0;
            if (quantity > sizeStock) {
                throw new StockError(`Only ${sizeStock} ${product.name} size ${item.size} left in stock`);
            }

            await client.query(
                `UPDATE product_sizes
                 SET stock = stock - $1,
                     is_available = CASE WHEN stock - $1 <= 0 THEN false ELSE is_available END,
                     updated_at = NOW()
                 WHERE id = $2`,
                [quantity, size.id]
            );
        }

        await client.query(
            `UPDATE products
             SET stock_quantity = stock_quantity - $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [quantity, productId]
        );
    }
};

module.exports = {
    StockError,
    validateAndReserveOrderStock,
};
