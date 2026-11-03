# ShopInsight – Smart Retail Analytics Platform

A web-based retail inventory and sales management platform that helps small businesses manage products, monitor stock levels, record sales, and analyse business performance.

## 🌐 Live Demo

https://kaniston.github.io/ShopInsight/

## 🚀 Features

- **User Authentication:** Secure signup and login using Supabase Auth.
- **Dashboard:** View product counts, stock quantities, stock value and estimated profit.
- **Product Management:** Add, edit, delete and search products.
- **Inventory Monitoring:** Track stock levels and identify low-stock products.
- **Sales Management:** Record sales and automatically update inventory.
- **Sales History:** View recorded transactions, revenue and gross profit.
- **Advanced Analytics:** Monitor actual revenue, gross profit, transactions and units sold.
- **Sales Trend Chart:** Visualise revenue over the last seven days.
- **CSV Export:** Export inventory data for further analysis.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Supabase Authentication
- Supabase PostgreSQL Database
- Chart.js
- Git and GitHub

## 🗄️ Database

ShopInsight uses Supabase PostgreSQL to store product and sales information.

Main tables:
- `products` – Product details, prices and inventory.
- `sales` – Sales transactions, revenue and gross profit.

Row Level Security (RLS) is used to protect user-owned database records.

## 💻 Run Locally

1. Clone this repository:

   ```bash
   git clone https://github.com/kaniston/ShopInsight.git
   ```

2. Open the project folder in Visual Studio Code.

3. Configure your Supabase project URL and publishable key in `supabase.js`.

4. Make sure the Supabase database tables, authentication settings and RLS policies are configured.

5. Open the project using VS Code Live Server.

## 🎯 Project Objective

The objective of ShopInsight is to simplify inventory and sales management for small businesses through an easy-to-use dashboard and data-driven insights.

## 👨‍💻 Developer

**Kaniston**  
B.Sc. Computer Science  
Loyola College

## 📌 Future Improvements

- Monthly and yearly sales reports
- Best-selling product analysis
- PDF report generation
- More advanced business performance insights
