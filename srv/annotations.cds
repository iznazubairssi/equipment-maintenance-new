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

// Annotations for the Main Equipments Entity
annotate EquipmentService.Equipments with @(
    UI: {
        // List Report Columns
        LineItem: [
            { Value: EQUIPMENT, Label: 'Equipment ID' },
            { Value: EQNAME, Label: 'Equipment Name' },
            { Value: EQDESC, Label: 'Description' },
            { Value: EQTYPE.EQTYPE, Label: 'Type' },
            { Value: INACTIVE, Label: 'Inactive' },
            { Value: EQUNR_SAP, Label: 'SAP Equipment' }
        ],
        
        // List Report Filter Bar
        SelectionFields: [ 
            EQUIPMENT, 
            EQNAME, 
            EQTYPE.EQTYPE,
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
                { Value: EQTYPE.EQTYPE, Label: 'Equipment Type' },
                { Value: INACTIVE, Label: 'Inactive?' },
                { Value: EQUNR_SAP, Label: 'SAP Equipment No.' }
            ]
        },
        FieldGroup#Status: {
            Data: [
                { Value: STATUSMANACTIVE, Label: 'Manual Status Creation Active?' },
                { Value: STATUSSTRUCTURE, Label: 'Status Structure Table' },
                { Value: STATUSLOGIC, Label: 'Status Logic Table' }
            ]
        },
        FieldGroup#Network: {
            Data: [
                { Value: OTACTIVE, Label: 'Network Active?' },
                { Value: OTTYPE, Label: 'Daemon Type' },
                { Value: OTDAEMON, Label: 'Daemon ID' }
            ]
        },
        FieldGroup#Alarm: {
            Data: [
                { Value: ALARMMANACTIVE, Label: 'Manual Alarm Creation Active?' },
                { Value: ALARM2STATUS, Label: 'Alarm 2 Status Active?' },
                { Value: ALARMSTRUCTURE, Label: 'Alarm Structure Table' }
            ]
        },
        FieldGroup#ProcessData: {
            Data: [
                { Value: PDATAMANACTIVE, Label: 'Manual Process Data Creation Active?' },
                { Value: PDATASTRUCTURE, Label: 'Process Data Structure' }
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

annotate EquipmentService.Equipments with {
    EQUIPMENT @Common.FieldControl: #Mandatory;
    EQNAME @Common.FieldControl: #Mandatory;
}

// Annotations for the EquipmentTypes Entity
annotate EquipmentService.EquipmentTypes with @(
    UI: {
        LineItem: [
            { Value: EQTYPE, Label: 'Equipment Type' },
            { Value: EQTYPE_DESC, Label: 'Description' },
            { Value: EQTYPE_STATUS_CAPABLE, Label: 'Status Capable' }
        ],
        SelectionFields: [EQTYPE, EQTYPE_DESC]
    }
);
