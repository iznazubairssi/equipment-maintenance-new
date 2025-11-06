using EquipmentService from './service';

// Enable Create, Update, and Delete buttons in the UI
annotate EquipmentService.Equipments with @(
    UI: {
        DeleteHidden: false,
        CreateHidden: false, 
        UpdateHidden: false
    },
    Capabilities: {
        Insertable: true,
        Updatable: true, 
        Deletable: true
    }
);

annotate EquipmentService.Equipments with @(
    UI: {
        // List Report Columns
        LineItem: [
            { Value: EQUIPMENT, Label: 'Equipment ID' },
            { Value: EQNAME, Label: 'Equipment Name' },
            { Value: EQDESC, Label: 'Description' },
            { Value: EQSTATUS, Label: 'Status' },
            { Value: EQTYPE.EQTYPE_DESC, Label: 'Eq. Type' },
            { Value: INACTIVE, Label: 'Inactive' },
            { Value: EQUNR_SAP, Label: 'SAP Equipment' },
            { Value: STATUSSTRUCTURE, Label: 'Status Tab' },
            { Value: ALARM2STATUS, Label: 'Alarm 2 Status' },
            { Value: PDATASTRUCTURE, Label: 'PData Config' },
            { Value: OTTYPE, Label: 'Daemon Type' }
        ],
        
        // List Report Filter Bar
        SelectionFields: [ 
            EQUIPMENT, 
            EQNAME,
            EQDESC,
            EQTYPE_EQTYPE,
            EQSTATUS,
            INACTIVE,
            EQUNR_SAP
        ],
        
        HeaderInfo: {
            TypeName: 'Equipment',
            TypeNamePlural: 'Equipments',
            Title: { Value: EQNAME },
            Description: { Value: EQUIPMENT }
        },
        
        Identification: [
            { Value: EQUIPMENT },
            { Value: EQNAME },
            { Value: EQDESC }
        ],
        
        // Object detail page
        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'General',
                ID: 'General',
                Facets: [
                    { $Type: 'UI.ReferenceFacet', Label: 'Equipment Data', Target: '@UI.FieldGroup#General' }
                ]
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Status and Network',
                ID: 'StatusNetwork',
                Facets: [
                    { $Type: 'UI.ReferenceFacet', Label: 'Status Creation', Target: '@UI.FieldGroup#Status' },
                    { $Type: 'UI.ReferenceFacet', Label: 'Network', Target: '@UI.FieldGroup#Network' }
                ]
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Alarm and Process Data',
                ID: 'AlarmProcessData',
                Facets: [
                    { $Type: 'UI.ReferenceFacet', Label: 'Alarm Settings', Target: '@UI.FieldGroup#Alarm' },
                    { $Type: 'UI.ReferenceFacet', Label: 'Process Data Settings', Target: '@UI.FieldGroup#ProcessData' }
                ]
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Links and Admin',
                ID: 'LinksAdmin',
                Facets: [
                    { $Type: 'UI.ReferenceFacet', Label: 'External Links', Target: '@UI.FieldGroup#Links' },
                    { $Type: 'UI.ReferenceFacet', Label: 'Admin Data', Target: '@UI.FieldGroup#Admin' }
                ]
            }
        ],

        FieldGroup#General: {
            Data: [
                { Value: EQUIPMENT, Label: 'Equipment ID' },
                { Value: EQNAME, Label: 'Equipment Name' },
                { Value: EQDESC, Label: 'Description' },
                { Value: EQTYPE_EQTYPE, Label: 'Equipment Type' },
                { Value: INACTIVE, Label: 'Inactive?' },
                { Value: EQUNR_SAP, Label: 'SAP Equipment No.' }
            ]
        },
        FieldGroup#Status: {
            Data: [
                { Value: EQSTATUS, Label: 'Equipment Status' },
                { Value: STATUSMANACTIVE, Label: 'Manual Status Creation Active?' },
                { Value: STATUSSTRUCTURE, Label: 'Status Tab' },
                { Value: STATUSLOGIC, Label: 'Exclusion Tab' }
            ]
        },
        FieldGroup#Network: {
            Data: [
                { Value: OTACTIVE, Label: 'Network Active?' },
                { Value: OTDAEMON, Label: 'DaemonID' },
                { Value: OTTYPE, Label: 'DaemonType' }
            ]
        },
        FieldGroup#Alarm: {
            Data: [
                { Value: ALARMMANACTIVE, Label: 'Manual Alarm Creation Active?' },
                { Value: ALARM2STATUS, Label: 'Alarm 2 Status' },
                { Value: ALARMSTRUCTURE, Label: 'Alarm Structure Table' }
            ]
        },
        FieldGroup#ProcessData: {
            Data: [
                { Value: PDATAMANACTIVE, Label: 'Manual Process Data Creation Active?' },
                { Value: PDATASTRUCTURE, Label: 'ProcessDataTab' }
            ]
        },
        FieldGroup#Links: {
            Data: [
                { Value: LINKTEXT, Label: 'Link Text' },
                { Value: LINK, Label: 'Link URL' }
            ]
        },
        FieldGroup#Admin: {
            Data: [
                { Value: createdBy, Label: 'Created By' },
                { Value: createdAt, Label: 'Created At' },
                { Value: modifiedBy, Label: 'Changed By' },
                { Value: modifiedAt, Label: 'Changed On' }
            ]
        }
    }
);

