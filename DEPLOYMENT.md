# Ecommerce - Deployment Guide

This guide provides simple, step-by-step instructions to deploy the **Ecommerce** premium full-stack platform.

---

## 1. Backend Deployment (Spring Boot API + H2)

For production or cloud sandbox hosting, you can host the Java Spring Boot service on platforms like **Render**, **Fly.io**, or **Heroku**.

### A. Deploying on Render (Recommended)
1. Register a free account at [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: `https://github.com/Lokeshs2005/ecommerce-plat`.
4. Configure the Web Service parameters:
   - **Name**: `ecommerce-api`
   - **Environment / Runtime**: `Docker` or `Java` (Maven)
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/ecommerce-1.0.0-SNAPSHOT.jar`
5. Click **Advanced** and add the following **Environment Variables**:
   - `XAI_GROK_API_KEY`: `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` (Preset live key)
   - `SPRING_DATASOURCE_URL`: `jdbc:h2:file:/opt/render/project/data/ecommercedb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE`
6. Render will automatically compile, spin up the server, and expose your service on a public HTTPS URL (e.g. `https://ecommerce-api.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Vercel provides edge hosting for HTML, CSS, and JS. The project is loaded with a pre-configured `vercel.json` to handle routes seamlessly.

1. Create a free account on [Vercel](https://vercel.com).
2. Click **Add New Project** and import your repository: `https://github.com/Lokeshs2005/ecommerce-plat`.
3. In the project settings, set the following:
   - **Build Command**: (Leave empty, pure static assets)
   - **Output Directory**: (Leave empty)
4. Click **Deploy**. Vercel will launch your premium shop on a fast CDN address.

---

## 3. Configuration & API Settings

### A. Firebase Authentication Console
- The frontend is already **fully pre-configured** to load your Firebase Google Sign-In instance automatically:
  - **API Key**: `AIzaSyAqndMIuymgVu3pocwD75KK1tb9-U8yZ9A`
  - **Project ID**: `e-commerce-ai-9528c`
  - **Auth Domain**: `e-commerce-ai-9528c.firebaseapp.com`
- You can change or update these parameters at any time by expanding the **Firebase Credentials Console** widget directly on the `/login` portal page.

### B. Grok AI Setup Stylist
- Your Spring Boot REST layer uses the live xAI completion network (`https://api.x.ai/v1/chat/completions`) using the active **Grok API Key**.
- If the API key is revoked or offline, it triggers the cognitive fallback engine to match products perfectly from local catalog structures, ensuring zero downtime.
