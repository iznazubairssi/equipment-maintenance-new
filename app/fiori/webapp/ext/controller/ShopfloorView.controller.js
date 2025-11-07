sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (Controller, JSONModel, MessageToast, MessageBox, DateFormat, Filter, FilterOperator, Sorter) {
    "use strict";

    return Controller.extend("equipment.app.fiori.ext.controller.ShopfloorView", {
        onInit: function () {
            var oViewModel = new JSONModel({
                selectedGroup: "ALL",
                isLoading: false,
                lastRefresh: new Date()
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Options model for auto-refresh settings
            var oOptionsModel = new JSONModel({
                autoRefreshEnabled: true,
                refreshInterval: 60 // Default 60 seconds
            });
            this.getView().setModel(oOptionsModel, "optionsModel");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ShopfloorViewRoute").attachPatternMatched(this._onRouteMatched, this);

            // Global function for status pill selection
            window.selectStatus = function(event) {
                var statusCode = event.currentTarget.getAttribute('data-status-code');
                console.log("Status pill clicked:", statusCode);
                
                var oView = sap.ui.getCore().byId("__component0---ShopfloorViewView");
                if (oView) {
                    var oDialogModel = oView.getModel("statusDialog");
                    if (oDialogModel) {
                        oDialogModel.setProperty("/selectedStatus", statusCode);
                        
                        var pills = document.querySelectorAll('.status-pill-container');
                        pills.forEach(function(pill) {
                            if (pill.getAttribute('data-status-code') === statusCode) {
                                pill.style.borderColor = '#0070f2';
                                pill.style.boxShadow = '0 4px 12px rgba(0, 112, 242, 0.3)';
                            } else {
                                pill.style.borderColor = 'transparent';
                                pill.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }
                        });
                    }
                }
            };

            // Attach card click handlers after rendering
            this.getView().addEventDelegate({
                onAfterRendering: function() {
                    setTimeout(() => {
                        this._attachCardClickHandlers();
                    }, 500);
                }.bind(this)
            });
        },

        _attachCardClickHandlers: function() {
            var that = this;
            var cards = document.querySelectorAll('.sc-card-wrapper');
            console.log("Attaching click handlers to", cards.length, "cards");
            
            cards.forEach(function(card, index) {
                card.onclick = null;
                card.style.cursor = 'pointer';
                
                card.onclick = function(event) {
                    // Don't trigger if clicking action buttons
                    if (event.target.closest('.sc-btn') || event.target.closest('button')) {
                        console.log("Click on button - skipping card click");
                        return;
                    }
                    
                    console.log("Card clicked via DOM, index:", index);
                    var aEquipments = that.getView().getModel("shopfloor").getProperty("/Equipments");
                    if (aEquipments && aEquipments[index]) {
                        that._openStatusDialog(aEquipments[index]);
                    }
                };
            });
        },

        _onRouteMatched: function() {
            var oModel = this.getView().getModel();
            
            if (!oModel) {
                console.error("Model not available");
                return;
            }

            var oMetaModel = oModel.getMetaModel();
            oMetaModel.requestObject("/").then(() => {
                this._loadData();
            }).catch((oError) => {
                console.error("Metadata loading error:", oError);
                this._loadData();
            });
        },

        _loadData: function() {
            this._loadEquipmentGroups();
            this._loadEquipments();
            this._setupAutoRefresh();
        },

        onExit: function() {
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
            }
        },

        _setupAutoRefresh: function() {
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
            }
            
            var oOptionsModel = this.getView().getModel("optionsModel");
            var bEnabled = oOptionsModel.getProperty("/autoRefreshEnabled");
            var iInterval = oOptionsModel.getProperty("/refreshInterval");
            
            if (bEnabled) {
                this._refreshTimer = setInterval(() => {
                    this._loadEquipments();
                }, iInterval * 1000); // Convert to milliseconds
                console.log("Auto-refresh enabled: every", iInterval, "seconds");
            } else {
                console.log("Auto-refresh disabled");
            }
        },

        _loadEquipmentGroups: function() {
            var oModel = this.getView().getModel();
            if (!oModel) return;

            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/isLoading", true);

            var oListBinding = oModel.bindList("/Equipments", undefined, undefined, [
                new Filter("EQTYPE_EQTYPE", FilterOperator.EQ, "MG"),
                new Filter("INACTIVE", FilterOperator.NE, "X")
            ]);

            oListBinding.requestContexts().then((aContexts) => {
                var aGroups = [{ key: "ALL", text: "ALL EQUIPMENT" }];
                
                aContexts.forEach(oContext => {
                    var oGroup = oContext.getObject();
                    aGroups.push({
                        key: oGroup.EQUIPMENT,
                        text: oGroup.EQNAME || oGroup.EQUIPMENT,
                        description: oGroup.EQDESC
                    });
                });

                var oGroupModel = new JSONModel({ Groups: aGroups });
                this.getView().setModel(oGroupModel, "groups");
                
                oViewModel.setProperty("/isLoading", false);
            }).catch((oError) => {
                MessageToast.show("Error loading equipment groups");
                console.error("Error loading groups:", oError);
                oViewModel.setProperty("/isLoading", false);
                
                var oGroupModel = new JSONModel({ 
                    Groups: [{ key: "ALL", text: "ALL EQUIPMENT" }] 
                });
                this.getView().setModel(oGroupModel, "groups");
            });
        },

        _loadEquipments: function() {
            var oModel = this.getView().getModel();
            if (!oModel) return;

            var oViewModel = this.getView().getModel("viewModel");
            var sSelectedGroup = oViewModel.getProperty("/selectedGroup");

            oViewModel.setProperty("/isLoading", true);

            var oListBinding = oModel.bindList("/Equipments", undefined, undefined, [
                new Filter("EQTYPE_EQTYPE", FilterOperator.EQ, "MA"),
                new Filter("INACTIVE", FilterOperator.NE, "X")
            ], {
                $expand: "EQTYPE"
            });

            oListBinding.requestContexts().then((aContexts) => {
                var aEquipments = aContexts.map(oContext => oContext.getObject());
                this._processEquipmentData(aEquipments, sSelectedGroup);
            }).catch((oError) => {
                MessageToast.show("Error loading equipments");
                console.error("Error loading equipments:", oError);
                oViewModel.setProperty("/isLoading", false);
                
                var oEquipmentModel = new JSONModel({ Equipments: [] });
                this.getView().setModel(oEquipmentModel, "shopfloor");
            });
        },

        _processEquipmentData: function(aEquipments, sSelectedGroup) {
            if (sSelectedGroup !== "ALL") {
                this._filterEquipmentsByGroup(aEquipments, sSelectedGroup);
            } else {
                this._enrichEquipmentData(aEquipments);
            }
        },

        _filterEquipmentsByGroup: function(aEquipments, sGroupId) {
            var oModel = this.getView().getModel();
            if (!oModel) return;

            var oListBinding = oModel.bindList("/EquipmentHierarchies", undefined, undefined, [
                new Filter("EQUIPMENT_EQUIPMENT", FilterOperator.EQ, sGroupId)
            ], {
                $expand: "EQUIPMENT_SUB"
            });

            oListBinding.requestContexts().then((aContexts) => {
                var aHierarchies = aContexts.map(oContext => oContext.getObject());
                var aChildEquipmentIds = aHierarchies.map(h => h.EQUIPMENT_SUB_EQUIPMENT);
                var aFilteredEquipments = aEquipments.filter(eq => 
                    aChildEquipmentIds.includes(eq.EQUIPMENT)
                );
                
                var mOrderMap = {};
                aHierarchies.forEach(h => {
                    mOrderMap[h.EQUIPMENT_SUB_EQUIPMENT] = h.OrderNo || 999;
                });
                
                aFilteredEquipments.sort((a, b) => {
                    return (mOrderMap[a.EQUIPMENT] || 999) - (mOrderMap[b.EQUIPMENT] || 999);
                });

                this._enrichEquipmentData(aFilteredEquipments);
            }).catch((oError) => {
                console.error("Error loading hierarchies:", oError);
                this._enrichEquipmentData(aEquipments);
            });
        },

        _enrichEquipmentData: function(aEquipments) {
            var oModel = this.getView().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            if (!oModel) return;

            var oStatusTypesBinding = oModel.bindList("/StatusTypes");
            
            oStatusTypesBinding.requestContexts().then((aStatusTypeContexts) => {
                var mStatusTypeLookup = {};
                aStatusTypeContexts.forEach(ctx => {
                    var oStatusType = ctx.getObject();
                    var colorHex = oStatusType.COLORHEX;
                    if (!colorHex || !colorHex.startsWith('#')) {
                        colorHex = '#CCCCCC';
                    }
                    mStatusTypeLookup[oStatusType.STATUSTYPE] = {
                        ...oStatusType,
                        COLORHEX: colorHex
                    };
                });

                var oStatusBinding = oModel.bindList("/Status");
                return oStatusBinding.requestContexts().then((aStatusContexts) => {
                    var mStatusLookup = {};
                    aStatusContexts.forEach(ctx => {
                        var oStatus = ctx.getObject();
                        var oStatusType = mStatusTypeLookup[oStatus.STATUSTYPE_STATUSTYPE] || {};
                        var colorHex = oStatusType.COLORHEX || '#CCCCCC';
                        
                        mStatusLookup[oStatus.STATUS] = {
                            STATUS: oStatus.STATUS,
                            STATUSDESC: oStatus.STATUSDESC,
                            STATUSTYPE: oStatus.STATUSTYPE_STATUSTYPE,
                            COLORHEX: colorHex
                        };
                    });
                    return { mStatusTypeLookup, mStatusLookup };
                });
            }).then((lookups) => {
                var oListBinding = oModel.bindList("/EquipmentStatus");

                return oListBinding.requestContexts().then((aContexts) => {
                    var mStatusMap = {};
                    
                    aContexts.forEach(oContext => {
                        var status = oContext.getObject();
                        var statusCode = status.LASTSTATUS_STATUS;
                        var statusInfo = lookups.mStatusLookup[statusCode];
                        
                        if (statusInfo) {
                            mStatusMap[status.EQUIPMENT_EQUIPMENT] = {
                                status: statusInfo.STATUS,
                                statusDesc: statusInfo.STATUSDESC,
                                statusType: statusInfo.STATUSTYPE,
                                statusTypeDesc: lookups.mStatusTypeLookup[statusInfo.STATUSTYPE]?.STATUSTYPEDESC || "",
                                colorHex: statusInfo.COLORHEX,
                                lastChange: status.LASTSTATUSCHANGE ? new Date(status.LASTSTATUSCHANGE) : new Date()
                            };
                        }
                    });
                    
                    return mStatusMap;
                });
            }).then((mStatusMap) => {
                var aEnrichedEquipments = aEquipments.map(eq => {
                    var oStatus = mStatusMap[eq.EQUIPMENT] || {
                        status: "I1",
                        statusDesc: "Unknown",
                        statusType: "IDLE",
                        statusTypeDesc: "Idle",
                        colorHex: "#FFFF00",
                        lastChange: new Date()
                    };

                    return {
                        EquipmentID: eq.EQUIPMENT,
                        Description: eq.EQDESC || eq.EQNAME || "",
                        EquipmentName: eq.EQNAME || eq.EQUIPMENT,
                        Driver: eq.OTDAEMON || "N/A",
                        Status: oStatus.status,
                        StatusDesc: oStatus.statusDesc,
                        StatusType: oStatus.statusType,
                        StatusClass: this._getStatusClass(oStatus.statusType),
                        ColorHex: oStatus.colorHex,
                        LastChange: oStatus.lastChange,
                        SAPEquipment: eq.EQUNR_SAP || "",
                        StatusStructure: eq.STATUSSTRUCTURE || "",
                        AlarmStructure: eq.ALARMSTRUCTURE || "",
                        PDataStructure: eq.PDATASTRUCTURE || ""
                    };
                });

                var oEquipmentModel = new JSONModel({ Equipments: aEnrichedEquipments });
                this.getView().setModel(oEquipmentModel, "shopfloor");
                
                oViewModel.setProperty("/isLoading", false);
                oViewModel.setProperty("/lastRefresh", new Date());

                setTimeout(() => {
                    this._attachCardClickHandlers();
                }, 200);
            }).catch((oError) => {
                console.error("Error loading equipment status:", oError);
                
                var aBasicEquipments = aEquipments.map(eq => ({
                    EquipmentID: eq.EQUIPMENT,
                    Description: eq.EQDESC || eq.EQNAME || "",
                    EquipmentName: eq.EQNAME || eq.EQUIPMENT,
                    Driver: eq.OTDAEMON || "N/A",
                    Status: "I1",
                    StatusClass: "sc-type-idle",
                    ColorHex: "#FFFF00",
                    LastChange: new Date(),
                    StatusStructure: eq.STATUSSTRUCTURE || "",
                    AlarmStructure: eq.ALARMSTRUCTURE || "",
                    PDataStructure: eq.PDATASTRUCTURE || ""
                }));

                var oEquipmentModel = new JSONModel({ Equipments: aBasicEquipments });
                this.getView().setModel(oEquipmentModel, "shopfloor");
                
                oViewModel.setProperty("/isLoading", false);
            });
        },

        _getStatusClass: function(sStatusType) {
            var mStatusClassMap = {
                "PROD": "sc-type-prod",
                "PROD2": "sc-type-prod",
                "IDLE": "sc-type-idle",
                "DOWN": "sc-type-down",
                "MAINT": "sc-type-maint",
                "ENG": "sc-type-eng",
                "SETUP": "sc-type-setup"
            };
            
            return mStatusClassMap[sStatusType] || "sc-type-idle";
        },

        formatDate: function(oDate) {
            if (!oDate) return "";
            var oFormat = DateFormat.getDateTimeInstance({ 
                style: "medium",
                pattern: "dd.MM.yyyy HH:mm:ss"
            });
            return oFormat.format(oDate);
        },

        onPressRefresh: function() {
            MessageToast.show("Refreshing equipment data...");
            this._loadEquipments();
        },

        onPressOptions: function() {
            var oOptionsDialog = this.byId("optionsDialog");
            if (oOptionsDialog) {
                oOptionsDialog.open();
            }
        },

        onAutoRefreshToggle: function(oEvent) {
            var bSelected = oEvent.getParameter("selected");
            console.log("Auto-refresh toggled:", bSelected);
        },

        onRefreshIntervalChange: function(oEvent) {
            var iValue = oEvent.getParameter("value");
            console.log("Refresh interval changed to:", iValue);
        },

        onSaveOptions: function() {
            this._setupAutoRefresh(); // Restart timer with new settings
            MessageToast.show("Options saved successfully");
            this.onCloseOptionsDialog();
        },

        onCloseOptionsDialog: function() {
            var oDialog = this.byId("optionsDialog");
            oDialog.close();
        },

        onPressFilter: function() {
            MessageToast.show("Filter equipment groups - coming soon");
        },

        onPressDocumentation: function() {
            MessageBox.information(
                "Shopfloor View Documentation\n\n" +
                "This view displays equipment grouped by machine groups.\n\n" +
                "Features:\n" +
                "- Group tabs to filter equipment\n" +
                "- Color-coded status indicators\n" +
                "- Click equipment cards to change status\n" +
                "- Auto-refresh every 30 seconds\n\n" +
                "Status Colors:\n" +
                "🟢 Green: Productive\n" +
                "🟡 Yellow: Idle\n" +
                "🔴 Red: Down/Problem\n" +
                "🔵 Blue: Engineering/Setup\n" +
                "🟤 Dark Red: Maintenance",
                { title: "Documentation" }
            );
        },

        onGroupSelect: function(oEvent) {
            var sKey = oEvent.getParameter("key");
            var oViewModel = this.getView().getModel("viewModel");
            
            oViewModel.setProperty("/selectedGroup", sKey);
            MessageToast.show("Loading group: " + sKey);
            
            this._loadEquipments();
        },

        onPressCardAction: function(oEvent) {
            var sAction = oEvent.getSource().data("actionType");
            var oSource = oEvent.getSource();
            
            // Find parent card wrapper
            var oParent = oSource.getParent();
            while (oParent && !oParent.hasStyleClass('sc-card-wrapper')) {
                oParent = oParent.getParent();
            }
            
            if (!oParent) {
                console.error("Could not find card wrapper");
                return;
            }
            
            var oBindingContext = oParent.getBindingContext("shopfloor");
            if (!oBindingContext) {
                console.error("No binding context found");
                return;
            }
            
            var oEquipment = oBindingContext.getObject();
            var sEquipmentId = oEquipment.EquipmentID;

            if (oEvent.cancelBubble) {
                oEvent.cancelBubble = true;
            }
            if (oEvent.stopPropagation) {
                oEvent.stopPropagation();
            }

            switch(sAction) {
                case "Status":
                    // Show current status details
                    this._showStatusDetails(oEquipment);
                    break;
                case "Alarm":
                    MessageToast.show("Opening Alarms for " + sEquipmentId);
                    break;
                case "ProcData":
                    MessageToast.show("Opening Process Data for " + sEquipmentId);
                    break;
            }
        },

        _showStatusDetails: function(oEquipment) {
            var sMessage = "Equipment: " + oEquipment.EquipmentID + "\n" +
                          "Name: " + oEquipment.EquipmentName + "\n" +
                          "Current Status: " + oEquipment.Status + " - " + oEquipment.StatusDesc + "\n" +
                          "Status Type: " + oEquipment.StatusTypeDesc + "\n" +
                          "Last Change: " + this.formatDate(oEquipment.LastChange);
            
            MessageBox.information(sMessage, {
                title: "Equipment Status Details"
            });
        },

        _openStatusDialog: function(oEquipment) {
            var oModel = this.getView().getModel();
            
            if (!oModel) {
                MessageToast.show("Service not available");
                return;
            }

            console.log("Opening status dialog for:", oEquipment.EquipmentID);

            var oStatusTypesBinding = oModel.bindList("/StatusTypes");
            oStatusTypesBinding.requestContexts().then((aStatusTypeContexts) => {
                var mStatusTypeLookup = {};
                aStatusTypeContexts.forEach(ctx => {
                    var oST = ctx.getObject();
                    mStatusTypeLookup[oST.STATUSTYPE] = oST;
                });

                var oStatusBinding = oModel.bindList("/Status");
                return oStatusBinding.requestContexts().then((aContexts) => {
                    var aStatuses = aContexts.map(ctx => {
                        var oStatus = ctx.getObject();
                        var oStatusType = mStatusTypeLookup[oStatus.STATUSTYPE_STATUSTYPE] || {};
                        
                        return {
                            STATUS: oStatus.STATUS,
                            STATUSDESC: oStatus.STATUSDESC,
                            STATUSTYPE_STATUSTYPE: oStatus.STATUSTYPE_STATUSTYPE,
                            StatusTypeDesc: oStatusType.STATUSTYPEDESC || "",
                            ColorHex: oStatusType.COLORHEX || "#CCCCCC"
                        };
                    });

                    var oDialogModel = new JSONModel({
                        equipmentId: oEquipment.EquipmentID,
                        equipmentName: oEquipment.EquipmentName,
                        currentStatus: oEquipment.Status,
                        selectedStatus: null,
                        availableStatuses: aStatuses
                    });

                    this.getView().setModel(oDialogModel, "statusDialog");

                    if (!this._statusDialog) {
                        this._statusDialog = this.byId("statusDialog");
                    }
                    
                    if (this._statusDialog) {
                        this._statusDialog.open();
                        console.log("Dialog opened");
                    } else {
                        console.error("Dialog control not found with ID: statusDialog");
                        MessageToast.show("Error: Dialog not found");
                    }
                });
            }).catch((oError) => {
                console.error("Error loading statuses:", oError);
                MessageToast.show("Error loading available statuses");
            });
        },

        onApplyStatus: function() {
            var oDialogModel = this.getView().getModel("statusDialog");
            var sEquipmentId = oDialogModel.getProperty("/equipmentId");
            var sNewStatus = oDialogModel.getProperty("/selectedStatus");
            var sCurrentStatus = oDialogModel.getProperty("/currentStatus");

            if (!sNewStatus) {
                MessageToast.show("Please select a status");
                return;
            }

            if (sNewStatus === sCurrentStatus) {
                MessageToast.show("Status is already set to " + sNewStatus);
                return;
            }

            var oModel = this.getView().getModel();
            var sNow = new Date().toISOString();

            // First, get the last status record to calculate LENGTHMSEC
            var oHistoryBinding = oModel.bindList("/StatusHistory");
            var aFilters = [new Filter("EQUIPMENT_EQUIPMENT", FilterOperator.EQ, sEquipmentId)];
            var aSorters = [new Sorter("TIME", true)]; // Descending order
            
            oHistoryBinding.filter(aFilters);
            oHistoryBinding.sort(aSorters);
            
            oHistoryBinding.requestContexts(0, 1).then((aContexts) => {
                var iLengthMsec = 0;
                
                if (aContexts.length > 0) {
                    // Calculate time difference with previous record
                    var oLastRecord = aContexts[0].getObject();
                    var lastTime = new Date(oLastRecord.TIME);
                    var currentTime = new Date(sNow);
                    iLengthMsec = currentTime - lastTime;
                    
                    console.log("Previous status time:", lastTime);
                    console.log("Current time:", currentTime);
                    console.log("Duration (ms):", iLengthMsec);
                }

                // Create new status history entry with calculated LENGTHMSEC
                var oHistoryEntry = {
                    EQUIPMENT_EQUIPMENT: sEquipmentId,
                    TIME: sNow,
                    SOURCE: "MA",
                    STATUS_STATUS: sNewStatus,
                    ORIGINALSTATUS: sNewStatus,
                    LASTSTATUS: sCurrentStatus,
                    LENGTHMSEC: iLengthMsec
                };

                var oNewHistoryBinding = oModel.bindList("/StatusHistory");
                var oHistoryContext = oNewHistoryBinding.create(oHistoryEntry);

                return oHistoryContext.created();
            }).then(() => {
                // Update current status
                var oStatusBinding = oModel.bindList("/EquipmentStatus");
                oStatusBinding.filter(new Filter("EQUIPMENT_EQUIPMENT", FilterOperator.EQ, sEquipmentId));
                
                return oStatusBinding.requestContexts().then((aContexts) => {
                    if (aContexts.length > 0) {
                        aContexts[0].setProperty("LASTSTATUS_STATUS", sNewStatus);
                        aContexts[0].setProperty("LASTSTATUSCHANGE", sNow);
                    } else {
                        var oNewStatus = {
                            EQUIPMENT_EQUIPMENT: sEquipmentId,
                            LASTSTATUS_STATUS: sNewStatus,
                            LASTSTATUSCHANGE: sNow
                        };
                        oStatusBinding.create(oNewStatus);
                    }
                    return oModel.submitBatch("$auto");
                });
            }).then(() => {
                MessageToast.show("Status updated successfully");
                this.onCloseStatusDialog();
                setTimeout(() => {
                    this._loadEquipments();
                }, 500);
            }).catch((oError) => {
                console.error("Error updating status:", oError);
                MessageToast.show("Error updating status: " + (oError.message || "Unknown error"));
            });
        },

        onCloseStatusDialog: function() {
            var oDialog = this.byId("statusDialog");
            oDialog.close();
            
            var pills = document.querySelectorAll('.status-pill-container');
            pills.forEach(function(pill) {
                pill.style.borderColor = 'transparent';
                pill.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
        }
    });
});