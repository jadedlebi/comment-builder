# Dynamic Admin Management System

The admin dashboard now uses a **dynamic, database-driven authentication system** that allows you to add, remove, and manage admin users without any code changes.

## 🚀 Features

- **Dynamic Admin Management**: Add/remove admins through API endpoints
- **Secure Password Storage**: Passwords are hashed using bcrypt
- **Database-Driven**: All admin data stored in BigQuery
- **No Code Changes**: Add new admins without touching the codebase
- **Audit Trail**: Track creation, updates, and last login times

## 📊 Database Schema

Admin users are stored in the `admin_users` table with the following structure:

```sql
- id: STRING (unique identifier)
- email: STRING (admin email address)
- password_hash: STRING (bcrypt hashed password)
- name: STRING (admin display name)
- role: STRING (admin role - default: 'admin')
- is_active: BOOLEAN (account status)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP
```

## 🔧 Initial Setup

1. **Create the admin table** (run once):
   ```bash
   cd server
   node scripts/create-admin-table.js
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the admin login**:
   - Navigate to `/admin/login`
   - Use the initial admin credentials (see below)

## 👥 Initial Admin Accounts

The setup script creates two initial admin accounts:

| Email | Password | Name | Role |
|-------|----------|------|------|
| jedlebi@ncrc.org | NCRC2024!Admin1 | Jed Lebi | admin |
| jrichardson@ncrc.org | NCRC2024!Admin2 | J Richardson | admin |

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout

### Admin Management (requires authentication)
- `GET /api/admin/admins` - Get all admin users
- `POST /api/admin/admins` - Create new admin user
- `PUT /api/admin/admins/:id` - Update admin user
- `PUT /api/admin/admins/:id/password` - Change admin password
- `DELETE /api/admin/admins/:id` - Delete admin user

## 📝 Adding New Admins

### Via API (recommended)
```bash
curl -X POST http://localhost:3001/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newadmin@ncrc.org",
    "password": "SecurePassword123!",
    "name": "New Admin",
    "role": "admin"
  }'
```

### Via Database (advanced)
```sql
INSERT INTO `your-project.cfpb.admin_users`
(id, email, password_hash, name, role, is_active, created_at, updated_at, last_login)
VALUES (
  'admin-3',
  'newadmin@ncrc.org',
  '$2b$10$hashedpassword...', -- Use bcrypt to hash password
  'New Admin',
  'admin',
  true,
  CURRENT_TIMESTAMP(),
  CURRENT_TIMESTAMP(),
  null
);
```

## 🔒 Security Features

- **Password Hashing**: All passwords stored as bcrypt hashes
- **Token-Based Auth**: Session tokens for API access
- **Database Security**: No credentials in code or environment variables
- **Audit Logging**: Track all admin activities
- **Role-Based Access**: Support for different admin roles

## 🛠️ Management Commands

### Change Admin Password
```bash
curl -X PUT http://localhost:3001/api/admin/admins/ADMIN_ID/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"newPassword": "NewSecurePassword123!"}'
```

### Deactivate Admin
```bash
curl -X PUT http://localhost:3001/api/admin/admins/ADMIN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"is_active": false}'
```

## 🎯 Benefits

1. **Scalable**: Add unlimited admin users
2. **Secure**: No credentials exposed in code
3. **Maintainable**: No code changes needed for admin management
4. **Auditable**: Full tracking of admin activities
5. **Flexible**: Support for different roles and permissions
