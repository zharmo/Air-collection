const pool = require('../config/db');

const getOrCreateWishlist = async (userId) => {
  let result = await pool.query('SELECT * FROM wishlists WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await pool.query('INSERT INTO wishlists (user_id) VALUES ($1) RETURNING *', [userId]);
  }
  return result.rows[0];
};

const getWishlistWithProducts = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  const itemsResult = await pool.query(
    `SELECT wi.product_id, p.name, p.slug, p.price, p.compare_price,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
     FROM wishlist_items wi
     JOIN products p ON wi.product_id = p.id
     WHERE wi.wishlist_id = $1`,
    [wishlist.id]
  );
  wishlist.items = itemsResult.rows;
  return wishlist;
};

const addToWishlist = async (userId, productId) => {
  const wishlist = await getOrCreateWishlist(userId);
  const result = await pool.query(
    `INSERT INTO wishlist_items (wishlist_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (wishlist_id, product_id) DO NOTHING
     RETURNING *`,
    [wishlist.id, productId]
  );
  return result.rows[0];
};

const removeFromWishlist = async (userId, productId) => {
  const wishlist = await getOrCreateWishlist(userId);
  await pool.query('DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2', [wishlist.id, productId]);
};

module.exports = {
  getWishlistWithProducts,
  addToWishlist,
  removeFromWishlist,
};