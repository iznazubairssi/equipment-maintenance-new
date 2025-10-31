sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("equipment.app.fiori.controller.Shopfloor", {
        
        onInit: function() {
            console.log("✅ Shopfloor controller initialized - STATIC CARDS");
            MessageToast.show("Shopfloor loaded with 3 equipment cards");
        },

        onNavBack: function() {
            window.history.back();
        },

        onGroupTabSelect: function(oEvent) {
            var sKey = oEvent.getParameter("selectedKey");
            MessageToast.show("Showing equipment group: " + sKey);
        },

        onShowDocumentation: function() {
            MessageBox.information("Program documentation would open here");
        },

        // Card 1 Actions
        onCard1Status: function() {
            MessageBox.show("Change status for PRESS-001 - Hydraulic Press", {
                title: "Equipment Status",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        MessageToast.show("Status updated for PRESS-001");
                    }
                }
            });
        },

        onCard1Alarm: function() {
            MessageBox.information("Alarm details for: PRESS-001 - Hydraulic Press");
        },

        onCard1Data: function() {
            MessageBox.information("Process data for: PRESS-001 - Hydraulic Press");
        },

        // Card 2 Actions
        onCard2Status: function() {
            MessageBox.show("Change status for MILL-002 - CNC Milling Machine", {
                title: "Equipment Status",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        MessageToast.show("Status updated for MILL-002");
                    }
                }
            });
        },

        onCard2Alarm: function() {
            MessageBox.information("Alarm details for: MILL-002 - CNC Milling Machine");
        },

        onCard2Data: function() {
            MessageBox.information("Process data for: MILL-002 - CNC Milling Machine");
        },

        // Card 3 Actions
        onCard3Status: function() {
            MessageBox.show("Change status for LATHE-003 - Automatic Lathe", {
                title: "Equipment Status",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        MessageToast.show("Status updated for LATHE-003");
                    }
                }
            });
        },

        onCard3Alarm: function() {
            MessageBox.information("Alarm details for: LATHE-003 - Automatic Lathe");
        },

        onCard3Data: function() {
            MessageBox.information("Process data for: LATHE-003 - Automatic Lathe");
        }
    });
});