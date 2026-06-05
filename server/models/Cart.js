const pool = require('../config/db');

const getOrCreateCart = async (userId) => {
  let result = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId]);
  }
  return result.rows[0];
};

const getCartWithItems = async (userId) => {
  const cart = await getOrCreateCart(userId);
  const itemsResult = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.price, ci.size, ci.color,
            p.name, p.slug, p.stock_quantity,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1`,
    [cart.id]
  );
  cart.items = itemsResult.rows;
  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return cart;
};

const addItemToCart = async (userId, productId, quantity, price, size = null, color = null) => {
  const cart = await getOrCreateCart(userId);
  const existing = await pool.query(
    `SELECT * FROM cart_items 
     WHERE cart_id = $1 AND product_id = $2 
       AND (size IS NOT DISTINCT FROM $3) 
       AND (color IS NOT DISTINCT FROM $4)`,
    [cart.id, productId, size, color]
  );
  if (existing.rows.length > 0) {
    const newQuantity = existing.rows[0].quantity + quantity;
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [newQuantity, existing.rows[0].id]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price, size, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cart.id, productId, quantity, price, size, color]
    );
    return result.rows[0];
  }
};

const removeItemFromCart = async (userId, cartItemId) => {
  const cart = await getOrCreateCart(userId);
  await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cart.id]);
};

const updateCartItemQuantity = async (userId, cartItemId, quantity) => {
  const cart = await getOrCreateCart(userId);
  const result = await pool.query(
    `UPDATE cart_items SET quantity = $1, updated_at = NOW()
     WHERE id = $2 AND cart_id = $3
     RETURNING *`,
    [quantity, cartItemId, cart.id]
  );
  return result.rows[0];
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
};

module.exports = {
  getOrCreateCart,
  getCartWithItems,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  clearCart,
};