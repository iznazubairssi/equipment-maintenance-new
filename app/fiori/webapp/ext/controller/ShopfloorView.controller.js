sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageToast, DateFormat) {
    "use strict";

    return Controller.extend("equipment.app.fiori.ext.controller.ShopfloorView", {
        onInit: function () {
            var oData = {
                "Groups": [
                    { "key": "ALL", "text": "ALL EQUIPMENT" },
                    { "key": "FILLING", "text": "FILLING MACHINES", "count": 3 },
                    { "key": "LINIE01", "text": "LINIE JG01", "count": 5 }
                ],
                "Equipments": [
                    {
                        "EquipmentID": "OPC-UA DEMO ERL",
                        "Description": "OPC-UA Demo Machine",
                        "Driver": "SENSRY",
                        "Status": "I1",
                        "StatusClass": "sc-type-idle", // Mapped to new CSS
                        "LastChange": new Date()
                    },
                    {
                        "EquipmentID": "CNC-AGH-01",
                        "Description": "CNC Milling Station 1",
                        "Driver": "Z4IOTTEST",
                        "Status": "R1",
                        "StatusClass": "sc-type-down", // Mapped to new CSS
                        "LastChange": new Date(new Date().getTime() - 5000000)
                    },
                    {
                        "EquipmentID": "BESCHR-LASER-02",
                        "Description": "Laser Marking Unit",
                        "Driver": "Z4IOT-DEMO",
                        "Status": "P1",
                        "StatusClass": "sc-type-prod", // Mapped to new CSS
                        "LastChange": new Date(new Date().getTime() - 7200000)
                    }
                ]
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "shopfloor");
        },

        formatDate: function(oDate) {
             var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
             return oFormat.format(oDate);
        },

        onPressRefresh: function() { MessageToast.show("Refreshing..."); },
        onPressOptions: function() { MessageToast.show("Options clicked"); },
        onGroupSelect: function(oEvent) { MessageToast.show("Group: " + oEvent.getParameter("key")); },
        onPressCardAction: function(oEvent) {
             var sAction = oEvent.getSource().data("actionType");
             MessageToast.show("Action: " + sAction);
        }
    });
});