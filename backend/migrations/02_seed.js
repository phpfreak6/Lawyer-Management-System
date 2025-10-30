const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Check if default tenant exists, if not create it
    console.log('📦 Checking tenants...');
    
    let [existingTenants] = await pool.execute('SELECT id FROM tenants LIMIT 1');
    
    let tenantId;
    if (existingTenants.length > 0) {
      tenantId = existingTenants[0].id;
      console.log('✓ Using existing tenant:', tenantId);
    } else {
      // Create default tenant
      const [insertResult] = await pool.execute(
        `INSERT INTO tenants (name, domain, subscription_tier, max_users)
         VALUES (?, ?, ?, ?)`,
        ['Law Firm Associates', 'lawfirm', 'premium', 50]
      );
      tenantId = insertResult.insertId;
      console.log('✓ Created tenant:', tenantId);
    }

    // Check if users already exist to avoid duplicate seeding
    const [existingUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE email IN (?, ?, ?, ?)',
      ['admin@lawfirm.com', 'lawyer@lawfirm.com', 'paralegal@lawfirm.com', 'client@lawfirm.com']
    );

    if (existingUsers[0].count > 0) {
      console.log('⚠️  Seed data already exists! Users with these emails found.');
      console.log('   To re-seed, you may want to clear existing data first.');
      console.log('   Skipping seed...');
      process.exit(0);
    }

    // 2. Create users (lawyers, paralegals, admin)
    console.log('👥 Creating users...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const [adminResult] = await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'admin@lawfirm.com', passwordHash, 'Admin', 'User', '9876543210', 'admin', true]
    );
    const adminId = adminResult.insertId;

    const lawyerPasswordHash = await bcrypt.hash('lawyer123', 10);
    const [lawyerResult] = await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'lawyer@lawfirm.com', lawyerPasswordHash, 'Rajesh', 'Kumar', '9876543211', 'lawyer', true]
    );
    const lawyerId = lawyerResult.insertId;

    const paralegalPasswordHash = await bcrypt.hash('paralegal123', 10);
    const [paralegalResult] = await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'paralegal@lawfirm.com', paralegalPasswordHash, 'Priya', 'Sharma', '9876543212', 'paralegal', true]
    );
    const paralegalId = paralegalResult.insertId;

    // Create client user
    const clientPasswordHash = await bcrypt.hash('client123', 10);
    const [clientUserResult] = await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'client@lawfirm.com', clientPasswordHash, 'Amit', 'Singh', '9876543213', 'client', true]
    );
    const clientUserId = clientUserResult.insertId;

    console.log('✓ Created users:', { adminId, lawyerId, paralegalId, clientUserId });

    // 3. Create clients
    console.log('👤 Creating clients...');
    const clientIds = [];

    // First client - matches client user (email: client@lawfirm.com)
    const [client1Result] = await pool.execute(
      `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, address, city, state, pincode, 
        date_of_birth, pan_number, aadhar_number, occupation, status, assigned_to, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'Amit', 'Singh', 'client@lawfirm.com', '9876512345', 
       '123 Main Street', 'Delhi', 'Delhi', '110001', '1985-03-15', 'ABCDE1234F', '1234-5678-9012', 
       'Business Owner', 'active', lawyerId, clientUserId]
    );
    clientIds.push(client1Result.insertId);

    // Second client - existing client (email: amit.singh@email.com)
    const [client2Result] = await pool.execute(
      `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, address, city, state, pincode,
        date_of_birth, pan_number, occupation, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'Sunita', 'Gupta', 'sunita.gupta@email.com', '9876512346',
       '456 Park Avenue', 'Mumbai', 'Maharashtra', '400001', '1990-07-22', 'FGHIJ5678K',
       'Software Engineer', 'active', lawyerId]
    );
    clientIds.push(client2Result.insertId);

    const [client3Result] = await pool.execute(
      `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, address, city, state, pincode,
        date_of_birth, pan_number, occupation, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'Vikram', 'Patel', 'vikram.patel@email.com', '9876512347',
       '789 Corporate Tower', 'Bangalore', 'Karnataka', '560001', '1990-07-22', 'FGHIJ5678K', 'Doctor', 'active', lawyerId]
    );
    clientIds.push(client3Result.insertId);

    console.log('✓ Created clients:', clientIds);

    // 4. Create cases
    console.log('📁 Creating cases...');
    const caseIds = [];

    const [case1Result] = await pool.execute(
      `INSERT INTO cases (tenant_id, case_number, client_id, cnr_number, court_name, court_type, case_type,
        case_stage, subject, description, filing_date, next_hearing_date, priority, assigned_to, billing_rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'CASE-2024-001', clientIds[0], 'CNR-DL-2024-001234', 'Delhi High Court', 'High Court',
       'Civil', 'hearing', 'Breach of Contract', 'Dispute regarding commercial contract breach between parties',
       '2024-01-15', '2024-12-20 10:00:00', 'high', lawyerId, 5000.00, 'active']
    );
    caseIds.push(case1Result.insertId);

    const [case2Result] = await pool.execute(
      `INSERT INTO cases (tenant_id, case_number, client_id, court_name, court_type, case_type,
        case_stage, subject, description, filing_date, priority, assigned_to, billing_rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'CASE-2024-002', clientIds[1], 'Mumbai District Court', 'District Court', 'Criminal',
       'filing', 'Fraud Complaint', 'Client is victim of financial fraud, seeking legal recourse',
       '2024-02-10', 'urgent', lawyerId, 4500.00, 'active']
    );
    caseIds.push(case2Result.insertId);

    const [case3Result] = await pool.execute(
      `INSERT INTO cases (tenant_id, case_number, client_id, court_name, case_type,
        case_stage, subject, filing_date, priority, assigned_to, billing_rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'CASE-2024-003', clientIds[2], 'Bangalore City Civil Court', 'Civil',
       'judgment', 'Property Dispute',
       '2023-12-01', 'medium', lawyerId, 5500.00, 'active']
    );
    caseIds.push(case3Result.insertId);

    console.log('✓ Created cases:', caseIds);

    // 5. Create tasks
    console.log('✅ Creating tasks...');
    
    await pool.execute(
      `INSERT INTO tasks (tenant_id, case_id, title, description, task_type, priority, status,
        due_date, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, caseIds[0], 'Prepare hearing documents', 'Gather all documents for upcoming hearing',
       'filing', 'high', 'pending', '2024-12-18 14:00:00', paralegalId]
    );

    await pool.execute(
      `INSERT INTO tasks (tenant_id, case_id, title, task_type, priority, status,
        due_date, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, caseIds[1], 'File FIR copy', 'filing', 'urgent', 'in_progress',
       '2024-12-15 10:00:00', paralegalId]
    );

    await pool.execute(
      `INSERT INTO tasks (tenant_id, client_id, title, task_type, priority, status,
        due_date, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, clientIds[2], 'Client consultation', 'meeting', 'medium', 'completed',
       '2024-12-10 15:00:00', lawyerId]
    );

    console.log('✓ Created tasks');

    // 6. Create calendar events
    console.log('📅 Creating calendar events...');
    
    await pool.execute(
      `INSERT INTO calendar_events (tenant_id, user_id, case_id, title, description, event_type,
        start_datetime, end_datetime, location, reminder_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, lawyerId, caseIds[0], 'Hearing - Case Number: CASE-2024-001',
       'Court hearing for breach of contract case', 'hearing',
       '2024-12-20 10:00:00', '2024-12-20 11:30:00', 'Delhi High Court, Court Room 3', 60]
    );

    await pool.execute(
      `INSERT INTO calendar_events (tenant_id, user_id, case_id, title, event_type,
        start_datetime, end_datetime, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, lawyerId, caseIds[1], 'FIR Filing - Case Number: CASE-2024-002',
       'deadline', '2024-12-15 10:00:00', '2024-12-15 12:00:00', 'Mumbai Police Station']
    );

    console.log('✓ Created calendar events');

    // 7. Create billing records
    console.log('💰 Creating billing records...');
    
    const [invoice1Result] = await pool.execute(
      `INSERT INTO billing_records (tenant_id, case_id, client_id, invoice_number,
        billable_hours, hourly_rate, expenses, subtotal, gst_percentage, gst_amount, total_amount,
        payment_status, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, caseIds[0], clientIds[0], 'INV-2024-001',
       8.5, 5000.00, 2500.00, 45000.00, 18.00, 8100.00, 53100.00,
       'pending', '2024-12-31', lawyerId]
    );
    const invoice1Id = invoice1Result.insertId;

    const [invoice2Result] = await pool.execute(
      `INSERT INTO billing_records (tenant_id, case_id, client_id, invoice_number,
        billable_hours, hourly_rate, expenses, subtotal, gst_percentage, gst_amount, total_amount,
        payment_status, paid_amount, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, caseIds[1], clientIds[1], 'INV-2024-002',
       5.0, 4500.00, 1500.00, 24000.00, 18.00, 4320.00, 28320.00,
       'partial', 15000.00, '2024-12-25', lawyerId]
    );
    const invoice2Id = invoice2Result.insertId;

    const [invoice3Result] = await pool.execute(
      `INSERT INTO billing_records (tenant_id, case_id, client_id, invoice_number,
        billable_hours, hourly_rate, expenses, subtotal, gst_percentage, gst_amount, total_amount,
        payment_status, payment_method, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, caseIds[2], clientIds[2], 'INV-2024-003',
       12.0, 5500.00, 5000.00, 71000.00, 18.00, 12780.00, 83780.00,
       'paid', 'online', '2024-12-10', lawyerId]
    );
    const invoice3Id = invoice3Result.insertId;

    console.log('✓ Created invoices:', { invoice1Id, invoice2Id, invoice3Id });

    // 8. Create time entries
    console.log('⏱️ Creating time entries...');
    
    await pool.execute(
      `INSERT INTO time_entries (case_id, user_id, date, hours, description, billing_record_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caseIds[0], lawyerId, '2024-12-01', 2.5, 'Client consultation and case review', invoice1Id]
    );

    await pool.execute(
      `INSERT INTO time_entries (case_id, user_id, date, hours, description, billing_record_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caseIds[0], lawyerId, '2024-12-03', 3.0, 'Document preparation and filing', invoice1Id]
    );

    console.log('✓ Created time entries');

    // 9. Create expenses
    console.log('💸 Creating expenses...');
    
    await pool.execute(
      `INSERT INTO expenses (case_id, description, amount, expense_type, date_incurred, billing_record_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [caseIds[0], 'Court filing fee', 1500.00, 'court_fee', '2024-12-01', invoice1Id, lawyerId]
    );

    await pool.execute(
      `INSERT INTO expenses (case_id, description, amount, expense_type, date_incurred, billing_record_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [caseIds[0], 'Travel and conveyance', 1000.00, 'travel', '2024-12-02', invoice1Id, lawyerId]
    );

    console.log('✓ Created expenses');

    // 10. Create communication logs
    console.log('📞 Creating communication logs...');
    
    await pool.execute(
      `INSERT INTO communication_logs (tenant_id, client_id, case_id, communication_type,
        direction, subject, content, sent_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, clientIds[0], caseIds[0], 'email',
       'outgoing', 'Case update', 'Updated on case progress and next hearing date', lawyerId]
    );

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 Tenant created`);
    console.log(`   - 4 Users created (admin, lawyer, paralegal, client)`);
    console.log(`   - 4 Clients created`);
    console.log(`   - 3 Cases created`);
    console.log(`   - 3 Tasks created`);
    console.log(`   - 2 Calendar events created`);
    console.log(`   - 3 Invoices created`);
    console.log(`   - 2 Time entries created`);
    console.log(`   - 2 Expenses created`);
    console.log(`   - 1 Communication log created`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: admin@lawfirm.com / admin123');
    console.log('   Lawyer: lawyer@lawfirm.com / lawyer123');
    console.log('   Paralegal: paralegal@lawfirm.com / paralegal123');
    console.log('   Client: client@lawfirm.com / client123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
