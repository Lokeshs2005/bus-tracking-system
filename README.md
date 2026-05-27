# 🌌 Cosmic Slate E-Commerce Platform

A production-ready, beautiful full-stack e-commerce platform built using **Java 23** and **Spring Boot 3.3.0**, featuring a **glassmorphic dark slate UI** with vibrant **neon accents, 3D payment widgets, and custom session-based security**. 

This application is designed to be immediately runnable out-of-the-box with **zero manual database or runtime installation**, using a file-persisted **H2 Relational Database**. It also provides pre-wired profiles to instantly swap to **MySQL** or **PostgreSQL**.

---

## ✨ Outstanding Core Features

1. **Ambient Product Catalog**: Live product search inputs, filter chips, rating stars, and real-time inventory stock checks without browser reloads.
2. **Persistent Cart Drawer**: Instant slide-out basket drawing subtotal, sales tax (8%), shipping costs (flat rate $9.99, or **FREE** for orders over $100), and grand totals.
3. **Guest Session Merging**: Customers can add items to their basket anonymously. Upon logging in or registering a new account, session items are automatically merged with their relational database cart profile!
4. **Interactive 3D Credit Card Widget**: Single-page checkout featuring a 3D payment credit card widget. Entering the CVV flips the card dynamically in CSS 3D space, and digit entry identifies card brands (Visa/Mastercard/Amex) automatically.
5. **Invoice Print Templates**: Chronological order step indicators (`Placed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`) and print-styled receipts using physical printer page rules (`@media print`).

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Spring Boot 3.3.0, Spring Data JPA, Hibernate, JSR-380 validation, standard session controls (`HttpSession`).
- **Frontend**: **Thymeleaf HTML templates**, custom premium **Vanilla CSS (style.css)**, and **asynchronous JavaScript (main.js)**. AJAX `fetch()` handles all UI updates dynamically for a modern Single Page Application (SPA) feel.
- **Relational Database**: File-persisted **H2 Relational Database** configured to write database files inside `./data/ecommercedb` so that product reviews, new user sign-ups, and order rows survive restarts.
- **Security**: Custom SHA-256 password hashing with salt + custom HandlerInterceptor routing protections.

---

## 🚀 Quick Start (Zero Setup)

You can launch and package the application using the portable Maven wrapper located at the root of the workspace:

### 1. Build and Compile
```cmd
.\apache-maven-3.9.9\bin\mvn.cmd clean package
```

### 2. Run the Application
```cmd
.\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

Once the backend starts, open your web browser and navigate to:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🔐 Seeding & Pre-Registered Accounts

On startup, the system automatically checks if the database is blank. If it is, it seeds the catalog with **8 high-end tech/lifestyle items** and creates two demo accounts:

| Role | Email Address | Plaintext Password |
| :--- | :--- | :--- |
| **Store Admin** | `demo@example.com` | `password` |
| **Regular User** | `user@example.com` | `password` |

---

## 🛢️ H2 Embedded Console

To view active tables (`users`, `products`, `cart_items`, `orders`, `order_items`), you can access the H2 console inside your browser:
- **URL**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:./data/ecommercedb`
- **Username**: `sa`
- **Password**: *(leave blank)*

---

## ⚡ Switching to MySQL or PostgreSQL

1. Open `src/main/resources/application.properties` and comment out the H2 profile block.
2. Uncomment either the **MySQL** or **PostgreSQL** profile lines.
3. Configure your local username, password, and port inside the properties.
4. Execute the DDL table structures in `schema.sql` inside your database client, then launch the app!
