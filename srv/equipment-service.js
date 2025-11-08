const cds = require('@sap/cds');
const { initializeStatusData } = require('./lib/init-data');

module.exports = class EquipmentService extends cds.ApplicationService {
    
    async init() {
        console.log('🔧 Starting Equipment Service...');

        const { 
            Equipments, 
            StatusTypes, 
            Status, 
            EquipmentHierarchies, 
            EquipmentStatus, 
            StatusHistory 
        } = this.entities;

        // Auto-deploy database schema to PostgreSQL
        await this.deployDatabaseSchema();

        const managedEntities = [
            Equipments, 
            StatusTypes, 
            Status, 
            EquipmentHierarchies, 
            EquipmentStatus, 
            StatusHistory
        ];

        this.before(['CREATE', 'UPDATE'], managedEntities, (req) => {
            const user = req.user.id || 'anonymous';
            
            if (req.event === 'CREATE') {
                req.data.createdBy = user;
            }
            if (req.event === 'CREATE' || req.event === 'UPDATE') {
                req.data.modifiedBy = user;
            }
        });

        this.before('CREATE', 'Equipments', (req) => {
            if (req.data.EQUIPMENT) {
                req.data.EQUIPMENT = req.data.EQUIPMENT.toUpperCase();
                console.log(`👤 User action by: ${req.user.id || 'anonymous'} for Equipment ${req.data.EQUIPMENT}`);
            }
        });

        this.before('CREATE', 'StatusHistory', async (req) => {
            if (req.data.EQUIPMENT_EQUIPMENT) {
                const previousStatus = await SELECT.one
                    .from(StatusHistory)
                    .where({ EQUIPMENT_EQUIPMENT: req.data.EQUIPMENT_EQUIPMENT })
                    .orderBy({ TIME: 'desc' });

                if (previousStatus && req.data.TIME) {
                    const prevTime = new Date(previousStatus.TIME).getTime();
                    const currTime = new Date(req.data.TIME).getTime();
                    previousStatus.LENGTHMSEC = currTime - prevTime;

                    await UPDATE(StatusHistory)
                        .where({ 
                            EQUIPMENT_EQUIPMENT: previousStatus.EQUIPMENT_EQUIPMENT,
                            TIME: previousStatus.TIME 
                        })
                        .with({ LENGTHMSEC: previousStatus.LENGTHMSEC });
                }
            }
        });

        this.after('CREATE', 'StatusHistory', async (data, req) => {
            const { EQUIPMENT_EQUIPMENT, STATUS_STATUS, TIME } = data;
            
            const existing = await SELECT.one
                .from(EquipmentStatus)
                .where({ EQUIPMENT_EQUIPMENT });

            if (existing) {
                await UPDATE(EquipmentStatus)
                    .where({ EQUIPMENT_EQUIPMENT })
                    .with({ 
                        LASTSTATUS_STATUS: STATUS_STATUS,
                        LASTSTATUSCHANGE: TIME 
                    });
            } else {
                await INSERT.into(EquipmentStatus).entries({
                    EQUIPMENT_EQUIPMENT,
                    LASTSTATUS_STATUS: STATUS_STATUS,
                    LASTSTATUSCHANGE: TIME
                });
            }
        });

        this.on('activateEquipment', async (req) => {
            const { EQUIPMENT } = req.data;
            await UPDATE(Equipments).where({ EQUIPMENT })
                .with({ INACTIVE: '' });
            return `Equipment ${EQUIPMENT} activated`;
        });

        this.on('deactivateEquipment', async (req) => {
            const { EQUIPMENT } = req.data;
            await UPDATE(Equipments).where({ EQUIPMENT })
                .with({ INACTIVE: 'X' });
            return `Equipment ${EQUIPMENT} deactivated`;
        });

        await super.init();
    }

    async deployDatabaseSchema() {
        try {
            console.log('🔗 Connecting to PostgreSQL...');
            const db = await cds.connect.to('db');
            
            await db.run('SELECT 1 as test');
            console.log('✅ Database connection test passed');
            
            const tables = await db.run(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND (
                    table_name LIKE 'd4iot_equipments' OR 
                    table_name LIKE 'd4iot_equipmenttypes' OR
                    table_name LIKE 'd4iot_statustypes' OR
                    table_name LIKE 'd4iot_status' OR
                    table_name LIKE 'd4iot_equipmenthierarchies' OR
                    table_name LIKE 'd4iot_equipmentstatus' OR
                    table_name LIKE 'd4iot_statushistory'
                )
            `);
            
            if (tables.length < 7) {
                console.log('🔄 Deploying database schema to PostgreSQL...');
                await cds.deploy('./gen/db').to('db');
                console.log('✅ Database schema deployed successfully');
                
                await initializeStatusData(db);
            } else {
                console.log('✅ Database tables already exist:', tables.map(t => t.table_name));
            }
            
        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
        }
    }
};
