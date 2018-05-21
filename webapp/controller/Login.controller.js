sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
	"use strict";

	return Controller.extend("com.taskman.controller.Login", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.taskman.view.Login
		 */
		// onInit: function() {
		// 	var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		// 	oRouter.getRoute("Login").attachPatternMatched(this._onObjectMatched, this);
		// },
		// _onObjectMatched: function() {

		// },
		onLoginPressed: function(oEvent) {

			var userInput = this.getView().byId("userInput").getValue();
			if (userInput === null || userInput === "") {
				sap.m.MessageToast.show("User can not be empty.");
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Tasks", {
					user: userInput
				});
			}
		}
	});
});