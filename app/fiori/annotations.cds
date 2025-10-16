using EquipmentService as service from '../../srv/service';
annotate service.Equipments with {
    EQTYPE @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'EquipmentTypes',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : EQTYPE_EQTYPE,
                ValueListProperty : 'EQTYPE',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'EQTYPE_DESC',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'EQTYPE_HIERARCHY_CAPABLE',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'EQTYPE_STATUS_CAPABLE',
            },
        ],
    }
};