// Field control annotations
annotate EquipmentService.Equipments with {
    EQUIPMENT @Common.FieldControl: #Mandatory;
    EQNAME @Common.FieldControl: #Mandatory;
    EQTYPE_EQTYPE @Common.FieldControl: #Mandatory;
};

// Text annotation to show description instead of code
annotate EquipmentService.Equipments with {
    EQTYPE_EQTYPE @(
        Common.Text: EQTYPE.EQTYPE_DESC,
        Common.TextArrangement: #TextOnly
    );
};

// ValueList annotation for dropdown
annotate EquipmentService.Equipments with {
    EQTYPE_EQTYPE @(
        Common.ValueList: {
            CollectionPath: 'EquipmentTypes',
            Parameters: [
                { 
                    $Type: 'Common.ValueListParameterInOut', 
                    LocalDataProperty: EQTYPE_EQTYPE, 
                    ValueListProperty: 'EQTYPE' 
                },
                { 
                    $Type: 'Common.ValueListParameterDisplayOnly', 
                    ValueListProperty: 'EQTYPE_DESC' 
                }
            ]
        },
        Common.ValueListWithFixedValues: true
    );
};

// --- EQUIPMENT TYPES ANNOTATIONS ---
annotate EquipmentService.EquipmentTypes with @(
    UI: {
        LineItem: [
            { Value: EQTYPE, Label: 'Equipment Type' },
            { Value: EQTYPE_DESC, Label: 'Description' },
            { Value: EQTYPE_HIERARCHY_CAPABLE, Label: 'Hierarchy Capable'},
            { Value: EQTYPE_STATUS_CAPABLE, Label: 'Status Capable' }
        ],
        SelectionFields: [EQTYPE, EQTYPE_DESC],
        HeaderInfo: {
            TypeName: 'Equipment Type',
            TypeNamePlural: 'Equipment Types',
            Title: { Value: EQTYPE_DESC },
            Description: { Value: EQTYPE }
        },
        Identification: [
            { Value: EQTYPE },
            { Value: EQTYPE_DESC }
        ]
    },
    Capabilities: { 
        Insertable: true, 
        Updatable: true, 
        Deletable: true 
    }
);

// Make sure EquipmentTypes has proper field controls
annotate EquipmentService.EquipmentTypes with {
    EQTYPE @Common.FieldControl: #Mandatory;
    EQTYPE_DESC @Common.FieldControl: #Mandatory;
};

// Add text annotation for EquipmentTypes
annotate EquipmentService.EquipmentTypes with {
    EQTYPE @(
        Common.Text: EQTYPE_DESC,
        Common.TextArrangement: #TextFirst
    );
};

