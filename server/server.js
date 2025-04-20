const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
require("dotenv").config()

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_Q5j0pLnhOild@ep-super-resonance-a4a3zauu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: "development" === "production" ? { rejectUnauthorized: false } : false,
})

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack)
  }
  console.log("Connected to PostgreSQL database")
  release()
})

// API Routes

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY name ASC")
    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching products:", err)
    res.status(500).json({ error: "Failed to fetch products" })
  }
})

// Get a specific product
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error("Error fetching product:", err)
    res.status(500).json({ error: "Failed to fetch product" })
  }
})

// Create a new product
app.post("/api/products", async (req, res) => {
  const { name, price, description, stock, image_url } = req.body

  if (!name || !price || stock === undefined) {
    return res.status(400).json({ error: "Name, price, and stock are required" })
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, description, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, price, description || null, stock, image_url || null],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error("Error creating product:", err)
    res.status(500).json({ error: "Failed to create product" })
  }
})

// Update a product
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params
  const { name, price, description, stock, image_url } = req.body

  if (!name || !price || stock === undefined) {
    return res.status(400).json({ error: "Name, price, and stock are required" })
  }

  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, price = $2, description = $3, stock = $4, image_url = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
      [name, price, description || null, stock, image_url || null, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error updating product:", err)
    res.status(500).json({ error: "Failed to update product" })
  }
})

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json({ message: "Product deleted successfully" })
  } catch (err) {
    console.error("Error deleting product:", err)
    res.status(500).json({ error: "Failed to delete product" })
  }
})

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC")

    const orders = result.rows.map((order) => ({
      ...order,
      items: typeof order.items === "string"
        ? JSON.parse(order.items)
        : order.items,
    }));
    

    res.json(orders)
  } catch (err) {
    console.error("Error fetching orders:", err)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
})

// Get a specific order
app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    const order = {
      ...result.rows[0],
      items: typeof result.rows[0].items === "string"
        ? JSON.parse(result.rows[0].items)
        : result.rows[0].items,
    };
    

    res.json(order)
  } catch (err) {
    console.error("Error fetching order:", err)
    res.status(500).json({ error: "Failed to fetch order" })
  }
})

// Create a new order
app.post("/api/orders", async (req, res) => {
  const { buyer_name, buyer_contact, delivery_address, delivery_date, notes, items } = req.body

  if (!buyer_name || !buyer_contact || !delivery_address || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const itemsJson = JSON.stringify(items)

    const orderResult = await client.query(
      `INSERT INTO orders (
        buyer_name, 
        buyer_contact, 
        delivery_address, 
        delivery_date,
        notes,
        items,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [buyer_name, buyer_contact, delivery_address, delivery_date || null, notes || null, itemsJson, "Pending"],
    )

    for (const item of items) {
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id])
    }

    await client.query("COMMIT")

    const order = {
      ...orderResult.rows[0],
      items: typeof orderResult.rows[0].items === "string"
        ? JSON.parse(orderResult.rows[0].items)
        : orderResult.rows[0].items,
    };
    
    console.log(order)
    res.status(201).json(order)
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error creating order:", err)
    res.status(500).json({ error: "Failed to create order" })
  } finally {
    client.release()
  }
})

// Update order status
app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" })
  }

  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    const order = {
      ...result.rows[0],
      items: typeof result.rows[0].items === "string"
        ? JSON.parse(result.rows[0].items)
        : result.rows[0].items,
    };
    

    res.json(order)
  } catch (err) {
    console.error("Error updating order:", err)
    res.status(500).json({ error: "Failed to update order" })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
