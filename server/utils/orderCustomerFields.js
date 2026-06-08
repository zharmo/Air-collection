let orderCustomerColumnsReady = null;

const cleanText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeCheckoutCustomer = (customer = {}) => ({
  customerName: cleanText(customer.name || customer.fullName),
  customerEmail: cleanText(customer.email),
  customerPhone: cleanText(customer.phone),
});

const ensureOrderCustomerColumns = (pool) => {
  if (!orderCustomerColumnsReady) {
    orderCustomerColumnsReady = pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
    `);
  }

  return orderCustomerColumnsReady;
};

module.exports = {
  ensureOrderCustomerColumns,
  normalizeCheckoutCustomer,
};
