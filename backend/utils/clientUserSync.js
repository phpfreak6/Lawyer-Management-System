/**
 * Client-User Sync Utility
 * Synchronizes clients table with users table for login functionality
 */

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Sync client to user (create user login from client record)
 */
async function syncClientToUser(clientId) {
  try {
    // Get client data
    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [clientId]
    );

    if (clients.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    const client = clients[0];

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [client.email, client.tenant_id]
    );

    if (existingUsers.length > 0) {
      return { success: false, error: 'User already exists for this email' };
    }

    if (!client.email) {
      return { success: false, error: 'Client has no email address' };
    }

    // Generate default password
    const defaultPassword = `${client.first_name.substring(0, 4).toLowerCase()}${client.phone.slice(-4)}`;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create user
    await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'client', true)`,
      [client.tenant_id, client.email, passwordHash, client.first_name, client.last_name, client.phone]
    );

    return {
      success: true,
      email: client.email,
      password: defaultPassword,
      message: 'User login created successfully'
    };
  } catch (error) {
    console.error('Sync client to user error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync user to client (create client record from user)
 */
async function syncUserToClient(userId) {
  try {
    // Get user data
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const user = users[0];

    // Check if client already exists
    const [existingClients] = await pool.execute(
      'SELECT id FROM clients WHERE email = ? AND tenant_id = ?',
      [user.email, user.tenant_id]
    );

    if (existingClients.length > 0) {
      return { success: false, error: 'Client already exists for this email' };
    }

    // Create client record
    await pool.execute(
      `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [user.tenant_id, user.first_name, user.last_name, user.email, user.phone, null]
    );

    return {
      success: true,
      message: 'Client record created successfully'
    };
  } catch (error) {
    console.error('Sync user to client error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all clients without user accounts
 */
async function syncAllClients() {
  try {
    const [clientsWithoutUsers] = await pool.execute(
      `SELECT c.* FROM clients c
       LEFT JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE u.id IS NULL AND c.email IS NOT NULL AND c.email != ''`
    );

    console.log(`Found ${clientsWithoutUsers.length} clients without user accounts`);

    const results = [];
    for (const client of clientsWithoutUsers) {
      const result = await syncClientToUser(client.id);
      results.push({
        client_id: client.id,
        email: client.email,
        ...result
      });
    }

    return {
      success: true,
      synced: results.filter(r => r.success).length,
      total: results.length,
      results
    };
  } catch (error) {
    console.error('Sync all clients error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all users without client records (for client role users)
 */
async function syncAllUsers() {
  try {
    const [usersWithoutClients] = await pool.execute(
      `SELECT u.* FROM users u
       LEFT JOIN clients c ON u.email = c.email AND u.tenant_id = c.tenant_id
       WHERE c.id IS NULL AND u.role = 'client'`
    );

    console.log(`Found ${usersWithoutClients.length} client users without client records`);

    const results = [];
    for (const user of usersWithoutClients) {
      const result = await syncUserToClient(user.id);
      results.push({
        user_id: user.id,
        email: user.email,
        ...result
      });
    }

    return {
      success: true,
      synced: results.filter(r => r.success).length,
      total: results.length,
      results
    };
  } catch (error) {
    console.error('Sync all users error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check sync status
 */
async function getSyncStatus(tenantId) {
  try {
    // Count clients without users
    const [clientsWithoutUsers] = await pool.execute(
      `SELECT COUNT(*) as count FROM clients c
       LEFT JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE u.id IS NULL AND c.tenant_id = ? AND c.email IS NOT NULL AND c.email != ''`,
      [tenantId]
    );

    // Count users without clients
    const [usersWithoutClients] = await pool.execute(
      `SELECT COUNT(*) as count FROM users u
       LEFT JOIN clients c ON u.email = c.email AND u.tenant_id = c.tenant_id
       WHERE c.id IS NULL AND u.tenant_id = ? AND u.role = 'client'`,
      [tenantId]
    );

    // Count total clients with users
    const [clientsWithUsers] = await pool.execute(
      `SELECT COUNT(*) as count FROM clients c
       INNER JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE c.tenant_id = ?`,
      [tenantId]
    );

    return {
      clientsWithoutUsers: clientsWithoutUsers[0].count,
      usersWithoutClients: usersWithoutClients[0].count,
      clientsWithUsers: clientsWithUsers[0].count
    };
  } catch (error) {
    console.error('Get sync status error:', error);
    throw error;
  }
}

module.exports = {
  syncClientToUser,
  syncUserToClient,
  syncAllClients,
  syncAllUsers,
  getSyncStatus
};

