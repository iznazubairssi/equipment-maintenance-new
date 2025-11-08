using { d4iot } from '../db/schema';

@path: 'EquipmentService'
service EquipmentService {

    @odata.draft.enabled
    entity Equipments as projection on d4iot.Equipments;

    entity EquipmentTypes as projection on d4iot.EquipmentTypes;
    entity EquipmentHierarchies as projection on d4iot.EquipmentHierarchies;

    action activateEquipment(EQUIPMENT: String(18)) returns String;
    action deactivateEquipment(EQUIPMENT: String(18)) returns String;
}