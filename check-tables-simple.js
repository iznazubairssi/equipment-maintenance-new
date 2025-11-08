const { Client } = require('pg');

const connectionConfig = {
    host: 'postgres-52b7528a-d516-4022-b4e1-1c8251319f5e.cqryblsdrbcs.us-east-1.rds.amazonaws.com',
    port: 5978,
    database: 'KIjBokCDvBCA',
    user: '5499c106821f',
    password: '0a760cc354e57548a',
    ssl: {
        rejectUnauthorized: false  // Try without strict SSL verification first
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000
};

async function checkDatabase() {
    const client = new Client(connectionConfig);
    
    try {
        console.log('🔄 Attempting to connect to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL database\n');

        // List all tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 ALL TABLES:');
        console.log('==============');
        if (tablesResult.rows.length === 0) {
            console.log('No tables found in the database');
        } else {
            tablesResult.rows.forEach((table, index) => {
                console.log(`${index + 1}. ${table.table_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.log('💡 Troubleshooting tips:');
        console.log('  - Check if PostgreSQL service is running');
        console.log('  - Verify credentials are correct');
        console.log('  - Check network connectivity from BAS to AWS RDS');
    } finally {
        await client.end();
        console.log('\n🔌 Connection closed');
    }
}

checkDatabase();