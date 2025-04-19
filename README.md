🥦 Bulk Order Web App – Vegetables & Fruits
A full-stack web application that enables buyers to place bulk orders for vegetables/fruits and track them, while admins can efficiently manage orders and inventory through an intuitive dashboard.

🚀 Tech Stack
Frontend: React.js, JavaScript, Tailwind CSS

Backend: Node.js, Express.js

Database: PostgreSQL

Deployment: (e.g., Vercel + Render/Neon/Docker)

🎯 Objectives
Create a robust full-stack system to manage bulk vegetable/fruit orders.

Build a clean, responsive UI for buyers and admins.

Learn database design, API development, and deployment.

🔧 Features
👥 Buyer
Browse all available fruits/vegetables

Place bulk orders with delivery info

Track orders by order ID

🛠️ Admin
View all orders

Update order status (Pending, In Progress, Delivered)

Add, edit, delete products from the catalogue

🛠️ Setup Instructions (Frontend & Backend)
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/TrineshCh/orders-app.git
cd orders-app
2. Install Dependencies
Frontend (React):
bash
Copy
Edit
cd client
npm install
Backend (Express):
bash
Copy
Edit
cd server
npm install
3. Setup Environment Variables
Create a .env file in the /server directory with:

ini
Copy
Edit
DATABASE_URL=your_postgres_connection_url
PORT=5000
🗄️ Database Setup
You can use Neon.tech or Docker for PostgreSQL.

📦 Tables:
products Table

Field	Type
id	INT (PK)
name	TEXT
price	DECIMAL
orders Table

Field	Type
id	INT (PK)
buyer_name	TEXT
buyer_contact	TEXT
delivery_address	TEXT
items	JSON
status	TEXT
📡 API Routes

Method	Endpoint	Description
GET	/api/products	Get product catalogue
POST	/api/orders	Place a new order
GET	/api/orders/:id	View order details (buyer)
GET	/api/orders	View all orders (admin)
PUT	/api/orders/:id	Update order status (admin)
POST	/api/products	Add new product (admin)
PUT	/api/products/:id	Edit product (admin)
DELETE	/api/products/:id	Delete product (admin)
🧪 Running the App Locally
1. Start Backend
bash
Copy
Edit
cd server
npm start
2. Start Frontend
bash
Copy
Edit
cd client
npm start
Open in browser: http://localhost:3000
