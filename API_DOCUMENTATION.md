# Replii API Documentation

This documentation provides details on how to interact with the Replii Backend API.

## 🔹 Base URL
**[https://api.replii.ca](https://api.replii.ca)**

---

## 🔐 Authentication

Replii uses **JWT (JSON Web Tokens)** for stateless authentication.
1.  **Login:** Send credentials to the login endpoint to receive an `accessToken`.
2.  **Authorization Header:** Include the token in the header of all protected requests:
    `Authorization: Bearer <accessToken>`

---

## 📦 API Endpoints

### 1. Authentication API

#### **Login**
`POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "role": "USER"
    }
  }
}
```

#### **Get Current User**
`GET /auth/me`

**Headers:**
`Authorization: Bearer <accessToken>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "business_id": 1
  }
}
```

---

### 2. Billing & Subscriptions (Admin Only)

#### **Create Checkout Session**
`POST /billing/checkout`

**Request Body:**
```json
{
  "planId": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/c/pay/..."
  }
}
```

---

### 3. Email Threads & AI

#### **List Threads**
`GET /threads`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Fuzzy search by subject or sender.
- `status`: Filter by `NEW`, `WON`, `LOST`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "subject": "Inquiry about Replii",
      "status": "NEW",
      "last_message_at": "2024-05-02T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "lastPage": 15
  }
}
```

#### **Generate AI Reply**
`POST /mail/smtp/reply`

**Request Body:**
```json
{
  "email_id": 452,
  "prompt": "Offer a 10% discount for the annual plan.",
  "tone": "Professional"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "content": "Dear Customer, thank you for your interest. We are pleased to offer you a 10% discount...",
    "tokens_used": 150
  }
}
```

---

## 🛠️ Global Patterns

### **Error Response Format**
Replii returns a consistent error structure:
```json
{
  "success": false,
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### **Validation Rules**
- All `POST` and `PATCH` requests are validated using `class-validator`.
- Email fields must be valid email formats.
- Password fields require a minimum of 8 characters.

### **Role-Based Access Control (RBAC)**
- **Public:** Login, Signup, Webhooks.
- **User:** Manage emails, view personal leads.
- **Admin:** Manage team, billing, and business settings.
- **SuperAdmin:** Access to platform-wide analytics and system configuration.

### **Pagination & Filtering**
Standard list endpoints support `page`, `limit`, and `search` query parameters to ensure performance and usability.
