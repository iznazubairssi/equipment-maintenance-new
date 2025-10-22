const cds = require('@sap/cds')

module.exports = class EquipmentService extends cds.ApplicationService {
    
    async init() {
        console.log('🔄 Starting Equipment Service...')
        
        // Auto-deploy database schema to PostgreSQL
        await this.deployDatabaseSchema();
        
        // Fix user information for createdBy/modifiedBy
        this.before(['CREATE', 'UPDATE'], 'Equipments', (req) => {
            if (req.data.EQUIPMENT) {
                req.data.EQUIPMENT = req.data.EQUIPMENT.toUpperCase();
            }
            
            // Get user from request context
            const user = req.user.id || 'anonymous';
            console.log(`👤 User action by: ${user}`);
            
            if (req.event === 'CREATE') {
                req.data.createdBy = user;
            }
            if (req.event === 'CREATE' || req.event === 'UPDATE') {
                req.data.modifiedBy = user;
            }
        });

        this.on('activateEquipment', async (req) => {
            const { EQUIPMENT } = req.data;
            await UPDATE(this.entities.Equipments).where({ EQUIPMENT })
                .with({ INACTIVE: '' });
            return `Equipment ${EQUIPMENT} activated`;
        });

        this.on('deactivateEquipment', async (req) => {
            const { EQUIPMENT } = req.data;
            await UPDATE(this.entities.Equipments).where({ EQUIPMENT })
                .with({ INACTIVE: 'X' });
            return `Equipment ${EQUIPMENT} deactivated`;
        });

        await super.init();
    }

    async deployDatabaseSchema() {
        try {
            console.log('🔗 Connecting to PostgreSQL...');
            const db = await cds.connect.to('db');
            
            // Test connection
            await db.run('SELECT 1 as test');
            console.log('✅ Database connection test passed');
            
            // Check if tables already exist
            const tables = await db.run(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND (table_name LIKE 'd4iot_equipments' OR table_name LIKE 'd4iot_equipmenttypes')
            `);
            
            if (tables.length === 0) {
                console.log('🔄 Deploying database schema to PostgreSQL...');
                await cds.deploy('./gen/db').to('db');
                console.log('✅ Database schema deployed successfully');
            } else {
                console.log('✅ Database tables already exist:', tables.map(t => t.table_name));
            }
            
        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
        }
    }
};