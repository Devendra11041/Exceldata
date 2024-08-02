sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/Table",
    "sap/ui/model/json/JSONModel"
],
    function (Controller,Column,ColumnListItem,Text,Input,Table,JSONModel) {
        "use strict";

        return Controller.extend("com.app.importexceldata.controller.View1", {
            onInit: function () {

                this.localModel = new JSONModel();
                this.getView().setModel(this.localModel, "localModel");
                this.bEditMode = false; // Track edit mode state
            },

            onUpload: function (e) {
                this._import(e.getParameter("files") && e.getParameter("files")[0]);
            },

            _import: function (file) {
                var that = this;
                var excelData = [];
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var data = new Uint8Array(e.target.result);
                        var workbook = XLSX.read(data, {
                            type: 'array'
                        });
                        workbook.SheetNames.forEach(function (sheetName) {
                            excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                        });

                        // Add the new column to each item in the data


                        console.log("Excel Data:", excelData); // Check if data is correctly read

                        that.localModel.setData({
                            items: excelData
                        });
                        that.localModel.refresh(true);
                        console.log("Model Data:", that.localModel.getData()); // Confirm model data is set

                        that.createTable(excelData);
                    };
                    reader.onerror = function (ex) {
                        console.log(ex);
                    };
                    reader.readAsArrayBuffer(file);
                }
            },

            createTable: function (data) {
                var oTable = this.byId("idDynamicTable");
                oTable.destroyColumns();
                oTable.destroyItems();

                if (data.length > 0) {
                    var firstItem = data[0];
                    for (var key in firstItem) {
                        if (firstItem.hasOwnProperty(key)) {
                            oTable.addColumn(new Column({
                                header: new Text({ text: key })
                            }));
                        }
                    }

                    var oTemplate = new ColumnListItem({
                        cells: Object.keys(firstItem).map(function (key) {
                            return this.bEditMode ?
                                new Input({ value: "{localModel>" + key + "}" }) :
                                new Text({ text: "{localModel>" + key + "}" });
                        }.bind(this))
                    });

                    console.log("Template:", oTemplate); // Check template creation

                    oTable.bindItems({
                        path: "localModel>/items",
                        template: oTemplate
                    });
                }
            },

            onClear: function () {
                this.localModel.setData({ items: [] });
                var oTable = this.byId("idDynamicTable");
                oTable.destroyItems();
                oTable.destroyColumns();
            },

            onEdit: function () {
                this.bEditMode = !this.bEditMode; // Toggle edit mode
                var oTable = this.byId("idDynamicTable");
                var data = this.localModel.getData().items;
                this.createTable(data); // Recreate table with updated edit mode state
            },

            onSave: function () {
                this.bEditMode = false; // Exit edit mode
                var data = this.localModel.getData().items;
                console.log("Edited Data:", data); // You can process or save this data as needed
                this.createTable(data); // Recreate table in view mode
            },

            onAdd: function () {
                var data = this.localModel.getData().items;
                var newItem = {};

                if (data.length > 0) {
                    Object.keys(data[0]).forEach(function (key) {
                        newItem[key] = ""; // Set default empty values for new item
                    });
                }

                data.push(newItem);
                this.localModel.setProperty("/items", data);
                this.createTable(data); // Recreate table to reflect new row
            }
        });
    });
