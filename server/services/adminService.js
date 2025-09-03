const { BigQuery } = require('@google-cloud/bigquery');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
  credentials: {
    type: process.env.BQ_TYPE,
    private_key_id: process.env.BQ_PRIVATE_KEY_ID,
    private_key: process.env.BQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.BQ_CLIENT_EMAIL,
    client_id: process.env.BQ_CLIENT_ID,
    auth_uri: process.env.BQ_AUTH_URI,
    token_uri: process.env.BQ_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.BQ_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.BQ_CLIENT_X509_CERT_URL
  }
});

const datasetId = process.env.BIGQUERY_DATASET || 'cfpb';
const tableId = 'admin_users';

class AdminService {
  // Authenticate admin user
  static async authenticateAdmin(email, password) {
    try {
      const query = `
        SELECT id, email, password_hash, name, role, is_active, last_login
        FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        WHERE email = @email AND is_active = true
      `;

      const options = {
        query: query,
        params: { email: email }
      };

      const [rows] = await bigquery.query(options);

      if (rows.length === 0) {
        return { success: false, message: 'Admin not found' };
      }

      const admin = rows[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return { success: false, message: 'Invalid password' };
      }

      // Update last login
      await this.updateLastLogin(admin.id);

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  // Update last login timestamp
  static async updateLastLogin(adminId) {
    try {
      const query = `
        UPDATE \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        SET last_login = CURRENT_TIMESTAMP(), updated_at = CURRENT_TIMESTAMP()
        WHERE id = @adminId
      `;

      const options = {
        query: query,
        params: { adminId: adminId }
      };

      await bigquery.query(options);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Get all admin users
  static async getAllAdmins() {
    try {
      const query = `
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login
        FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        ORDER BY created_at DESC
      `;

      const [rows] = await bigquery.query(query);
      return { success: true, admins: rows };
    } catch (error) {
      console.error('Error fetching admins:', error);
      return { success: false, message: 'Failed to fetch admins' };
    }
  }

  // Create new admin user
  static async createAdmin(email, password, name, role = 'admin') {
    try {
      // Check if admin already exists
      const existingAdmin = await this.getAdminByEmail(email);
      if (existingAdmin.success && existingAdmin.admin) {
        return { success: false, message: 'Admin with this email already exists' };
      }

      const adminId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      const query = `
        INSERT INTO \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        (id, email, password_hash, name, role, is_active, created_at, updated_at, last_login)
        VALUES (@id, @email, @password_hash, @name, @role, @is_active, @created_at, @updated_at, @last_login)
      `;

      const options = {
        query: query,
        params: {
          id: adminId,
          email: email,
          password_hash: passwordHash,
          name: name,
          role: role,
          is_active: true,
          created_at: now,
          updated_at: now,
          last_login: null
        }
      };

      await bigquery.query(options);

      return {
        success: true,
        admin: {
          id: adminId,
          email: email,
          name: name,
          role: role
        }
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      return { success: false, message: 'Failed to create admin' };
    }
  }

  // Get admin by email
  static async getAdminByEmail(email) {
    try {
      const query = `
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login
        FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        WHERE email = @email
      `;

      const options = {
        query: query,
        params: { email: email }
      };

      const [rows] = await bigquery.query(options);

      if (rows.length === 0) {
        return { success: false, message: 'Admin not found' };
      }

      return { success: true, admin: rows[0] };
    } catch (error) {
      console.error('Error fetching admin by email:', error);
      return { success: false, message: 'Failed to fetch admin' };
    }
  }

  // Update admin user
  static async updateAdmin(adminId, updates) {
    try {
      const allowedFields = ['name', 'role', 'is_active'];
      const updateFields = [];
      const params = { adminId };

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = @${key}`);
          params[key] = value;
        }
      }

      if (updateFields.length === 0) {
        return { success: false, message: 'No valid fields to update' };
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP()');

      const query = `
        UPDATE \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        SET ${updateFields.join(', ')}
        WHERE id = @adminId
      `;

      const options = {
        query: query,
        params: params
      };

      await bigquery.query(options);

      return { success: true, message: 'Admin updated successfully' };
    } catch (error) {
      console.error('Error updating admin:', error);
      return { success: false, message: 'Failed to update admin' };
    }
  }

  // Change admin password
  static async changePassword(adminId, newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      const query = `
        UPDATE \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        SET password_hash = @password_hash, updated_at = CURRENT_TIMESTAMP()
        WHERE id = @adminId
      `;

      const options = {
        query: query,
        params: {
          adminId: adminId,
          password_hash: passwordHash
        }
      };

      await bigquery.query(options);

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  // Delete admin user
  static async deleteAdmin(adminId) {
    try {
      const query = `
        DELETE FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
        WHERE id = @adminId
      `;

      const options = {
        query: query,
        params: { adminId: adminId }
      };

      await bigquery.query(options);

      return { success: true, message: 'Admin deleted successfully' };
    } catch (error) {
      console.error('Error deleting admin:', error);
      return { success: false, message: 'Failed to delete admin' };
    }
  }
}

module.exports = AdminService;
