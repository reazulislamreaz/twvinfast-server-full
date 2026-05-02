# Replii - Enterprise AI-Powered Email & CRM Suite

![Replii Login Page](https://i.postimg.cc/k4fQ3bZ7/Screenshot-from-2026-05-02-10-33-04.png) 

**Replii** is a sophisticated, multi-tenant SaaS platform designed to revolutionize business communication. By integrating advanced AI capabilities directly into the email workflow, Replii enables businesses to automate responses, gain deep sentiment insights, and manage customer opportunities with unprecedented efficiency.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Setup](#-setup--installation) • [API Documentation](#-api-documentation) • [Challenges](#-challenges)

---

## 🌐 Live Project Links

| Environment | URL |
| :--- | :--- |
| **Frontend (Live Site)** | [https://replii.ca](https://replii.ca) |
| **Backend API Base** | [https://api.replii.ca](https://api.replii.ca) |

---

## 🎨 Design & UI/UX Preview

Explore the complete UI/UX design and wireframes of the Replii (AI Email Assistant) platform on Figma:

👉 [View Figma Design](https://www.figma.com/design/T5qG4wnfCp4JLNigU8fYDw/twvinfast-%7C%7C-bits_wise_Fiverr-%7C%7C-FO2D7220A442?node-id=34883-2459&p=f&t=nwOvOLsYZ5C0J8ms-0)

---

## 📖 Project Overview

Replii is built for modern enterprises and high-growth teams that need more than just an email client. It acts as an **intelligent layer** over your communication channels, using AI to understand the context of every message, track sales leads, and provide data-driven insights. 

Whether it's generating a perfect reply in seconds, identifying a new sales opportunity, or managing complex billing tiers, Replii provides a unified, professional dashboard for your entire team.

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT Auth with Refresh Tokens:** Secure, stateless session management.
- **Two-Factor Authentication (2FA):** Enhanced account protection using TOTP.
- **Role-Based Access Control (RBAC):** Distinct permissions for SuperAdmins, Admins, and Users.

### 📧 Intelligent Email Management
- **Unified Inbox:** Centralized management of multiple mailboxes via IMAP/SMTP.
- **Smart Threading:** Intelligent grouping of messages using `Message-ID` and `References`.
- **AI Generate & Reply:** Draft context-aware responses with tone control (Professional, Friendly, etc.).
- **Sentiment Analysis:** Real-time analysis of customer intent and mood.

### 💼 CRM & Opportunity Tracking
- **Lead Scoring:** Automated assessment of customer potential.
- **Opportunity Pipeline:** Visual sales stages (Lead, Won, Lost).
- **Customer 360:** Comprehensive interaction history and notes.
- **Knowledge Registry:** Business document management for AI training.

### 💳 Billing & Analytics
- **Subscription Management:** Automated billing via Stripe (Starter, Growth, Pro).
- **AI Credit System:** Granular tracking and enforcement of AI usage credits.
- **Revenue Dashboard:** High-level financial reporting for SuperAdmins.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, NestJS, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.io (WebSockets)
- **AI Engine:** OpenAI GPT-4o
- **Payments:** Stripe (Checkout, Customer Portal, Webhooks)
- **Authentication:** Passport.js (JWT), Speakeasy (2FA)
- **Infrastructure:** Docker, Nginx/Caddy, Linux (DigitalOcean)

---

## 🏗️ Architecture

Replii utilizes a robust, service-oriented architecture designed for scalability and multi-tenancy:

**Client → API (NestJS Controllers) → Service Layer → Data Access (Prisma) → Database (PostgreSQL)**

- **Controller Layer:** Handles HTTP requests and ensures strict input validation.
- **Service Layer:** Orchestrates core business logic, AI interactions, and mailbox syncing.
- **Integration Layer:** specialized services for external APIs (Stripe, OpenAI).
- **Real-time Gateway:** Manages WebSocket connections for instant frontend updates.

---

## 🔄 Business Flow

1.  **Onboarding:** Admin signs up at [replii.ca](https://replii.ca) and creates a business profile.
2.  **Connection:** Admin connects a business email (Gmail/Outlook) via the dashboard.
3.  **AI Training:** Company FAQs or documents are uploaded to the Knowledge Base.
4.  **Interaction:** The team receives emails. AI suggests replies based on the Knowledge Base.
5.  **Conversion:** Threads are marked as "Won" or "Lost," feeding into the CRM analytics.
6.  **Scaling:** As the business grows, the Admin upgrades the plan via the Stripe portal.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Stripe Account & OpenAI API Key

### Installation Steps
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/reazulislamreaz/twvinfast-server-full
    cd twvinfast-server-full
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    ```bash
    cp .env.example .env
    # Update .env with your specific API keys and DB credentials.
    ```
4.  **Database Migration & Seeding:**
    ```bash
    npx prisma migrate dev
    npm run prisma:seed
    ```
5.  **Start Development Server:**
    ```bash
    npm run start:dev
    ```

---

## 📚 API Documentation

Replii provides a comprehensive RESTful API for all platform functionalities.

- **Base URL:** `https://api.replii.ca`
- **Authentication:** JWT Bearer Token

For a detailed breakdown of all available endpoints, request/response examples, and validation rules, please refer to our full documentation:

👉 **[View Full API Documentation](./API_DOCUMENTATION.md)**

---

## 🧠 Challenges

### 1. High-Performance Email Synchronization
**Challenge:** Syncing thousands of emails across multiple concurrent IMAP connections without blocking the main event loop or hitting memory limits.
**Solution:** Implemented a background worker pattern with efficient IMAP UID tracking and incremental syncing to minimize data transfer and processing overhead.

### 2. AI Hallucination & Accuracy
**Challenge:** Ensuring AI-generated replies remain grounded in the specific business's data and do not "hallucinate" incorrect information.
**Solution:** Developed a strict RAG (Retrieval-Augmented Generation) pipeline that forces the AI to prioritize the Knowledge Base documents and implemented a "Hallucination Report" system for continuous manual improvement.

### 3. Multi-tenant Data Isolation
**Challenge:** Preventing any possibility of data leakage between different business accounts in a shared database environment.
**Solution:** Utilized Prisma middleware and strict service-layer scoping to ensure every database query is automatically filtered by `business_id`, reinforced by strict RBAC guards.

---

## 🛡️ Security Features
- **Stateless Auth:** Secure JWT with refresh token rotation.
- **Encryption:** Bcrypt password hashing and encrypted mail credentials.
- **Validation:** Strict `class-validator` schemas for all API inputs.

---

## 🚢 Deployment
Deployable via Docker to any cloud provider (AWS, DigitalOcean, Heroku).
```bash
docker-compose up --build -d
```

---

## 👤 Author & Contact
**Replii Engineering Team**  
Support: [support@replii.ca]
