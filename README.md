# Multi-Tenant B2B SaaS Platform (MERN Stack)

A production-style Multi-Tenant SaaS Platform built using the **MERN** stack (MongoDB, Express.js, React.js with Vite, and Node.js). The application demonstrates organization-based multi-tenancy, strict tenant-level data isolation, role-based access control (RBAC), subscription billing with Stripe, seat limit enforcement, audit logging, and workspace analytics.

---

## 1. Architectural Highlights

- **Tenant-Level Data Isolation**: Shared-database, isolated-schema pattern. Every tenant-scoped entity (`OrganizationMembership`, `Subscription`, `Invitation`, `AuditLog`, `Project`) contains a verified `organizationId`.
- **Zero-Trust Tenant Context**: Tenant IDs supplied in requests (via `x-organization-id` header or URL parameters) are **never** trusted without cryptographically authenticating the user session and verifying their active membership and role in the database.
- **Hierarchical Role-Based Access Control (RBAC)**:
  - **Owner**: Full workspace authority, billing/subscriptions, member role modification, workspace deletion.
  - **Admin**: Member invitations and removals, workspace project management, general workspace settings.
  - **Member**: Access to workspace resources (projects, tasks, basic dashboard), restricted from organizational and billing modifications.
- **Seat Limit Enforcement & Feature Entitlements**:
  - **Free Plan**: 3 members maximum, basic dashboard, 10 recent activity logs.
  - **Pro Plan**: 10 members maximum, full activity logs, advanced analytics & member growth trends.
  - **Business Plan**: 25 members maximum, custom workspace branding, support email routing, enterprise SSO/domain settings.
- **Enterprise-Ready Foundation**: Organization domain configuration as an architectural baseline for future SAML 2.0 / Google OAuth SSO integration.
- **Stripe Billing Integration**: Stripe Checkout session support with a dual-mode fallback (Test Mode Instant Upgrade) allowing seamless evaluation whether live Stripe keys are present or running in local development mode.

---

## 2. Directory Structure

```
multi-tenant-saas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB Mongoose connection
│   │   │   ├── plans.js              # Subscription plans & feature entitlements
│   │   │   └── stripe.js             # Stripe SDK initialization
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me, Profile update
│   │   │   ├── orgController.js      # Workspace CRUD & membership lookup
│   │   │   ├── memberController.js   # Invites, role assignment, member removal
│   │   │   ├── billingController.js  # Stripe Checkout, test upgrades, webhooks
│   │   │   ├── analyticsController.js# Aggregated usage & telemetry
│   │   │   ├── auditLogController.js # Chronological audit trail with plan limits
│   │   │   └── projectController.js  # Tenant-isolated workspace resources
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Bearer JWT verification
│   │   │   ├── tenantMiddleware.js   # x-organization-id tenant context resolution
│   │   │   ├── rbacMiddleware.js     # Role verification (requireOwner, requireAdminOrOwner)
│   │   │   ├── entitlementMiddleware.js # Seat limit & feature entitlement checks
│   │   │   └── errorHandler.js       # Centralized error formatter
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Organization.js
│   │   │   ├── OrganizationMembership.js # Unique compound index: (organizationId, userId)
│   │   │   ├── Invitation.js
│   │   │   ├── Subscription.js
│   │   │   ├── AuditLog.js
│   │   │   └── Project.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── orgRoutes.js
│   │   │   ├── memberRoutes.js
│   │   │   ├── invitationRoutes.js
│   │   │   ├── billingRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── auditLogRoutes.js
│   │   │   └── projectRoutes.js
│   │   ├── utils/
│   │   │   ├── auditLogger.js        # Reusable audit trail logger
│   │   │   ├── jwt.js                # JWT sign & verify helpers
│   │   │   ├── seed.js               # Database seeding with demo accounts
│   │   │   └── testSuite.js          # Automated verification for all 10 scenarios
│   │   └── server.js                 # Express server bootstrap & middleware
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badge.jsx             # Role, Plan, and Status indicators
│   │   │   ├── ConfirmDialog.jsx     # Destructive action modal
│   │   │   ├── Layout.jsx            # Authenticated layout with Navbar & Sidebar
│   │   │   ├── Modal.jsx             # Accessible modal dialog
│   │   │   ├── Navbar.jsx            # Breadcrumbs, user profile, logout
│   │   │   ├── OrgSwitcher.jsx       # Workspace dropdown with role indicators
│   │   │   ├── Sidebar.jsx           # Linear-styled navigation & seat capacity meter
│   │   │   └── StatCard.jsx          # Dashboard metric cards
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # User authentication, token, & org list
│   │   │   └── TenantContext.jsx     # Active tenant resolution, switching, and roles
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Sign in with Quick-Fill demo buttons
│   │   │   ├── Register.jsx          # Sign up with workspace onboarding
│   │   │   ├── OrgSetup.jsx          # Create additional organization
│   │   │   ├── Dashboard.jsx         # Executive overview & capacity metrics
│   │   │   ├── Projects.jsx          # Tenant-isolated resource management
│   │   │   ├── Members.jsx           # Member table, role change, email invites
│   │   │   ├── Billing.jsx           # Plan selection, checkout, seat limits
│   │   │   ├── Analytics.jsx         # Aggregated metrics & entitlement gating
│   │   │   ├── ActivityLogs.jsx      # Audit trail with JSON inspector
│   │   │   ├── Settings.jsx          # Workspace settings, domain SSO, delete org
│   │   │   ├── Profile.jsx           # Personal info & password management
│   │   │   └── AcceptInvite.jsx      # Public invitation claim page
│   │   ├── services/
│   │   │   └── api.js                # Axios with auto JWT & x-organization-id
│   │   ├── App.jsx                   # React Router routing
│   │   ├── index.css                 # Tailwind CSS styles
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                      # Monorepo root scripts
└── README.md
```

