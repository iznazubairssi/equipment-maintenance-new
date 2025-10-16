using { d4iot } from '../db/schema';

service EquipmentService {
    
    @odata.draft.enabled
    entity Equipments as projection on d4iot.Equipments;
    
    entity EquipmentTypes as projection on d4iot.EquipmentTypes;

    action activateEquipment(EQUIPMENT: String(18)) returns String;
    action deactivateEquipment(EQUIPMENT: String(18)) returns String;
}