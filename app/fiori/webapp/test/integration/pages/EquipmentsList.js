sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'equipment.app.fiori',
            componentId: 'EquipmentsList',
            contextPath: '/Equipments'
        },
        CustomPageDefinitions
    );
});