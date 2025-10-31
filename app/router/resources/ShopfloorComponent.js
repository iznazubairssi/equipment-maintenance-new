sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("equipment.app.fiori.ShopfloorComponent", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            
            // Create equipment model
            var oEquipmentModel = new JSONModel({
                equipment: [
                    {
                        EquipmentID: "PRESS-001",
                        Description: "Hydraulic Press", 
                        Status: "P1",
                        LastStatusChange: new Date().toISOString(),
                        EquipmentGroup: "production"
                    },
                    {
                        EquipmentID: "MILL-002",
                        Description: "CNC Milling Machine",
                        Status: "P2", 
                        LastStatusChange: new Date().toISOString(),
                        EquipmentGroup: "production"
                    },
                    {
                        EquipmentID: "LATHE-003", 
                        Description: "Automatic Lathe",
                        Status: "R1",
                        LastStatusChange: new Date().toISOString(),
                        EquipmentGroup: "production"
                    }
                ]
            });
            this.setModel(oEquipmentModel, "equipment");
            
            this.getRouter().initialize();
        }
    });
});