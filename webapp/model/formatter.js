sap.ui.define([], function() {
	"use strict";
	return {
		statusText: function(sStatus) {
			var modelData = this.getView().getModel("Data").getData().States;
			switch (sStatus) {
				case "0":
					return modelData[0].title;
				case "1":
					return modelData[1].title;
				case "2":
					return modelData[2].title;
				default:
					return sStatus;
			}
		},
		priorityText: function(sPriority) {
			var modelData = this.getView().getModel("Data").getData().Priority;
			switch (sPriority) {
				case "0":
					return modelData[0].title;
				case "1":
					return modelData[1].title;
				case "2":
					return modelData[2].title;
				case "3":
					return modelData[3].title;
				default:
					return sPriority;
			}
		}
	};
});