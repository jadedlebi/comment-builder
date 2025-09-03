# 🔒 Deployment Security Guide

## Admin Management Security

### ⚠️ **IMPORTANT**: Admin Management Scripts

The following files contain sensitive admin management functionality and are **excluded from version control**:

- `server/scripts/add-admin.js` - Direct admin creation script
- `server/scripts/admin-manager.js` - Interactive admin management
- `server/scripts/admin-setup.js` - Custom admin setup (create from example)

### 🛡️ **Security Measures Implemented**

1. **Git Ignore**: Admin scripts are excluded from repository
2. **Environment Variables**: No hardcoded credentials
3. **Database Storage**: All admin data stored securely in BigQuery
4. **Password Hashing**: bcrypt encryption for all passwords
5. **API Authentication**: Token-based admin management

### 🚀 **Production Deployment**

#### Option 1: API-Based Admin Management (Recommended)
```bash
# Use the built-in API endpoints for admin management
curl -X POST http://your-domain.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yourdomain.com", "password": "yourpassword"}'

# Then use the returned token to manage admins
curl -X POST http://your-domain.com/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "newadmin@yourdomain.com", "password": "SecurePass123!", "name": "New Admin", "role": "admin"}'
```

#### Option 2: Server-Side Admin Setup
1. **Create admin setup file** (on server only):
   ```bash
   # On your production server
   cp server/scripts/admin-setup.example.js server/scripts/admin-setup.js
   # Edit admin-setup.js with your specific admin details
   ```

2. **Run admin setup** (one-time):
   ```bash
   # On your production server only
   node server/scripts/admin-setup.js
   ```

3. **Delete setup file** after use:
   ```bash
   rm server/scripts/admin-setup.js
   ```

### 🔐 **Environment Variables Required**

Ensure these are set in your production environment:

```env
# BigQuery Configuration
BQ_PROJECT_ID=your-project-id
BQ_TYPE=service_account
BQ_PRIVATE_KEY_ID=your-key-id
BQ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BQ_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
BQ_CLIENT_ID=your-client-id
BQ_AUTH_URI=https://accounts.google.com/o/oauth2/auth
BQ_TOKEN_URI=https://oauth2.googleapis.com/token
BQ_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
BQ_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# Optional
BIGQUERY_DATASET=cfpb
NODE_ENV=production
```

### 🚫 **What NOT to Deploy**

- ❌ Admin management scripts (`add-admin.js`, `admin-manager.js`)
- ❌ Environment files (`.env`)
- ❌ Service account keys (`.json` files)
- ❌ Any hardcoded credentials

### ✅ **What IS Safe to Deploy**

- ✅ API endpoints (`/api/auth/admin/login`, `/api/admin/admins`)
- ✅ Database schema and services
- ✅ Authentication middleware
- ✅ Example files (`.example.js`)

### 🔧 **Post-Deployment Admin Setup**

1. **Initial Admin Access**: Use the two default admin accounts created by the setup script
2. **Add New Admins**: Use the API endpoints with proper authentication
3. **Monitor Access**: Check admin login logs in BigQuery
4. **Regular Audits**: Review admin user list periodically

### 🛠️ **Emergency Admin Access**

If you lose admin access:

1. **Database Access**: Connect directly to BigQuery
2. **Create Admin**: Insert new admin record with hashed password
3. **Reset Password**: Update existing admin's password hash
4. **API Access**: Use new credentials to access admin endpoints

### 📋 **Security Checklist**

- [ ] Admin scripts excluded from git
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API endpoints properly authenticated
- [ ] Password hashing implemented
- [ ] No hardcoded credentials in code
- [ ] Admin access logged and monitored
- [ ] Regular security audits scheduled

## 🎯 **Best Practices**

1. **Use API Endpoints**: Prefer API-based admin management over direct database access
2. **Strong Passwords**: Enforce strong password policies
3. **Regular Rotation**: Change admin passwords periodically
4. **Access Monitoring**: Monitor admin login activities
5. **Principle of Least Privilege**: Only grant necessary admin permissions
6. **Secure Deployment**: Never commit sensitive files to version control
