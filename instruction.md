# POS System Requirements Document - [Clothing Business]

## 1. Project Overview
A comprehensive Point of Sale (POS) and Inventory Management System designed for a clothing business handling Retail, Wholesale, and In-house Manufacturing.

---

## 2. Business Requirements (Functional)

### A. Inventory Management
* **Item Categorization:** Differentiate between "Purchased Items" (Resell) and "Manufactured Items" (Sewn in-house).
* **Stock Tracking:** Real-time stock levels for retail and wholesale.
* **Costing:** * Purchased Items: (Vendor Price + Shipping) + Margin.
    * Manufactured Items: (Material Cost + Tailoring Cost) + Margin.
* **Low Stock Alerts:** Notifications when stock goes below a certain limit.
* **Barcode Integration:** Generate and scan barcodes for items.

### B. Sales Management (POS Interface)
* **Dual Pricing:** Toggle between **Retail Price** and **Wholesale Price** for the same item.
* **Discount Management:** Ability to add fixed or percentage discounts at the checkout.
* **Payment Methods:** Support for Cash, Card, and Bank Transfers.
* **Invoicing:** Generate professional receipts (Thermal print for retail, A4/A5 for wholesale).

### C. Vendor & Wholesale Customer Management
* **Supplier Database:** Record vendor details, payments made, and outstanding balances.
* **Credit Management:** Track wholesale customers who buy on credit (Debt tracking).

### D. Manufacturing (Sewing) Module
* **Cost Tracking:** Ability to input raw material costs for items produced in-house.
* **Finished Goods Entry:** Automatically add sewn items to the main inventory once completed.

### E. Reports & Analytics
* **Daily Sales Report:** Summary of cash/card/credit sales.
* **Profit/Loss Analysis:** Calculate profit based on the margin of sold items.
* **Fast Moving Items:** Identify which designs/sizes sell the most.

---

## 3. Technical Requirements (The Stack)

* **Frontend:** Next.js (React Framework) - For a fast, SEO-friendly (if needed) and modern UI.
* **Styling:** Tailwind CSS - For rapid and responsive UI design.
* **State Management:** React Context API or Zustand - To handle the shopping cart and user sessions.
* **Backend/Database:** * **Option A (Recommended for Beginners):** Supabase (PostgreSQL) - Handles database, authentication, and file storage easily.
    * **Option B:** Node.js with MongoDB/Prisma.
* **Authentication:** NextAuth.js or Supabase Auth (Owner & Staff login).
* **Deployment:** Vercel (Free tier is usually enough for a single shop).

---

## 4. System Architecture & UI Flow

### Step 1: Authentication
* Secure Login for Owner and Staff.

### Step 2: Dashboard
* Overview of today's sales, total stock value, and pending wholesale payments.

### Step 3: Product Management (The Core)
* **Fields:** Product Name, Category (Retail/Wholesale), Type (In-house/Vendor), Cost Price, Retail Price, Wholesale Price, Stock Quantity, Size/Color variations.

### Step 4: Sales Screen (POS)
* Search bar for products / Barcode scanner input.
* Cart system.
* Customer selection (for wholesale tracking).
* Checkout and Print.

---

## 5. Implementation Roadmap

1.  **Database Schema Design:** Define tables for Products, Sales, Customers, and Vendors.
2.  **UI Mockups:** Design the POS screen using Tailwind CSS (Focus on speed).
3.  **Inventory CRUD:** Build the ability to Add, Update, and Delete products.
4.  **Sales Logic:** Implement the cart logic and price switching (Retail/Wholesale).
5.  **Reporting Engine:** Build the logic to calculate daily/monthly profits.
6.  **Printing Integration:** Use `react-to-print` for thermal receipt generation.

---

## 6. Security & Backup
* Regular database backups (Automated via Supabase).
* Role-based access (Staff can't see profit reports, only Owner can).