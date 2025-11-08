using { d4iot } from '../db/schema';

@path: 'EquipmentService'
service EquipmentService {

    @odata.draft.enabled
    entity Equipments as projection on d4iot.Equipments;
    entity EquipmentTypes as projection on d4iot.EquipmentTypes;
    entity StatusTypes as projection on d4iot.StatusTypes;
    entity Status as projection on d4iot.Status;
    entity EquipmentHierarchies as projection on d4iot.EquipmentHierarchies;
    entity EquipmentStatus as projection on d4iot.EquipmentStatus;
    entity StatusHistory as projection on d4iot.StatusHistory;

    action activateEquipment(EQUIPMENT: String(18)) returns String;
    action deactivateEquipment(EQUIPMENT: String(18)) returns String;
}
