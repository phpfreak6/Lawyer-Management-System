#!/usr/bin/env node

/**
 * Client-User Sync Script
 * Syncs clients table with users table to enable client login
 * 
 * Usage:
 *   node scripts/sync-clients.js [status|sync|sync-all]
 */

require('dotenv').config();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function checkSyncStatus(tenantId = 1) {
  console.log('\n📊 Checking sync status...\n');

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

    // Count clients with users
    const [clientsWithUsers] = await pool.execute(
      `SELECT COUNT(*) as count FROM clients c
       INNER JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE c.tenant_id = ?`,
      [tenantId]
    );

    console.log(`Clients without user accounts: ${clientsWithoutUsers[0].count}`);
    console.log(`Client users without client records: ${usersWithoutClients[0].count}`);
    console.log(`Clients with user accounts: ${clientsWithUsers[0].count}\n`);

    if (clientsWithoutUsers[0].count === 0 && usersWithoutClients[0].count === 0) {
      console.log('✅ All clients and users are synchronized!\n');
    } else {
      console.log('⚠️  Some clients need synchronization.\n');
      console.log('Run: node scripts/sync-clients.js sync\n');
    }
  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    process.exit(1);
  }
}

async function syncClient(clientId) {
  try {
    console.log(`\n🔄 Syncing client ID: ${clientId}\n`);

    // Get client data
    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [clientId]
    );

    if (clients.length === 0) {
      console.log('❌ Client not found');
      return;
    }

    const client = clients[0];
    console.log(`Client: ${client.first_name} ${client.last_name} (${client.email})`);

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [client.email, client.tenant_id]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  User already exists for this email');
      return;
    }

    if (!client.email) {
      console.log('❌ Client has no email address');
      return;
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

    console.log(`✅ User account created!`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Password: ${defaultPassword}\n`);
  } catch (error) {
    console.error('❌ Error syncing client:', error);
  }
}

async function syncAllClients(tenantId = 1) {
  try {
    console.log('\n🔄 Syncing all clients...\n');

    const [clientsWithoutUsers] = await pool.execute(
      `SELECT c.* FROM clients c
       LEFT JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE u.id IS NULL AND c.tenant_id = ? AND c.email IS NOT NULL AND c.email != ''`,
      [tenantId]
    );

    if (clientsWithoutUsers.length === 0) {
      console.log('✅ All clients already have user accounts.\n');
      return;
    }

    console.log(`Found ${clientsWithoutUsers.length} clients without user accounts\n`);

    let synced = 0;
    const credentials = [];

    for (const client of clientsWithoutUsers) {
      try {
        // Generate default password
        const defaultPassword = `${client.first_name.substring(0, 4).toLowerCase()}${client.phone.slice(-4)}`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Create user
        await pool.execute(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 'client', true)`,
          [client.tenant_id, client.email, passwordHash, client.first_name, client.last_name, client.phone]
        );

        console.log(`✅ ${client.email} - ${defaultPassword}`);
        credentials.push({ email: client.email, password: defaultPassword });
        synced++;
      } catch (error) {
        console.error(`❌ Failed to sync ${client.email}:`, error.message);
      }
    }

    console.log(`\n✅ Synced ${synced} client(s)\n`);

    if (credentials.length > 0) {
      console.log('📋 Client Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      credentials.forEach(({ email, password }) => {
        console.log(`Email: ${email.padEnd(30)} Password: ${password}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  } catch (error) {
    console.error('❌ Error syncing all clients:', error);
  }
}

async function listClientsWithoutUsers(tenantId = 1) {
  try {
    console.log('\n📋 Clients without user accounts:\n');

    const [clients] = await pool.execute(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.phone
       FROM clients c
       LEFT JOIN users u ON c.email = u.email AND c.tenant_id = u.tenant_id
       WHERE u.id IS NULL AND c.tenant_id = ? AND c.email IS NOT NULL AND c.email != ''
       ORDER BY c.first_name, c.last_name`,
      [tenantId]
    );

    if (clients.length === 0) {
      console.log('✅ All clients have user accounts!\n');
      return;
    }

    console.log('ID | Name                   | Email                    | Phone');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    clients.forEach(client => {
      const name = `${client.first_name} ${client.last_name}`.padEnd(20);
      const email = client.email.padEnd(25);
      console.log(`${client.id.toString().padStart(3)} | ${name} | ${email} | ${client.phone}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total: ${clients.length} client(s) need user accounts\n`);
  } catch (error) {
    console.error('❌ Error listing clients:', error);
  }
}

async function main() {
  const command = process.argv[2] || 'status';

  try {
    switch (command) {
      case 'status':
        await checkSyncStatus();
        break;

      case 'list':
        await listClientsWithoutUsers();
        break;

      case 'sync-all':
        await syncAllClients();
        break;

      case 'sync':
        const clientId = process.argv[3];
        if (!clientId) {
          console.log('❌ Please provide a client ID');
          console.log('Usage: node scripts/sync-clients.js sync <clientId>');
          process.exit(1);
        }
        await syncClient(parseInt(clientId));
        break;

      default:
        console.log('\n📘 Client-User Sync Tool\n');
        console.log('Usage:');
        console.log('  node scripts/sync-clients.js status     - Check sync status');
        console.log('  node scripts/sync-clients.js list       - List clients without users');
        console.log('  node scripts/sync-clients.js sync-all   - Sync all clients');
        console.log('  node scripts/sync-clients.js sync <id>  - Sync specific client\n');
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

