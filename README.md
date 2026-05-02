# Replii - Enterprise AI-Powered Email & CRM Suite

![Replii Logo](https://i.postimg.cc/k4fQ3bZ7/Screenshot-from-2026-05-02-10-33-04.png) 

**Replii** is a sophisticated, multi-tenant SaaS platform designed to revolutionize business communication. By integrating advanced AI capabilities directly into the email workflow, Replii enables businesses to automate responses, gain deep sentiment insights, and manage customer opportunities with unprecedented efficiency.

---

## 🌐 Live Project Links

| Environment | URL |
| :--- | :--- |
| **Frontend (Live Site)** | [https://replii.ca](https://replii.ca) |
| **Backend API Base** | [https://api.replii.ca](https://api.replii.ca) |

---

## 📖 Project Overview

Replii is built for modern enterprises and high-growth teams that need more than just an email client. It acts as an **intelligent layer** over your communication channels, using AI to understand the context of every message, track sales leads, and provide data-driven insights. 

Whether it's generating a perfect reply in seconds, identifying a new sales opportunity, or managing complex billing tiers, Replii provides a unified, professional dashboard for your entire team.

---

## 🚀 Key Features

### 📧 Intelligent Email Management
- **Unified Inbox:** Connect and manage multiple mailboxes (IMAP/SMTP) in one place.
- **Smart Threading:** Automatically groups related messages into clean conversations.
- **AI-Powered Replies:** Generate context-aware drafts with adjustable tones (Professional, Friendly, Urgent).
- **Sentiment Analysis:** Real-time AI analysis of customer mood and intent.

### 💼 CRM & Opportunity Tracking
- **Lead Scoring:** AI-driven assessment of lead quality based on interaction history.
- **Opportunity Pipeline:** Visual sales stages (Lead, Won, Lost) to track business growth.
- **Customer 360:** A comprehensive view of every customer's emails, notes, and value.
- **Knowledge Base:** Upload company documents to train the AI on your specific business rules.

### 💳 Advanced Billing (Stripe)
- **Subscription Tiers:** Support for Starter, Growth, and Pro plans.
- **Automated Metering:** Real-time tracking of AI credits and user limits.
- **Self-Service Portal:** Allow users to manage payment methods and invoices directly.

### 🔐 Enterprise Security
- **RBAC:** Fine-grained Role-Based Access Control (SuperAdmin, Admin, User).
- **2FA:** Built-in Two-Factor Authentication for enhanced security.
- **Data Isolation:** Strict multi-tenant architecture ensuring business data privacy.

---

## 👥 User Roles

| Role | Description |
| :--- | :--- |
| **SuperAdmin** | Platform owner. Monitors global revenue, manages plans, and oversees all businesses. |
| **Admin** | Business owner. Manages team members, connects mailboxes, and handles billing. |
| **User** | Team member. Interacts with customers, uses AI features, and manages leads. |

---

## 🛠️ Technology Stack

- **Backend:** NestJS (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.io
- **AI Engine:** OpenAI GPT-4o
- **Payments:** Stripe (Checkout, Billing Portal, Webhooks)
- **Infrastructure:** Docker, Nginx/Caddy, Linux

---

## 🏗️ System Architecture

Replii follows a **Modular Monolith** architecture designed for high availability:
1.  **Controller Layer:** Strict request validation and routing.
2.  **Service Layer:** Core business logic, AI orchestration, and mail syncing.
3.  **Real-time Gateway:** Instant event broadcasting for new emails and notifications.
4.  **Integration Layer:** Specialized wrappers for Stripe, OpenAI, and IMAP/SMTP protocols.

---

## 🔄 Business Flow (How it Works)

1.  **Registration:** Admin signs up at [replii.ca](https://replii.ca) and creates a business profile.
2.  **Connection:** Admin connects a business email (Gmail/Outlook) via the dashboard.
3.  **AI Training:** Company FAQs or documents are uploaded to the Knowledge Base.
4.  **Interaction:** The team receives emails. AI suggests replies based on the Knowledge Base.
5.  **Conversion:** Threads are marked as "Won" or "Lost," feeding into the CRM analytics.
6.  **Scaling:** As the business grows, the Admin upgrades the plan via the Stripe portal.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Stripe Account & OpenAI API Key

### Installation
```bash
# 1. Clone
git clone https://github.com/reazulislamreaz/twvinfast-server-full
cd twvinfast-server-full

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your credentials

# 4. Migrate & Seed
npx prisma migrate dev
npm run prisma:seed

# 5. Start
npm run start:dev
```

---

## 🔑 Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for Access Tokens |
| `STRIPE_SECRET_KEY` | Stripe Secret Key |
| `OPENAI_API_KEY` | OpenAI API Key |
| `PORT` | API Port (default 8800) |

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
