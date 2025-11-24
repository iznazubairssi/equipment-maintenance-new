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
                lastRefresh: new Date(),
                currentSubGroup: null,
                currentSubGroupName: null,
                parentGroupName: "ALL EQUIPMENT",
                breadcrumb: []
            });
            this.getView().setModel(oViewModel, "viewModel");

            var oOptionsModel = new JSONModel({
                autoRefreshEnabled: true,
                refreshInterval: 60
            });
            this.getView().setModel(oOptionsModel, "optionsModel");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ShopfloorViewRoute").attachPatternMatched(this._onRouteMatched, this);

            window.selectStatus = function(event) {
                var statusCode = event.currentTarget.getAttribute('data-status-code');
                console.log("Status pill clicked:", statusCode);
                
                var oView = sap.ui.getCore().byId("__component0---ShopfloorViewView");
                if (oView) {
                    var oController = oView.getController();
                    var oDialogModel = oView.getModel("statusDialog");
                    
                    if (oDialogModel && oController) {
                        var sEquipmentId = oDialogModel.getProperty("/equipmentId");
                        var sCurrentStatus = oDialogModel.getProperty("/currentStatus");

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

                        if (sEquipmentId) {
                            oController._applyStatusUpdate(sEquipmentId, sCurrentStatus, statusCode);
                        } else {
                            console.error("Could not find Equipment ID in dialog model.");
                            oController.onCloseStatusDialog();
                        }
                    }
                }
            };
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
                }, iInterval * 1000);
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
                var aAllGroups = aContexts.map(ctx => ctx.getObject());
                
                var oHierBinding = oModel.bindList("/EquipmentHierarchies");
                return oHierBinding.requestContexts().then((aHierContexts) => {
                    var aHierarchies = aHierContexts.map(ctx => ctx.getObject());
                    
                    var aChildGroupIds = aHierarchies
                        .filter(h => {
                            var childEq = aAllGroups.find(g => g.EQUIPMENT === h.EQUIPMENT_SUB_EQUIPMENT);
                            return childEq && childEq.EQTYPE_EQTYPE === "MG";
                        })
                        .map(h => h.EQUIPMENT_SUB_EQUIPMENT);
                    
                    var aTopLevelGroups = aAllGroups.filter(g => 
                        !aChildGroupIds.includes(g.EQUIPMENT)
                    );
                    
                    var aGroups = [{ key: "ALL", text: "ALL EQUIPMENT" }];
                    
                    aTopLevelGroups.forEach(oGroup => {
                        aGroups.push({
                            key: oGroup.EQUIPMENT,
                            text: oGroup.EQNAME || oGroup.EQUIPMENT,
                            description: oGroup.EQDESC
                        });
                    });

                    var oGroupModel = new JSONModel({ Groups: aGroups });
                    this.getView().setModel(oGroupModel, "groups");
                    
                    oViewModel.setProperty("/isLoading", false);
                });
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
            var sCurrentSubGroup = oViewModel.getProperty("/currentSubGroup");

            oViewModel.setProperty("/isLoading", true);

            var oListBinding = oModel.bindList("/Equipments", undefined, undefined, [
                new Filter("INACTIVE", FilterOperator.NE, "X")
            ], {
                $expand: "EQTYPE"
            });

            oListBinding.requestContexts().then((aContexts) => {
                var aAllEquipments = aContexts.map(oContext => oContext.getObject());
                
                var sActiveGroup = sCurrentSubGroup || sSelectedGroup;
                
                if (sActiveGroup === "ALL") {
                    var aEquipments = aAllEquipments.filter(eq => eq.EQTYPE_EQTYPE === "MA");
                    this._processEquipmentData(aEquipments, sActiveGroup);
                } else {
                    this._filterEquipmentsByGroup(aAllEquipments, sActiveGroup);
                }
            }).catch((oError) => {
                MessageToast.show("Error loading equipments");
                console.error("Error loading equipments:", oError);
                oViewModel.setProperty("/isLoading", false);
                
                var oEquipmentModel = new JSONModel({ Equipments: [] });
                this.getView().setModel(oEquipmentModel, "shopfloor");
            });
        },

        _processEquipmentData: function(aEquipments, sSelectedGroup) {
            this._enrichEquipmentData(aEquipments, sSelectedGroup);
        },

        _filterEquipmentsByGroup: function(aAllEquipments, sGroupId) {
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
                
                var aMAChildren = [];
                var aMGChildren = [];
                
                aChildEquipmentIds.forEach(childId => {
                    var oEquipment = aAllEquipments.find(eq => eq.EQUIPMENT === childId);
                    if (oEquipment) {
                        if (oEquipment.EQTYPE_EQTYPE === "MA") {
                            aMAChildren.push(oEquipment);
                        } else if (oEquipment.EQTYPE_EQTYPE === "MG") {
                            aMGChildren.push(oEquipment);
                        }
                    }
                });
                
                var mOrderMap = {};
                aHierarchies.forEach(h => {
                    mOrderMap[h.EQUIPMENT_SUB_EQUIPMENT] = h.OrderNo || 999;
                });
                
                aMAChildren.sort((a, b) => {
                    return (mOrderMap[a.EQUIPMENT] || 999) - (mOrderMap[b.EQUIPMENT] || 999);
                });
                
                aMGChildren.sort((a, b) => {
                    return (mOrderMap[a.EQUIPMENT] || 999) - (mOrderMap[b.EQUIPMENT] || 999);
                });
                
                var aSubGroupCards = aMGChildren.map(sg => ({
                    EquipmentID: sg.EQUIPMENT,
                    EquipmentName: sg.EQNAME || sg.EQUIPMENT,
                    Description: sg.EQDESC || "",
                    IsSubGroup: true,
                    Driver: "SubGroup",
                    Status: "MG",
                    StatusDesc: "Machine Group",
                    StatusType: "SETUP",
                    StatusClass: "sc-type-subgroup",
                    ColorHex: "#B8B8B8",
                    LastChange: new Date()
                }));
                
                var aCombinedEquipments = [...aSubGroupCards, ...aMAChildren];
                
                this._enrichEquipmentData(aCombinedEquipments, sGroupId);
            }).catch((oError) => {
                console.error("Error loading hierarchies:", oError);
                this._enrichEquipmentData([], sGroupId);
            });
        },

        _enrichEquipmentData: function(aEquipments, sGroupId) {
            var oModel = this.getView().getModel();
            var oViewModel = this.getView().getModel("viewModel");

            if (!oModel) return;

            var aSubGroups = aEquipments.filter(eq => eq.IsSubGroup);
            var aActualEquipments = aEquipments.filter(eq => !eq.IsSubGroup);

            if (aActualEquipments.length === 0) {
                this._loadCardOrder(sGroupId).then((aCardOrders) => {
                    var aOrderedSubGroups = this._applySavedOrder(aSubGroups, aCardOrders);
                    var oEquipmentModel = new JSONModel({ Equipments: aOrderedSubGroups });
                    this.getView().setModel(oEquipmentModel, "shopfloor");
                    oViewModel.setProperty("/isLoading", false);
                });
                return;
            }

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
                var aEnrichedEquipments = aActualEquipments.map(eq => {
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
                        PDataStructure: eq.PDATASTRUCTURE || "",
                        StatusTypeDesc: oStatus.statusTypeDesc,
                        IsSubGroup: false
                    };
                });

                var aFinalEquipments = [...aSubGroups, ...aEnrichedEquipments];

                this._loadCardOrder(sGroupId).then((aCardOrders) => {
                    var aOrderedEquipments = this._applySavedOrder(aFinalEquipments, aCardOrders);
                    
                    var oEquipmentModel = new JSONModel({ Equipments: aOrderedEquipments });
                    this.getView().setModel(oEquipmentModel, "shopfloor");
                    
                    oViewModel.setProperty("/isLoading", false);
                    oViewModel.setProperty("/lastRefresh", new Date());
                    console.log("Equipment model set. Button clicks will now work.");
                });
                
            }).catch((oError) => {
                console.error("Error loading equipment status:", oError);
                
                var aBasicEquipments = aActualEquipments.map(eq => ({
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
                    PDataStructure: eq.PDATASTRUCTURE || "",
                    IsSubGroup: false
                }));

                var aFinalEqui = [...aSubGroups, ...aBasicEquipments];

                this._loadCardOrder(sGroupId).then((aCardOrders) => {
                    var aOrderedEquipments = this._applySavedOrder(aFinalEqui, aCardOrders);
                    
                    var oEquipmentModel = new JSONModel({ Equipments: aOrderedEquipments });
                    this.getView().setModel(oEquipmentModel, "shopfloor");
                    
                    oViewModel.setProperty("/isLoading", false);
                });
            });
        },

        _loadCardOrder: function(sGroupId) {
            var oModel = this.getView().getModel();
            var sUserId = this._getUserId();
            
            return new Promise((resolve) => {
                if (!oModel) {
                    resolve([]);
                    return;
                }

                var oOrderBinding = oModel.bindList("/EquipmentCardOrder", undefined, undefined, [
                    new Filter("USER_ID", FilterOperator.EQ, sUserId),
                    new Filter("GROUP_ID", FilterOperator.EQ, sGroupId)
                ]);

                oOrderBinding.requestContexts().then((aContexts) => {
                    var aOrders = aContexts.map(ctx => ctx.getObject());
                    resolve(aOrders);
                }).catch((oError) => {
                    console.error("Error loading card order:", oError);
                    resolve([]);
                });
            });
        },

        _applySavedOrder: function(aEquipments, aCardOrders) {
            if (!aCardOrders || aCardOrders.length === 0) {
                return aEquipments;
            }

            var mOrderMap = {};
            aCardOrders.forEach(order => {
                mOrderMap[order.EQUIPMENT_ID] = order.ORDER_INDEX;
            });

            aEquipments.sort((a, b) => {
                var orderA = mOrderMap[a.EquipmentID];
                var orderB = mOrderMap[b.EquipmentID];

                if (orderA !== undefined && orderB !== undefined) {
                    return orderA - orderB;
                } else if (orderA !== undefined) {
                    return -1;
                } else if (orderB !== undefined) {
                    return 1;
                } else {
                    return 0;
                }
            });

            return aEquipments;
        },

        _getUserId: function() {
            return sap.ushell?.Container?.getUser()?.getId() || "DEFAULT_USER";
        },

        _saveCardOrder: function(aEquipments, sGroupId) {
            var oModel = this.getView().getModel();
            var sUserId = this._getUserId();

            if (!oModel) {
                console.error("Model not available for saving card order");
                return Promise.resolve();
            }

            var oDeleteBinding = oModel.bindList("/EquipmentCardOrder");
            var aFilters = [
                new Filter("USER_ID", FilterOperator.EQ, sUserId),
                new Filter("GROUP_ID", FilterOperator.EQ, sGroupId)
            ];
            oDeleteBinding.filter(aFilters);

            return oDeleteBinding.requestContexts().then((aContexts) => {
                var aDeletePromises = aContexts.map(ctx => ctx.delete());
                return Promise.all(aDeletePromises);
            }).then(() => {
                var oOrderBinding = oModel.bindList("/EquipmentCardOrder");
                var aCreatePromises = [];

                aEquipments.forEach((oEquip, index) => {
                    var oOrderEntry = {
                        USER_ID: sUserId,
                        GROUP_ID: sGroupId,
                        EQUIPMENT_ID: oEquip.EquipmentID,
                        ORDER_INDEX: index
                    };
                    var oContext = oOrderBinding.create(oOrderEntry);
                    aCreatePromises.push(oContext.created());
                });

                return Promise.all(aCreatePromises);
            }).then(() => {
                return oModel.submitBatch("$auto");
            }).then(() => {
                console.log("Card order saved successfully");
            }).catch((oError) => {
                console.error("Error saving card order:", oError);
            });
        },

        onCardDragStart: function(oEvent) {
            var oDraggedControl = oEvent.getParameter("target");
            var oDragSession = oEvent.getParameter("dragSession");
            
            oDragSession.setComplexData("customDragData", {
                draggedControl: oDraggedControl
            });
            
            console.log("Drag started for card");
        },

        onCardDrop: function(oEvent) {
            var oDraggedControl = oEvent.getParameter("draggedControl");
            var oDroppedControl = oEvent.getParameter("droppedControl");
            var sDropPosition = oEvent.getParameter("dropPosition");

            if (!oDraggedControl || !oDroppedControl) {
                return;
            }

            var oShopfloorModel = this.getView().getModel("shopfloor");
            var aEquipments = oShopfloorModel.getProperty("/Equipments");

            var sDraggedId = oDraggedControl.data("equipmentId");
            var sDroppedId = oDroppedControl.data("equipmentId");

            if (!sDraggedId || !sDroppedId) {
                return;
            }

            var iDraggedIndex = aEquipments.findIndex(eq => eq.EquipmentID === sDraggedId);
            var iDroppedIndex = aEquipments.findIndex(eq => eq.EquipmentID === sDroppedId);

            if (iDraggedIndex === -1 || iDroppedIndex === -1) {
                return;
            }

            var oDraggedItem = aEquipments[iDraggedIndex];
            aEquipments.splice(iDraggedIndex, 1);

            var iNewIndex = iDroppedIndex;
            if (iDraggedIndex < iDroppedIndex) {
                iNewIndex--;
            }

            if (sDropPosition === "After") {
                iNewIndex++;
            }

            aEquipments.splice(iNewIndex, 0, oDraggedItem);

            oShopfloorModel.setProperty("/Equipments", aEquipments);

            var oViewModel = this.getView().getModel("viewModel");
            var sCurrentSubGroup = oViewModel.getProperty("/currentSubGroup");
            var sSelectedGroup = oViewModel.getProperty("/selectedGroup");
            var sGroupId = sCurrentSubGroup || sSelectedGroup;

            this._saveCardOrder(aEquipments, sGroupId);

            MessageToast.show("Card order updated");
        },

        _getStatusClass: function(sStatusType) {
            switch (sStatusType) {
                case "PROD": return "sc-type-production";
                case "IDLE": return "sc-type-idle";
                case "DOWN": return "sc-type-down";
                case "SETUP": return "sc-type-subgroup";
                default: return "sc-type-idle";
            }
        },

        onPressRefresh: function() {
            MessageToast.show("Refreshing equipment data...");
            this._loadEquipments();
        },

        onGroupSelect: function(oEvent) {
            var oViewModel = this.getView().getModel("viewModel");
            var sSelectedKey = oEvent.getParameter("key");
            
            oViewModel.setProperty("/selectedGroup", sSelectedKey);
            oViewModel.setProperty("/currentSubGroup", null);
            oViewModel.setProperty("/currentSubGroupName", null);
            
            this._loadEquipments();
        },

        onPressOpenCard: function(oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext("shopfloor");
            if (!oBindingContext) {
                return;
            }

            var oEquipment = oBindingContext.getObject();

            if (oEquipment.IsSubGroup) {
                var oViewModel = this.getView().getModel("viewModel");
                var sCurrentGroup = oViewModel.getProperty("/selectedGroup");
                
                var oGroupsModel = this.getView().getModel("groups");
                var aGroups = oGroupsModel.getProperty("/Groups");
                var oSelectedGroup = aGroups.find(g => g.key === sCurrentGroup);
                
                oViewModel.setProperty("/currentSubGroup", oEquipment.EquipmentID);
                oViewModel.setProperty("/currentSubGroupName", oEquipment.EquipmentName);
                oViewModel.setProperty("/parentGroupName", oSelectedGroup ? oSelectedGroup.text : "ALL EQUIPMENT");
                
                this._loadEquipments();
            } else {
                this._openStatusDialog(oEquipment);
            }
        },

        onBreadcrumbPress: function() {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/currentSubGroup", null);
            oViewModel.setProperty("/currentSubGroupName", null);
            this._loadEquipments();
        },

        onPressFilter: function() {
            MessageToast.show("Filter feature coming soon");
        },

        onPressDocumentation: function() {
            MessageToast.show("Documentation feature coming soon");
        },

        onPressOptions: function() {
            var oDialog = this.byId("optionsDialog");
            oDialog.open();
        },

        onCloseOptionsDialog: function() {
            var oDialog = this.byId("optionsDialog");
            oDialog.close();
        },

        onSaveOptions: function() {
            this._setupAutoRefresh();
            MessageToast.show("Options saved");
            this.onCloseOptionsDialog();
        },

        onAutoRefreshToggle: function() {
            this._setupAutoRefresh();
        },

        onRefreshIntervalChange: function() {
            var oOptionsModel = this.getView().getModel("optionsModel");
            var bEnabled = oOptionsModel.getProperty("/autoRefreshEnabled");
            if (bEnabled) {
                this._setupAutoRefresh();
            }
        },

        formatDate: function(sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy HH:mm:ss"
            });
            return oDateFormat.format(oDate);
        },

        onPressCardAction: function(oEvent) {
            var oButton = oEvent.getSource();
            var sAction = oButton.data("actionType");
            
            var oItem = oButton.getParent().getParent().getParent();
            var oBindingContext = oItem.getBindingContext("shopfloor");
            
            if (!oBindingContext) {
                return;
            }
            
            var oEquipment = oBindingContext.getObject();
            var sEquipmentId = oEquipment.EquipmentID;

            console.log("Action button pressed:", sAction, "for", sEquipmentId);

            switch(sAction) {
                case "Status":
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
                console.error("Model not available");
                MessageToast.show("Service not available");
                return;
            }

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

                    console.log("Setting dialog model with", aStatuses.length, "statuses");
                    this.getView().setModel(oDialogModel, "statusDialog");

                    if (!this._statusDialog) {
                        this._statusDialog = this.byId("statusDialog");
                        console.log("Getting dialog control, found:", !!this._statusDialog);
                    }
                    
                    if (this._statusDialog) {
                        console.log("Opening dialog...");
                        this._statusDialog.open();
                        console.log("Dialog open() called");
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

        _applyStatusUpdate: function(sEquipmentId, sCurrentStatus, sNewStatus) {
            
            if (sNewStatus === sCurrentStatus) {
                MessageToast.show("Status is already set to " + sNewStatus);
                this.onCloseStatusDialog();
                return;
            }

            var oModel = this.getView().getModel();
            var sNow = new Date().toISOString();
            
            var oHistoryBinding = oModel.bindList("/StatusHistory");
            var aFilters = [new Filter("EQUIPMENT_EQUIPMENT", FilterOperator.EQ, sEquipmentId)];
            var aSorters = [new Sorter("TIME", true)];
            
            oHistoryBinding.filter(aFilters);
            oHistoryBinding.sort(aSorters);
            
            var that = this; 

            oHistoryBinding.requestContexts(0, 1).then((aContexts) => {
                var iLengthMsec = 0;
                
                if (aContexts.length > 0) {
                    var oLastRecord = aContexts[0].getObject();
                    var lastTime = new Date(oLastRecord.TIME);
                    var currentTime = new Date(sNow);
                    iLengthMsec = currentTime - lastTime;
                    
                    console.log("Previous status time:", lastTime);
                    console.log("Current time:", currentTime);
                    console.log("Duration (ms):", iLengthMsec);
                }

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
                that.onCloseStatusDialog(); 
                setTimeout(() => {
                    that._loadEquipments();
                }, 500);
            }).catch((oError) => {
                console.error("Error updating status:", oError);
                MessageToast.show("Error updating status: " + (oError.message || "Unknown error"));
                that.onCloseStatusDialog();
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
