using { managed } from '@sap/cds/common';

namespace d4iot;

/**
 * Existing Equipment entity
 */
entity Equipments : managed {
    key EQUIPMENT            : String(18);
    EQNAME                   : String(40);
    EQDESC                   : String(120);
    EQSTATUS                 : String(1);
    INACTIVE                 : String(1);
    EQUNR_SAP                : String(18);
    STATUSMANACTIVE          : Boolean;
    STATUSSTRUCTURE          : String(20);
    STATUSLOGIC              : String(20);
    ALARMMANACTIVE           : Boolean;
    ALARM2STATUS             : Boolean;
    ALARMSTRUCTURE           : String(20);
    PDATAMANACTIVE           : Boolean;
    PDATASTRUCTURE           : String(20);
    OTACTIVE                 : Boolean;
    OTDAEMON                 : String;
    OTTYPE                   : String;
    LINK                     : String(255);
    LINKTEXT                 : String(40);
    EQTYPE                   : Association to one EquipmentTypes;
}

/**
 * Existing EquipmentTypes entity
 */
entity EquipmentTypes {
    key EQTYPE                   : String(2);
    EQTYPE_DESC              : String(40);
    EQTYPE_HIERARCHY_CAPABLE : Boolean;
    EQTYPE_STATUS_CAPABLE    : Boolean;
}

/**
 * 
 * Table of status types (PROD, IDLE, DOWN, etc.)
 * Includes color definitions 
 */
entity StatusTypes : managed {
    key STATUSTYPE     : String(5);
    STATUSTYPEDESC : String(40);
    COLORHEX       : String(7); // For HEX-Codes
}

/**
 * 
 * Table of possible statuses (P1, R1, M1, etc.)
 * Links to a StatusType 
 */
entity Status : managed {
    key STATUS     : String(4);
    STATUSDESC : String(120);
    STATUSTYPE : Association to StatusTypes;
}

/**
 * 
 * Equipment-Group Hierarchies
 */
entity EquipmentHierarchies : managed {
    key EQUIPMENT     : Association to Equipments; // Parent Group
    key EQUIPMENT_SUB : Association to Equipments; // Child Equipment/Group
    OrderNo       : Integer; // 
}

/**
 * 
 * Current Equipment-Status
 */
entity EquipmentStatus : managed {
    key EQUIPMENT        : Association to Equipments;
    LASTSTATUS       : Association to Status;
    LASTSTATUSCHANGE : Timestamp;
}

/**
 * 
 * Equipment-Status History
 */
entity StatusHistory : managed {
    key EQUIPMENT      : Association to Equipments;
    key TIME           : Timestamp;
    SOURCE         : String(2);
    ORIGINALSTATUS : String(4);
    STATUS         : Association to Status;
    ERRORCODE      : String(5);
    TEXTLINK       : Boolean;
    IGNORERECORD   : String(1);
    LASTSTATUS     : String(4);
    LENGTHMSEC     : Integer64; // 
}