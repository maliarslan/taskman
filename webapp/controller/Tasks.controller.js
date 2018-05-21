var projectId;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"com/taskman/model/formatter",
	"sap/m/MessageToast",
	"jquery.sap.global"
], function(Controller, History, JSONModel, formatter, MessageToast, JQuery) {
	"use strict";

	return Controller.extend("com.taskman.controller.Tasks", {

		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.taskman.view.Tasks
		 */
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Tasks").attachPatternMatched(this._onObjectMatched, this);

			var oProjectList = this.byId("ShortProjectList");
			var idProjectList = oProjectList.getId();
			var oDeleteList = this.byId("deleteProjectList");
			var idDeleteList = oDeleteList.getId();
			oProjectList.onAfterRendering = function() {
				if (sap.m.List.prototype.onAfterRendering) {
					sap.m.List.prototype.onAfterRendering.apply(this);
				}
				$("#" + idProjectList + "-listUl" + " li").draggable({
					helper: "clone" // drag clone element instead of original to prevent if user would not dropped it on delete list
				}).disableSelection();
			};
			var that = this; // to preserve Controller context in drop event
			oDeleteList.onAfterRendering = function() {
				if (sap.m.List.prototype.onAfterRendering) {
					sap.m.List.prototype.onAfterRendering.apply(this);
				}
				$("#" + idDeleteList + "-listUl" + " li").droppable({
					drop: function(event, ui) {
						that.onDeleteProjectPressed(); // delete project and related data
					}
				}).disableSelection();
			};
		},

		_onObjectMatched: function(oEvent) {
			var user = oEvent.getParameter("arguments").user; // get username from login view
			this.getView().byId("master").setTitle(user); // set master page title to username
		},
		onLogoutPressed: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Login", {}, true);
			}
		},
		onPressChangeTableModel: function() {
			projectId = this.getView().byId("ShortProjectList").getSelectedItem().getBindingContext("Data").getProperty("projectId"); // get projectId to filter tasks
			var filterByProjectId = new sap.ui.model.Filter("projectId", sap.ui.model.FilterOperator.EQ, projectId);
			this.getView().byId("tableTask").getBinding("items").filter([filterByProjectId]); // filter tableTask by projectId
		},
		_createProjectDialog: function() { // create project dialog from fragment
			this._oProjectDialog = sap.ui.xmlfragment("com.taskman.fragment.Projects", this);
			this.getView().addDependent(this._oProjectDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oProjectDialog);
		},
		_getProjectDialog: function() {
			// if it hasn't been created before, create it 
			if (!this._oProjectDialog) {
				this._createProjectDialog();
			} else {
				// destroy and create dialog again to clear previous data 
				this._oProjectDialog.destroy();
				this._createProjectDialog();
			}
			return this._oProjectDialog;
		},
		onNewProjectPressed: function() {
			this.getView().byId("ShortProjectList").removeSelections(true);
			this._getProjectDialog().open();
		},
		onCancelProjectPressed: function() {
			this._oProjectDialog.close();
		},
		onSaveProjectPressed: function() {
			var oModel = this.getView().getModel("Data");
			var oModelData = oModel.getProperty("/Projects"); // get Projects path from JSON model
			if (this.getView().byId("ShortProjectList").getSelectedItem() === null) { // create new project if user doesn't select project 
				var lastProjectId = this.getView().getModel("Data").getData().Projects.length;
				var newProjectId = new Date().getTime().toString();
				var newProjectCode = sap.ui.getCore().byId("projectInput").getValue().toLowerCase();
				var newProject = {
					projectId: newProjectId,
					code: newProjectCode,
					title: sap.ui.getCore().byId("projectInput").getValue()
				};
				oModelData.push(newProject);
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectCreated"));
			} else {
				//var projectId = this.getView().byId("ShortProjectList").getSelectedItem().getBindingContext("Data").getProperty("projectId");
				oModelData[projectId].title = sap.ui.getCore().byId("projectInput").getValue(); // update selected project title
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectUpdated"));
			}
			oModel.setProperty("/Projects", oModelData); // update model after operation
			this._oProjectDialog.close();
		},
		onEditProjectPressed: function() {
			if (this.getView().byId("ShortProjectList").getSelectedItem() === null) {
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectNotSelected"));
			} else {
				this._getProjectDialog().open(); // open fragment selected project to update
				sap.ui.getCore().byId("projectInput").setValue(this.getView().getModel("Data").getData().Projects[projectId].title);
			}
		},
		onDeleteProjectPressed: function() {
			//var projectId = this.getView().byId("ShortProjectList").getSelectedItem().getBindingContext("Data").getProperty("projectId");
			if (this.getView().byId("ShortProjectList").getSelectedItem() === null) {
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectNotSelected"));
			} else {
				// delete project
				var oModel = this.getView().getModel("Data");
				var oModelData = oModel.getProperty("/Projects");
				var oData = this.getView().getModel("Data").getData();
				var projectIndex = oData.Projects.findIndex(function(Projects) { // find index of project to delete correct one from JSON model
					return Projects.projectId === projectId;
				});
				oModelData.splice(projectIndex, 1);
				oModel.setProperty("/Projects", oModelData);

				// delete related tasks
				var oTaskModelData = oModel.getProperty("/Tasks");
				oData.Tasks = oTaskModelData.filter(item => projectId !== item.projectId);

				// delete related comments
				var oCommentModelData = oModel.getProperty("/Comments");
				oData.Comments = oCommentModelData.filter(item => projectId !== item.projectId);
				oModel.refresh(true);
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectDeleted"));
			}
		},
		_createTaskDialog: function() { // create task dialog from fragment
			this._oTaskDialog = sap.ui.xmlfragment("com.taskman.fragment.Tasks", this);
			this.getView().addDependent(this._oTaskDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oTaskDialog);
		},
		_getTaskDialog: function() {
			// if it hasn't been created before, create it 
			if (!this._oTaskDialog) {
				this._createTaskDialog();
			} else {
				// destroy and create dialog again to clear previous data 
				this._oTaskDialog.destroy();
				this._createTaskDialog();
			}
			return this._oTaskDialog;
		},
		onNewTaskPressed: function() {
			if (this.getView().byId("ShortProjectList").getSelectedItem() === null) {
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("projectNotSelected"));
			} else {
				this.getView().byId("tableTask").removeSelections(true);
				this._getTaskDialog().open();
				sap.ui.getCore().byId("panelComment").setVisible(false); // make comment area invisible for new tasks to prevent possible false data entry in model 
			}
		},
		onCancelTaskPressed: function() {
			this._oTaskDialog.close();
		},
		// open task fragment with selected task information and post comments
		onEditTaskPressed: function() {
			this._getTaskDialog().open();
			var selectedTask = this.getView().byId("tableTask").getSelectedItem().getBindingContext("Data").getObject();
			sap.ui.getCore().byId("titleInput").setValue(selectedTask.title);
			sap.ui.getCore().byId("descInput").setValue(selectedTask.description);
			sap.ui.getCore().byId("statusSelect").setSelectedKey(selectedTask.stateId);
			sap.ui.getCore().byId("prioritySelect").setSelectedKey(selectedTask.priorityId);
			var filterByTaskId = new sap.ui.model.Filter("commentId", sap.ui.model.FilterOperator.EQ, selectedTask.commentId); // get related comments to task
			sap.ui.getCore().byId("listComments").getBinding("items").filter([filterByTaskId]);
		},
		onSaveTaskPressed: function() {
			var oModel = this.getView().getModel("Data");
			var oModelData = oModel.getProperty("/Tasks");
			var oTasks = this.getView().getModel("Data").getData().Tasks;
			if (this.getView().byId("tableTask").getSelectedItem() === null) { // create new task if user doesn't select task
				var lastTaskId = oTasks.length;
				var newTask = {
					projectId: projectId.toString(),
					taskId: new Date().getTime().toString(),
					stateId: sap.ui.getCore().byId("statusSelect").getSelectedKey(),
					priorityId: sap.ui.getCore().byId("prioritySelect").getSelectedKey(),
					title: sap.ui.getCore().byId("titleInput").getValue(),
					description: sap.ui.getCore().byId("descInput").getValue(),
					commentId: new Date().getTime().toString()
				};
				oModelData.push(newTask);
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("taskCreated"));
			} else { // update selected task
				var selectedTaskId = this.getView().byId("tableTask").getSelectedItem().getBindingContext("Data").getObject().taskId;
				oModelData[selectedTaskId].stateId = sap.ui.getCore().byId("statusSelect").getSelectedKey();
				oModelData[selectedTaskId].priorityId = sap.ui.getCore().byId("prioritySelect").getSelectedKey();
				oModelData[selectedTaskId].title = sap.ui.getCore().byId("titleInput").getValue();
				oModelData[selectedTaskId].description = sap.ui.getCore().byId("descInput").getValue();
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("taskUpdated"));
			}
			oModel.setProperty("/Tasks", oModelData);
			this._oTaskDialog.close();
		},
		onDeleteTaskPressed: function() {
			var oModel = this.getView().getModel("Data");
			var oModelData = oModel.getProperty("/Tasks");
			var oData = this.getView().getModel("Data").getData();
			var selectedTask = this.getView().byId("tableTask").getSelectedItem().getBindingContext("Data").getObject();
			var taskIndex = oData.Tasks.findIndex(function(Tasks) { // get task index to delete from JSON model
				return Tasks.taskId === selectedTask.taskId;
			});
			oModelData.splice(taskIndex, 1);
			oModel.setProperty("/Tasks", oModelData);
			// delete related comments
			var oCommentModelData = oModel.getProperty("/Comments");
			oData.Comments = oCommentModelData.filter(item => selectedTask.taskId !== item.taskId);
			oModel.refresh(true);
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("taskDeleted"));
			this._oTaskDialog.close();
		},
		onCommentPost: function(oEvent) { // post new comment
			var selectedTask = this.getView().byId("tableTask").getSelectedItem().getBindingContext("Data").getObject();
			var newComment = oEvent.getParameter("value");
			var oComment = {
				projectId: selectedTask.projectId.toString(),
				taskId: selectedTask.taskId.toString(),
				commentId: selectedTask.commentId.toString(),
				title: newComment
			};
			var oModel = this.getView().getModel("Data");
			var oModelData = oModel.getProperty("/Comments");
			oModelData.push(oComment);
			oModel.setProperty("/Comments", oModelData);
		}
	});
});