---

## 3. Database Schema Design

| Collection | Key Fields | Constraints / Indexes |
|---|---|---|
| `users` | `name`, `email`, `passwordHash`, `avatar` | Unique index on `email` |
| `organizations` | `name`, `slug`, `domain`, `ssoEnabled`, `owner`, `plan`, `settings` | Unique index on `slug` |
| `organizationmemberships` | `organizationId`, `userId`, `role`, `joinedAt` | Unique compound index on `{ organizationId: 1, userId: 1 }` |
| `invitations` | `organizationId`, `email`, `role`, `token`, `status`, `expiresAt` | Unique index on `token`; Compound index `{ organizationId, email, status }` |
| `subscriptions` | `organizationId`, `stripeCustomerId`, `planId`, `status`, `seatsIncluded` | Unique index on `organizationId` |
| `auditlogs` | `organizationId`, `userId`, `action`, `details`, `ipAddress`, `createdAt` | Compound index on `{ organizationId: 1, createdAt: -1 }` |
| `projects` | `organizationId`, `name`, `description`, `status`, `priority`, `createdBy` | Compound index on `{ organizationId: 1, createdAt: -1 }` |

---

## 4. Pre-Configured Test Accounts

The seed script creates four accounts (all with password `Password123!`):

| User | Email | Role(s) & Workspaces |
|---|---|---|
| **Alex Vance** | `alex.owner@acme.com` | **Owner** of *Acme Corporation* (Free)<br>**Admin** of *Apex Technologies* (Pro) |
| **Sarah Connor** | `sarah.admin@acme.com` | **Admin** of *Acme Corporation* |
| **Mike Ross** | `mike.member@acme.com` | **Member** of *Acme Corporation* |
| **Elena Rostova** | `elena.partner@startup.io` | **Owner** of *Apex Technologies* (Pro) |

> **Tip:** The Login page includes one-click **"Quick Test Accounts"** buttons to instantly fill credentials for any of these roles.

---

## 5. Getting Started (Local Setup)

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or a MongoDB Atlas URI)

### Step 1: Clone and Install Dependencies
From the repository root:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2: Environment Configuration
Backend `.env` is pre-configured with sensible defaults in `backend/.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/saas_platform
JWT_SECRET=super_secret_jwt_key_saas_platform_change_in_production_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_placeholder_replace_with_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_BUSINESS_PRICE_ID=price_business_monthly
```

### Step 3: Seed the Database
Populate the database with sample organizations, users, memberships, projects, and audit trails:
```bash
cd backend
npm run seed
```

### Step 4: Run the Automated 10-Scenario Test Suite
Validate all core architectural requirements and tenant isolation checks:
```bash
cd backend
npm test
```

### Step 5: Start Frontend and Backend
Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server will listen on http://localhost:5001
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Vite client will launch at http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 6. Verification Scenarios & Testing Checklist

The test suite (`backend/src/utils/testSuite.js`) programmatically verifies all 10 requested scenarios:

1. **User Registration & Org Creation**: User registers, creates workspace, and receives Owner role with a secure JWT.
2. **Owner Inviting Members**: Owner generates an invitation with a secure cryptographically random token.
3. **Joining via Invitation**: User claims the invite token and is added to `OrganizationMembership`.
4. **Role Assignment (RBAC)**: Owner modifies member role from Member to Admin.
5. **RBAC Permission Enforcement**: Member role is strictly blocked from owner/admin restricted endpoints (e.g., billing, member deletion, settings).
6. **Multi-Tenancy & Org Switching**: User belonging to multiple organizations can switch workspaces, dynamically updating active tenant state.
7. **Tenant-Level Data Isolation**: API queries require `x-organization-id` header and filter on `organizationId`. Users cannot query data from organizations they do not belong to.
8. **Seat Limit Enforcement**: Organizations on the Free plan (capped at 3 seats) cannot add or invite a 4th member without upgrading.
9. **Subscription Upgrades**: Upgrading from Free to Pro or Business expands seat capacity and unlocks advanced telemetry features.
10. **Audit Logs**: Critical lifecycle events (`organization.created`, `member.invited`, `subscription.updated`, `settings_updated`) are immutably recorded with user and timestamp metadata.
