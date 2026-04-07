import * as SQLite from "expo-sqlite";

const database = SQLite.openDatabaseSync("ruchi-bill-book.db");

export const initDatabase = async () => {
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stockQty INTEGER NOT NULL DEFAULT 0,
      imageUri TEXT,
      barcode TEXT UNIQUE,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paymentType TEXT NOT NULL,
      customerId INTEGER,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      costPrice REAL NOT NULL,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(createdAt);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(createdAt);
  `);
};

const now = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getAll = (sql, params = []) => database.getAllSync(sql, params);
const getOne = (sql, params = []) => database.getFirstSync(sql, params);
const run = (sql, params = []) => database.runSync(sql, params);

export const getProducts = async (search = "") => {
  const query = `%${search.trim()}%`;

  return getAll(
    `
      SELECT *
      FROM products
      WHERE name LIKE ? OR IFNULL(barcode, '') LIKE ?
      ORDER BY name COLLATE NOCASE ASC
    `,
    [query, query]
  );
};

export const getProductByBarcode = async (barcode) =>
  getOne(`SELECT * FROM products WHERE barcode = ?`, [barcode]);

export const addProduct = async ({ name, price, stockQty, imageUri, barcode }) => {
  const result = run(
    `
      INSERT INTO products (name, price, stockQty, imageUri, barcode, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name.trim(), Number(price), Number(stockQty), imageUri || null, barcode || null, now()]
  );

  return result.lastInsertRowId;
};

export const addCustomer = async (name) => {
  const result = run(
    `
      INSERT INTO customers (name, balance, createdAt)
      VALUES (?, 0, ?)
    `,
    [name.trim(), now()]
  );

  return result.lastInsertRowId;
};

export const getCustomers = async (search = "") => {
  const query = `%${search.trim()}%`;

  return getAll(
    `
      SELECT *
      FROM customers
      WHERE name LIKE ?
      ORDER BY name COLLATE NOCASE ASC
    `,
    [query]
  );
};

export const savePurchase = async ({ productId, quantity, costPrice }) => {
  const qty = Number(quantity);
  const cost = Number(costPrice);
  const total = qty * cost;
  const createdAt = now();

  database.withTransactionSync(() => {
    run(
      `
        INSERT INTO purchases (productId, quantity, costPrice, total, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `,
      [productId, qty, cost, total, createdAt]
    );

    run(
      `
        UPDATE products
        SET stockQty = stockQty + ?
        WHERE id = ?
      `,
      [qty, productId]
    );
  });
};

export const saveSale = async ({ items, paymentType, customerId }) => {
  const createdAt = now();
  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.price),
    0
  );

  database.withTransactionSync(() => {
    for (const item of items) {
      const product = getOne(`SELECT * FROM products WHERE id = ?`, [item.id]);

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stockQty < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
    }

    const saleResult = run(
      `
        INSERT INTO sales (paymentType, customerId, total, createdAt)
        VALUES (?, ?, ?, ?)
      `,
      [paymentType, customerId || null, total, createdAt]
    );

    const saleId = saleResult.lastInsertRowId;

    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.price);

      run(
        `
          INSERT INTO sale_items (saleId, productId, quantity, unitPrice, total, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [saleId, item.id, item.quantity, item.price, lineTotal, createdAt]
      );

      run(
        `
          UPDATE products
          SET stockQty = stockQty - ?
          WHERE id = ?
        `,
        [item.quantity, item.id]
      );
    }

    if (paymentType === "udhar" && customerId) {
      run(
        `
          UPDATE customers
          SET balance = balance + ?
          WHERE id = ?
        `,
        [total, customerId]
      );
    }
  });
};

export const addCustomerPayment = async ({ customerId, amount, note }) => {
  const paymentAmount = Number(amount);
  const createdAt = now();

  database.withTransactionSync(() => {
    run(
      `
        INSERT INTO customer_payments (customerId, amount, note, createdAt)
        VALUES (?, ?, ?, ?)
      `,
      [customerId, paymentAmount, note?.trim() || null, createdAt]
    );

    run(
      `
        UPDATE customers
        SET balance = CASE
          WHEN balance - ? < 0 THEN 0
          ELSE balance - ?
        END
        WHERE id = ?
      `,
      [paymentAmount, paymentAmount, customerId]
    );
  });
};

export const getCustomerHistory = async (customerId) =>
  getAll(
    `
      SELECT
        'sale' AS type,
        s.id,
        s.total AS amount,
        s.createdAt,
        s.paymentType,
        '' AS note
      FROM sales s
      WHERE s.customerId = ? AND s.paymentType = 'udhar'

      UNION ALL

      SELECT
        'payment' AS type,
        cp.id,
        cp.amount,
        cp.createdAt,
        'payment' AS paymentType,
        IFNULL(cp.note, '') AS note
      FROM customer_payments cp
      WHERE cp.customerId = ?

      ORDER BY createdAt DESC
    `,
    [customerId, customerId]
  );

export const getDailyTotals = async (datePrefix) => {
  const sales = getOne(
    `
      SELECT IFNULL(SUM(total), 0) AS total
      FROM sales
      WHERE createdAt LIKE ?
    `,
    [`${datePrefix}%`]
  );

  const purchases = getOne(
    `
      SELECT IFNULL(SUM(total), 0) AS total
      FROM purchases
      WHERE createdAt LIKE ?
    `,
    [`${datePrefix}%`]
  );

  return {
    totalSales: Number(sales?.total || 0),
    totalPurchase: Number(purchases?.total || 0),
    profit: Number(sales?.total || 0) - Number(purchases?.total || 0),
  };
};

export const getRecentSales = async (limit = 20) =>
  getAll(
    `
      SELECT
        s.*,
        c.name AS customerName
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customerId
      ORDER BY s.createdAt DESC
      LIMIT ?
    `,
    [limit]
  );

export const getRecentPurchases = async (limit = 20) =>
  getAll(
    `
      SELECT
        p.*,
        pr.name AS productName
      FROM purchases p
      INNER JOIN products pr ON pr.id = p.productId
      ORDER BY p.createdAt DESC
      LIMIT ?
    `,
    [limit]
  );

export const getExportData = async () => ({
  products: getAll(`SELECT * FROM products ORDER BY name COLLATE NOCASE ASC`),
  customers: getAll(`SELECT * FROM customers ORDER BY name COLLATE NOCASE ASC`),
  sales: getAll(`SELECT * FROM sales ORDER BY createdAt DESC`),
  saleItems: getAll(`SELECT * FROM sale_items ORDER BY createdAt DESC`),
  purchases: getAll(`SELECT * FROM purchases ORDER BY createdAt DESC`),
  customerPayments: getAll(`SELECT * FROM customer_payments ORDER BY createdAt DESC`),
});
