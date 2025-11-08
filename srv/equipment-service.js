const cds = require('@sap/cds')

module.exports = class EquipmentService extends cds.ApplicationService {
    
    async init() {
        console.log('🔄 Starting Equipment Service...')
        
        
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
};