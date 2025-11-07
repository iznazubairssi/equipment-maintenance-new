sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"equipment/app/fiori/test/integration/pages/EquipmentsList",
	"equipment/app/fiori/test/integration/pages/EquipmentsObjectPage"
], function (JourneyRunner, EquipmentsList, EquipmentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('equipment/app/fiori') + '/test/flp.html#app-preview',
        pages: {
			onTheEquipmentsList: EquipmentsList,
			onTheEquipmentsObjectPage: EquipmentsObjectPage
        },
        async: true
    });

    return runner;
});

