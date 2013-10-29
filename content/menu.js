const domWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIWebNavigation)
	.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	.rootTreeItem
	.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIDOMWindow)
	.wrappedJSObject;
const domDocument = domWindow.document;

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://menufilter/content/menu.jsm");

let windowURL, menuID;
let menuIDList = document.getElementById("menuid");
let menuItemList = document.getElementById("menu");
let showButton = document.getElementById("show");
let hideButton = document.getElementById("hide");

if (Services.appinfo.name == "Firefox") {
	windowURL = "chrome://browser/content/browser.xul";
	document.documentElement.classList.add("isfirefox");
	menuIDList.selectedItem = menuIDList.querySelector(".firefox");
} else {
	windowURL = "chrome://messenger/content/messenger.xul";
	document.documentElement.classList.add("isthunderbird");
}

showButton.disabled = hideButton.disabled = true;
menuChosen(menuIDList.value);

function menuChosen(aID) {
	menuID = aID;
	displayMenu();
}

function displayMenu() {
	while (menuItemList.lastElementChild) {
		menuItemList.removeChild(menuItemList.lastElementChild);
	}
	HiddenMenuItems.getList(windowURL, menuID).then(_displayMenu);
}

function _displayMenu(aList) {
	let menu = domDocument.getElementById(menuID);
	MenuFilter.ensureItemsHaveIDs(menu);
	for (let menuitem of menu.children) {
		let item = document.createElement("listitem");
		switch (menuitem.localName) {
		case "menuitem":
			item.setAttribute("label", menuitem.label || menuitem.id);
			break;
		case "menu":
			item.setAttribute("label", menuitem.label || menuitem.getAttribute("label") || menuitem.id);
			item.classList.add("menu");
			break;
		case "menuseparator":
			item.classList.add("separator");
			break;
		}
		if (menuitem.id) {
			item.setAttribute("value", menuitem.id);
			if (aList.indexOf(menuitem.id) >= 0) {
				item.classList.add("hidden");
			}
		} else {
			item.setAttribute("disabled", "true");
		}
		menuItemList.appendChild(item);
	}
}

function selectionChanged() {
	let hideEnabled, showEnabled;
	for (let option of menuItemList.selectedItems) {
		if (!option.disabled) {
			if (option.classList.contains("hidden")) {
				showEnabled = true;
			} else {
				hideEnabled = true;
			}
		}
	}
	showButton.disabled = !showEnabled;
	hideButton.disabled = !hideEnabled;
}

function showSelection() {
	let toShow = [];
	for (let option of menuItemList.selectedItems) {
		if (!option.disabled) {
			toShow.push(option.value);
			option.classList.remove("hidden");
		}
	}
	HiddenMenuItems.remove(windowURL, menuID, toShow);
	selectionChanged();
	menuItemList.focus();
}

function hideSelection() {
	let toHide = [];
	for (let option of menuItemList.selectedItems) {
		if (!option.disabled) {
			toHide.push(option.value);
			option.classList.add("hidden");
		}
	}
	HiddenMenuItems.add(windowURL, menuID, toHide);
	selectionChanged();
	menuItemList.focus();
}