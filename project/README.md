# Multi-Tenant SaaS Notes Application

A comprehensive multi-tenant SaaS Notes Application built with Next.js, featuring JWT authentication, role-based access control, and subscription-based feature gating.

## Architecture

### Multi-Tenancy Approach
This application uses a **shared schema with tenant ID** approach for multi-tenancy:

- **Single Database**: All tenants share the same database instance
- **Tenant Isolation**: Each table includes a `tenant_id` column to ensure strict data isolation
- **Benefits**: 
  - Cost-effective for small to medium scale
  - Easier maintenance and updates
  - Efficient resource utilization
- **Security**: All queries are automatically filtered by tenant ID to prevent cross-tenant data access

### Database Schema
```sql
-- Tenants table
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table with tenant isolation
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  tenant_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Notes table with tenant isolation
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);
```

## Features

### 1. Multi-Tenancy
- **Two Tenants**: Acme Corporation and Globex Corporation
- **Strict Data Isolation**: Tenant data is completely separated
- **Tenant-Aware APIs**: All endpoints automatically filter by tenant

### 2. Authentication & Authorization
- **JWT-based Authentication**: Secure token-based auth system
- **Role-Based Access Control**:
  - **Admin**: Can invite users, upgrade subscriptions, manage notes
  - **Member**: Can only create, view, edit, and delete notes

### 3. Subscription Feature Gating
- **Free Plan**: Limited to 3 notes maximum
- **Pro Plan**: Unlimited notes
- **Upgrade Functionality**: Admins can upgrade tenant subscriptions

### 4. Predefined Test Accounts
All accounts use password: `password`

| Email | Role | Tenant | Plan |
|-------|------|--------|------|
| admin@acme.test | Admin | Acme | Free |
| user@acme.test | Member | Acme | Free |
| admin@globex.test | Admin | Globex | Free |
| user@globex.test | Member | Globex | Free |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Health Check
- `GET /api/health` - Returns `{"status": "ok"}`

### Tenant Management
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro plan (Admin only)

### Notes CRUD
- `GET /api/notes` - List all notes for current tenant
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Deployment**: Vercel/Netlify

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create `.env.local`:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Frontend: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## Security Features

### Tenant Isolation
- All database queries include tenant ID filtering
- JWT tokens contain tenant information
- API endpoints verify tenant ownership before operations

### Authentication Security
- Passwords hashed with bcryptjs
- JWT tokens with expiration (24 hours)
- Authorization headers required for protected endpoints

### Role-Based Access
- Admin-only endpoints protected with role checks
- Member users cannot access admin functions
- Subscription upgrades restricted to tenant admins

## CORS Configuration

CORS is enabled for all API endpoints to support automated testing and external integrations:

```javascript
headers: [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
  { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }
]
```

## Testing the Application

### Manual Testing
1. Visit the deployed application
2. Use the predefined test accounts to login
3. Test note creation, viewing, and deletion
4. Test subscription limits (try creating 4+ notes on Free plan)
5. Test admin upgrade functionality

### API Testing
Use tools like Postman or curl to test the API endpoints:

```bash
# Login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

# Create Note (use token from login response)
curl -X POST https://your-app.vercel.app/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Note","content":"This is a test note"}'
```

## Deployment

The application is configured for deployment on Vercel with automatic CORS handling and environment variable support.

### Environment Variables for Production
- `JWT_SECRET`: Strong secret key for JWT signing
- Database is automatically initialized on first API call

## License

This project is for educational/assignment purposes.
