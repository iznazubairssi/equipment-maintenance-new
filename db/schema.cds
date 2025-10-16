using { managed } from '@sap/cds/common';
namespace d4iot;

entity Equipments : managed {
    key EQUIPMENT          : String(18);
    EQNAME                 : String(40);
    EQDESC                 : String(120);
    EQSTATUS               : String(1);
    INACTIVE               : String(1);
    EQUNR_SAP              : String(18);
    STATUSMANACTIVE        : Boolean;
    STATUSSTRUCTURE        : String(20);
    STATUSLOGIC            : String(20);
    ALARMMANACTIVE         : Boolean;
    ALARM2STATUS           : Boolean;
    ALARMSTRUCTURE         : String(20);
    PDATAMANACTIVE         : Boolean;
    PDATASTRUCTURE         : String(20);
    OTACTIVE               : Boolean;
    OTDAEMON               : String;
    OTTYPE                 : String;
    LINK                   : String(255);
    LINKTEXT               : String(40);
    EQTYPE                 : Association to one EquipmentTypes;
}

entity EquipmentTypes {
    key EQTYPE                 : String(2);
    EQTYPE_DESC                : String(40);
    EQTYPE_HIERARCHY_CAPABLE   : Boolean;
    EQTYPE_STATUS_CAPABLE      : Boolean;
}