(function(f, define){
    define([ "../kendo.core" ], f);
})(function(){

(function(kendo) {
    'use strict';

    var $ = kendo.jQuery;

    var ACTIONS = {
       "up": "up",
       "down": "down",
       "left": "left",
       "right": "right",
       "home": "first-col",
       "ctrl+left": "first-col",
       "end": "last-col",
       "ctrl+right": "last-col",
       "ctrl+up": "first-row",
       "ctrl+down": "last-row",
       "ctrl+home": "first",
       "ctrl+end": "last",
       "pageup": "prev-page",
       "pagedown": "next-page"
    };

    var ENTRY_ACTIONS = {
        "tab": "next",
        "shift+tab": "previous",
        "enter": "lower",
        "shift+enter": "upper",
        "shift+:alphanum": "edit",
        ":alphanum": "edit",
        ":edit": "edit"
    };

    var CONTAINER_EVENTS = {
        "wheel": "onWheel",
        "*+mousedown": "onMouseDown",
        "contextmenu": "onContextMenu",
        "*+mousedrag": "onMouseDrag",
        "*+mouseup": "onMouseUp",
        "*+dblclick": "onDblClick"
    };

    var CLIPBOARD_EVENTS = {
        "*+pageup": "onPageUp",
        "*+pagedown": "onPageDown",
        "mouseup": "onMouseUp",
        "cut": "onCut",
        "paste": "onPaste",
        "copy": "onCopy"
    };

    var FORMULAINPUT_EVENTS = {
        "esc": "onEsc",
        "enter": "onEnter",
        "shift+enter": "onEnter",
        "tab": "onTab",
        "shift+tab": "onTab"
    };

    var SELECTION_MODES = {
       cell: "range",
       rowheader: "row",
       columnheader: "column",
       topcorner: "sheet"
    };

    var COMPOSITE_UNAVAILABLE_ACTION_SELECTORS = [ 'cut', 'copy', 'paste', 'insert-left', 'insert-right', 'insert-above', 'insert-below' ].map(function(action) {
        return '[data-action="' + action + '"]';
    }).join(",");


    var ACTION_KEYS = [];
    var SHIFT_ACTION_KEYS = [];
    var ENTRY_ACTION_KEYS = [];

    for (var key in ACTIONS) {
        ACTION_KEYS.push(key);
        SHIFT_ACTION_KEYS.push("shift+" + key);
    }

    for (key in ENTRY_ACTIONS) {
        ENTRY_ACTION_KEYS.push(key);
    }

    CLIPBOARD_EVENTS[ACTION_KEYS] = "onAction";
    CLIPBOARD_EVENTS[SHIFT_ACTION_KEYS] = "onShiftAction";
    CLIPBOARD_EVENTS[ENTRY_ACTION_KEYS] = "onEntryAction";

    function empty() {
        return "";
    }

    var Controller = kendo.Class.extend({
        init: function(view, workbook) {
            this.view = view;
            this.workbook(workbook);
            this.container = $(view.container);
            this.clipboardElement = $(view.clipboard);
            this.cellContextMenu = view.cellContextMenu;
            this.rowHeaderContextMenu = view.rowHeaderContextMenu;
            this.colHeaderContextMenu = view.colHeaderContextMenu;
            this.scroller = view.scroller;
            this.formulaInput = view.formulaInput;

            $(view.scroller).on("scroll", this.onScroll.bind(this));
            this.listener = new kendo.spreadsheet.EventListener(this.container, this, CONTAINER_EVENTS);
            this.keyListener = new kendo.spreadsheet.EventListener(this.clipboardElement, this, CLIPBOARD_EVENTS);
            this.inputKeyListener = new kendo.spreadsheet.EventListener(this.formulaInput.element, this, FORMULAINPUT_EVENTS);

            view.sheetsbar.bind("select", this.onSheetBarSelect.bind(this));
            view.sheetsbar.bind("reorder", this.onSheetBarReorder.bind(this));

            this.cellContextMenu.bind("select", this.onContextMenuSelect.bind(this));
            this.rowHeaderContextMenu.bind("select", this.onContextMenuSelect.bind(this));
            this.colHeaderContextMenu.bind("select", this.onContextMenuSelect.bind(this));

            // this is necessary for Windows to catch prevent context menu correctly
            this.cellContextMenu.element.add(this.rowHeaderContextMenu.element).add(this.colHeaderContextMenu.element).on("contextmenu", false);
        },

        onContextMenuSelect: function(e) {
                var action = $(e.item).data("action");
                switch(action) {
                    case "cut":
                        this.onCut();
                        break;
                    case "copy":
                        this.onCopy();
                        break;
                    case "paste":
                        this.onPaste(e);
                        break;
                    case "hide-row":
                        this.axisManager.hideSelectedRows();
                        break;
                    case "hide-column":
                        this.axisManager.hideSelectedColumns();
                        break;
                    case "delete-row":
                        this.axisManager.deleteSelectedRows();
                        break;
                    case "delete-column":
                        this.axisManager.deleteSelectedColumns();
                        break;
                }
        },

        onSheetBarSelect: function(e) {
            var sheet;

            if (e.isAddButton) {
                sheet = this._workbook.insertSheet();
            } else {
                sheet = this._workbook.sheetByName(e.name);
            }

            this._workbook.activeSheet(sheet);
        },

        onSheetBarReorder: function(e) {
            var sheet = this._workbook.sheetByIndex(e.oldIndex);

            this._workbook.moveSheetToIndex(sheet, e.newIndex);

            this._workbook.activeSheet(sheet);
        },

        sheet: function(sheet) {
            this.navigator = sheet.navigator();
            this.axisManager = sheet.axisManager();
        },

        workbook: function(workbook) {
            this._workbook = workbook;
            this.clipboard = workbook.clipboard();
        },

        refresh: function() {
            this._viewPortHeight = this.view.scroller.clientHeight;
            this.navigator.height(this._viewPortHeight);
        },

        onScroll: function() {
            this.view.render();
        },

        onWheel: function(event) {
            var deltaX = event.originalEvent.deltaX;
            var deltaY = event.originalEvent.deltaY;

            if (event.originalEvent.deltaMode === 1) {
                deltaX *= 10;
                deltaY *= 10;
            }

            this.scrollWith(deltaX, deltaY);

            event.preventDefault();
        },

        onAction: function(event, action) {
            this.navigator.moveActiveCell(ACTIONS[action]);
            event.preventDefault();
        },

        onPageUp: function() {
            this.scrollDown(-this._viewPortHeight);
        },

        onPageDown: function() {
            this.scrollDown(this._viewPortHeight);
        },

        onEntryAction: function(event, action) {
            if (action === ":alphanum" || action === ":edit") {
                var ref = this.view._sheet.activeCell();
                var value = "";

                if (action === ":edit") {
                    value = new kendo.spreadsheet.Range(ref, this.view._sheet)._editableValue();
                }

                this.formulaInput.activate({
                    rectangle: this.view.cellRectangle(ref),
                    value: value
                });

                $(this.view.scroller).on("scroll", kendo.throttle((function() {
                    this.formulaInput.position(this.view.cellRectangle(ref));
                }).bind(this), 50));
            } else {
                this.navigator.navigateInSelection(ENTRY_ACTIONS[action]);
                event.preventDefault();
            }
        },

        onShiftAction: function(event, action) {
            this.navigator.modifySelection(ACTIONS[action.replace("shift+", "")], this.appendSelection);
            event.preventDefault();
        },

        onMouseDown: function(event, action) {
            var object = this.objectAt(event);

            this.formulaInput.deactivate();

            if (object.pane) {
                this.originFrame = object.pane;
            }

            this._selectionMode = SELECTION_MODES[object.type];
            this.appendSelection = event.mod;
            this.navigator.startSelection(object.ref, this._selectionMode, this.appendSelection);
        },

        onContextMenu: function(event, action) {
            var that = this;

            event.preventDefault();

            this.cellContextMenu.close();
            this.colHeaderContextMenu.close();
            this.rowHeaderContextMenu.close();

            var menu;
            var ref;

            var location = { pageX: event.pageX, pageY: event.pageY };

            var object = this.objectAt(location);

            this.navigator.selectForContextMenu(object.ref, SELECTION_MODES[object.type]);

            var isComposite = this.navigator._sheet.select() instanceof kendo.spreadsheet.UnionRef;

            if (object.type === "cell") {
                menu = this.cellContextMenu;
            } else if (object.type == "columnheader") {
                menu = this.colHeaderContextMenu;
            } else if (object.type == "rowheader") {
                menu = this.rowHeaderContextMenu;
            }

            menu.element.find(COMPOSITE_UNAVAILABLE_ACTION_SELECTORS).toggle(!isComposite);

            // avoid the immediate close
            setTimeout(function() {
                menu.open(event.pageX, event.pageY);
            });
        },

        prevent: function(event) {
            event.preventDefault();
        },

        onMouseDrag: function(event, action) {
            if (this._selectionMode === "sheet") {
                return;
            }

            var location = { pageX: event.pageX, pageY: event.pageY };
            var object = this.objectAt(location);

            if (object.type === "outside") {
                this.startAutoScroll(object);
                return;
            }

            if (this.originFrame === object.pane) {
                this.selectToLocation(location);
            } else { // cross frame selection
                var frame = this.originFrame._grid;

                if (object.x > frame.right) {
                    this.scrollLeft();
                }

                if (object.y > frame.bottom) {
                    this.scrollTop();
                }

                if (object.y < frame.top || object.x < frame.left) {
                    this.startAutoScroll(object, location);
                } else {
                    this.selectToLocation(location);
                }
            }

            event.preventDefault();
        },

        onMouseUp: function(event, action) {
            this.navigator.completeSelection();
            this.stopAutoScroll();
        },

        onDblClick: function(event, action) {
            var ref = this.view._sheet.activeCell();
            var value = new kendo.spreadsheet.Range(ref, this.view._sheet)._editableValue();

            this.formulaInput.activate({
                rectangle: this.view.cellRectangle(ref),
                value: value
            });
        },

        onCut: function(event, action) {
            var command = new kendo.spreadsheet.CutCommand({ workbook: this.view._workbook });
            this.view._workbook.execute(command);
        },

        clipBoardValue: function() {
            return this.clipboardElement.html();
        },


        onPaste: function(e, action) {
            e.preventDefault();
            var html = "";
            var plain = "";
            if (e && e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
                if (/text\/html/.test(e.originalEvent.clipboardData.types)) {
                    html = e.originalEvent.clipboardData.getData('text/html');
                }
                if (/text\/plain/.test(e.originalEvent.clipboardData.types)) {
                    plain = e.originalEvent.clipboardData.getData('text/plain');
                }
            }
            this.clipboard.external({html: html, plain:plain});
            var command = new kendo.spreadsheet.PasteCommand({ workbook: this.view._workbook });
            this.view._workbook.execute(command);
        },

        onCopy: function(event, action) {
            var command = new kendo.spreadsheet.CopyCommand({ workbook: this.view._workbook });
            this.view._workbook.execute(command);
        },

////////////////////////////////////////////////////////////////////

        scrollTop: function() {
            this.scroller.scrollTop = 0;
        },

        scrollLeft: function() {
            this.scroller.scrollLeft = 0;
        },

        scrollDown: function(value) {
            this.scroller.scrollTop += value;
        },

        scrollRight: function(value) {
            this.scroller.scrollLeft += value;
        },

        scrollWith: function(right, down) {
            this.scroller.scrollTop += down;
            this.scroller.scrollLeft += right;
        },

        objectAt: function(location) {
            var offset = this.container.offset();
            var coordinates = {
                left: location.pageX - offset.left,
                top: location.pageY - offset.top
            };

            return this.view.objectAt(coordinates.left, coordinates.top);
        },

        selectToLocation: function(cellLocation) {
            var object = this.objectAt(cellLocation);

            if (object.pane) { // cell, rowheader or columnheader
                this.extendSelection(object);
                this.lastKnownCellLocation = cellLocation;
                this.originFrame = object.pane;
            }

            this.stopAutoScroll();
        },

        extendSelection: function(object) {
            this.navigator.extendSelection(object.ref, this._selectionMode, this.appendSelection);
        },

        autoScroll: function() {
            var x = this._autoScrollTarget.x;
            var y = this._autoScrollTarget.y;
            var boundaries = this.originFrame._grid;
            var scroller = this.view.scroller;
            var scrollStep = 8;
            var object;

            var scrollLeft = scroller.scrollLeft;
            var scrollTop = scroller.scrollTop;

            if (x < boundaries.left) {
                this.scrollRight(-scrollStep);
            }
            if (x > boundaries.right) {
                this.scrollRight(scrollStep);
            }
            if (y < boundaries.top) {
                this.scrollDown(-scrollStep);
            }
            if (y > boundaries.bottom) {
                this.scrollDown(scrollStep);
            }

            if (scrollTop === scroller.scrollTop && scrollLeft === scroller.scrollLeft) {
                this.selectToLocation(this.finalLocation);
            } else {
                this.extendSelection(this.objectAt(this.lastKnownCellLocation));
            }
        },

        startAutoScroll: function(viewObject, location) {
            if (!this._scrollInterval) {
                this._scrollInterval = setInterval(this.autoScroll.bind(this), 50);
            }

            this.finalLocation = location || this.lastKnownCellLocation;

            this._autoScrollTarget = viewObject;
        },

        stopAutoScroll: function() {
            clearInterval(this._scrollInterval);
            this._scrollInterval = null;
        },

////////////////////////////////////////////////////////////////////

        onEsc: function() {
            this.formulaInput.deactivate(true);
            this.clipboardElement.focus();
        },

        onEnter: function() {
            this.formulaInput.deactivate();
            this.clipboardElement.focus();
        },

        onTab: function() {
            this.formulaInput.deactivate();
            this.clipboardElement.focus();
        }
    });

    kendo.spreadsheet.Controller = Controller;
})(window.kendo);

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