// --- OTHER ENTITIES ANNOTATIONS ---

annotate EquipmentService.StatusTypes with @(
    UI: {
        LineItem: [
            { Value: STATUSTYPE, Label: 'Status Type' },
            { Value: STATUSTYPEDESC, Label: 'Description' },
            { Value: COLORHEX, Label: 'Color Code' }
        ],
        SelectionFields: [STATUSTYPE, STATUSTYPEDESC],
        HeaderInfo: {
            TypeName: 'Status Type',
            TypeNamePlural: 'Status Types',
            Title: { Value: STATUSTYPEDESC },
            Description: { Value: STATUSTYPE }
        },
        Identification: [
            { Value: STATUSTYPE },
            { Value: STATUSTYPEDESC }
        ]
    },
    Capabilities: { Insertable: true, Updatable: true, Deletable: true }
);

annotate EquipmentService.Status with @(
    UI: {
        LineItem: [
            { Value: STATUS, Label: 'Status Code' },
            { Value: STATUSDESC, Label: 'Description' },
            { Value: STATUSTYPE.STATUSTYPE, Label: 'Status Type' }
        ],
        SelectionFields: [STATUS, STATUSDESC, STATUSTYPE_STATUSTYPE],
        HeaderInfo: {
            TypeName: 'Status',
            TypeNamePlural: 'Statuses',
            Title: { Value: STATUSDESC },
            Description: { Value: STATUS }
        },
        Identification: [
            { Value: STATUS },
            { Value: STATUSDESC }
        ]
    },
    Capabilities: { Insertable: true, Updatable: true, Deletable: true }
);

annotate EquipmentService.EquipmentHierarchies with @(
    UI: {
        LineItem: [
            { Value: EQUIPMENT.EQNAME, Label: 'Parent Group' },
            { Value: EQUIPMENT_SUB.EQNAME, Label: 'Child Equipment' },
            { Value: OrderNo, Label: 'Sort Order' }
        ],
        SelectionFields: [EQUIPMENT_EQUIPMENT, EQUIPMENT_SUB_EQUIPMENT],
        HeaderInfo: {
            TypeName: 'Hierarchy',
            TypeNamePlural: 'Hierarchies',
            Title: { Value: EQUIPMENT.EQNAME },
            Description: { Value: EQUIPMENT_SUB.EQNAME }
        }
    },
    Capabilities: { Insertable: true, Updatable: true, Deletable: true }
);

annotate EquipmentService.EquipmentStatus with @(
    UI: {
        LineItem: [
            { Value: EQUIPMENT.EQNAME, Label: 'Equipment' },
            { Value: LASTSTATUS.STATUS, Label: 'Last Status' },
            { Value: LASTSTATUSCHANGE, Label: 'Last Change' }
        ],
        SelectionFields: [EQUIPMENT_EQUIPMENT, LASTSTATUS_STATUS],
        HeaderInfo: {
            TypeName: 'Current Status',
            TypeNamePlural: 'Current Statuses',
            Title: { Value: EQUIPMENT.EQNAME }
        }
    },
    Capabilities: { Insertable: true, Updatable: true, Deletable: true }
);

annotate EquipmentService.StatusHistory with @(
    UI: {
        LineItem: [
            { Value: EQUIPMENT.EQNAME, Label: 'Equipment' },
            { Value: TIME, Label: 'Timestamp' },
            { Value: STATUS.STATUS, Label: 'Status' },
            { Value: LENGTHMSEC, Label: 'Duration (ms)' },
            { Value: SOURCE, Label: 'Source' }
        ],
        SelectionFields: [EQUIPMENT_EQUIPMENT, STATUS_STATUS, SOURCE],
        HeaderInfo: {
            TypeName: 'Status History',
            TypeNamePlural: 'Status Histories',
            Title: { Value: EQUIPMENT.EQNAME }
        }
    },
    Capabilities: { Insertable: true, Updatable: true, Deletable: true }
);