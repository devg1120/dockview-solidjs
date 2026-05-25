"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSelectionTransfer = exports.DOCKVIEW_PANE_MIME_TYPE = exports.DOCKVIEW_PANEL_MIME_TYPE = exports.PaneTransfer = exports.PanelTransfer = void 0;
exports.beginPanelTransfer = beginPanelTransfer;
exports.beginPaneTransfer = beginPaneTransfer;
exports.setNativePanelData = setNativePanelData;
exports.getNativePanelData = getNativePanelData;
exports.hasNativePanelData = hasNativePanelData;
exports.setNativePaneData = setNativePaneData;
exports.getNativePaneData = getNativePaneData;
exports.getPanelData = getPanelData;
exports.hasPanelData = hasPanelData;
exports.isCrossWindowDrag = isCrossWindowDrag;
exports.getPanelDataWithNativeFallback = getPanelDataWithNativeFallback;
exports.getPaneData = getPaneData;
var TransferObject = /** @class */ (function () {
    function TransferObject() {
    }
    return TransferObject;
}());
var PanelTransfer = /** @class */ (function (_super) {
    __extends(PanelTransfer, _super);
    function PanelTransfer(viewId, groupId, panelId) {
        var _this = _super.call(this) || this;
        _this.viewId = viewId;
        _this.groupId = groupId;
        _this.panelId = panelId;
        return _this;
    }
    return PanelTransfer;
}(TransferObject));
exports.PanelTransfer = PanelTransfer;
var PaneTransfer = /** @class */ (function (_super) {
    __extends(PaneTransfer, _super);
    function PaneTransfer(viewId, paneId) {
        var _this = _super.call(this) || this;
        _this.viewId = viewId;
        _this.paneId = paneId;
        return _this;
    }
    return PaneTransfer;
}(TransferObject));
exports.PaneTransfer = PaneTransfer;
/**
 * MIME type for dockview panel transfer data.
 * Using a custom MIME type ensures our data doesn't conflict with other drag sources.
 */
exports.DOCKVIEW_PANEL_MIME_TYPE = 'application/x-dockview-panel';
exports.DOCKVIEW_PANE_MIME_TYPE = 'application/x-dockview-pane';
function beginPanelTransfer(data, dataTransfer) {
    var panelTransfer = LocalSelectionTransfer.getInstance();
    panelTransfer.setData([data], PanelTransfer.prototype);
    if (dataTransfer) {
        setNativePanelData(dataTransfer, data);
    }
    return {
        dispose: function () {
            panelTransfer.clearData(PanelTransfer.prototype);
        },
    };
}
function beginPaneTransfer(data, dataTransfer) {
    var paneTransfer = LocalSelectionTransfer.getInstance();
    paneTransfer.setData([data], PaneTransfer.prototype);
    if (dataTransfer) {
        setNativePaneData(dataTransfer, data);
    }
    return {
        dispose: function () {
            paneTransfer.clearData(PaneTransfer.prototype);
        },
    };
}
/**
 * Set panel transfer data on native dataTransfer for cross-window drag support.
 * This stores the data in the native dataTransfer object so it can be read
 * even when dragging between different windows.
 */
function setNativePanelData(dataTransfer, data) {
    try {
        var json = JSON.stringify({
            viewId: data.viewId,
            groupId: data.groupId,
            panelId: data.panelId,
        });
        dataTransfer.setData(exports.DOCKVIEW_PANEL_MIME_TYPE, json);
        // Also set as text/plain for debugging/compatibility
        dataTransfer.setData('text/plain', json);
    }
    catch (e) {
        console.warn('[dockview] Failed to set native panel data:', e);
    }
}
/**
 * Get panel transfer data from native dataTransfer for cross-window drag support.
 * Returns undefined if no valid dockview panel data is found.
 *
 * NOTE: This can only be called during 'drop' events. During 'dragover' events,
 * browsers block access to dataTransfer.getData() for security reasons.
 * Use hasNativePanelData() during dragover to check if panel data exists.
 */
function getNativePanelData(dataTransfer) {
    var _a;
    try {
        var json = dataTransfer.getData(exports.DOCKVIEW_PANEL_MIME_TYPE);
        if (!json) {
            return undefined;
        }
        var parsed = JSON.parse(json);
        if (parsed && typeof parsed.viewId === 'string' && typeof parsed.groupId === 'string') {
            return new PanelTransfer(parsed.viewId, parsed.groupId, (_a = parsed.panelId) !== null && _a !== void 0 ? _a : null);
        }
    }
    catch (e) {
        // Not valid JSON or not our data format
    }
    return undefined;
}
/**
 * Check if native dataTransfer contains dockview panel data.
 * This works during dragover events (unlike getData which is blocked).
 * Use this in canDisplayOverlay to detect cross-window drags.
 */
function hasNativePanelData(dataTransfer) {
    if (!dataTransfer)
        return false;
    return dataTransfer.types.includes(exports.DOCKVIEW_PANEL_MIME_TYPE);
}
/**
 * Set pane transfer data on native dataTransfer for cross-window drag support.
 */
function setNativePaneData(dataTransfer, data) {
    try {
        var json = JSON.stringify({
            viewId: data.viewId,
            paneId: data.paneId,
        });
        dataTransfer.setData(exports.DOCKVIEW_PANE_MIME_TYPE, json);
    }
    catch (e) {
        console.warn('[dockview] Failed to set native pane data:', e);
    }
}
/**
 * Get pane transfer data from native dataTransfer.
 */
function getNativePaneData(dataTransfer) {
    try {
        var json = dataTransfer.getData(exports.DOCKVIEW_PANE_MIME_TYPE);
        if (!json) {
            return undefined;
        }
        var parsed = JSON.parse(json);
        if (parsed && typeof parsed.viewId === 'string' && typeof parsed.paneId === 'string') {
            return new PaneTransfer(parsed.viewId, parsed.paneId);
        }
    }
    catch (e) {
        // Not valid JSON or not our data format
    }
    return undefined;
}
/**
 * A singleton to store transfer data during drag & drop operations that are only valid within the application.
 */
var LocalSelectionTransfer = /** @class */ (function () {
    function LocalSelectionTransfer() {
        // protect against external instantiation
    }
    LocalSelectionTransfer.getInstance = function () {
        return LocalSelectionTransfer.INSTANCE;
    };
    LocalSelectionTransfer.prototype.hasData = function (proto) {
        return proto && proto === this.proto;
    };
    LocalSelectionTransfer.prototype.clearData = function (proto) {
        if (this.hasData(proto)) {
            this.proto = undefined;
            this.data = undefined;
        }
    };
    LocalSelectionTransfer.prototype.getData = function (proto) {
        if (this.hasData(proto)) {
            return this.data;
        }
        return undefined;
    };
    LocalSelectionTransfer.prototype.setData = function (data, proto) {
        if (proto) {
            this.data = data;
            this.proto = proto;
        }
    };
    LocalSelectionTransfer.INSTANCE = new LocalSelectionTransfer();
    return LocalSelectionTransfer;
}());
exports.LocalSelectionTransfer = LocalSelectionTransfer;
function getPanelData() {
    var panelTransfer = LocalSelectionTransfer.getInstance();
    var isPanelEvent = panelTransfer.hasData(PanelTransfer.prototype);
    if (!isPanelEvent) {
        return undefined;
    }
    return panelTransfer.getData(PanelTransfer.prototype)[0];
}
/**
 * Check if panel data exists (either local or cross-window).
 * This is safe to call during dragover events.
 * Use this in canDisplayOverlay to determine if the drop overlay should be shown.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns true if this is a dockview panel drag (same-window or cross-window)
 */
function hasPanelData(dataTransfer) {
    // First check the local (same-window) transfer
    var localData = getPanelData();
    if (localData) {
        return true;
    }
    // Fall back to checking native dataTransfer types for cross-window drags
    // (We can't call getData() during dragover, but we can check types)
    if (dataTransfer) {
        return hasNativePanelData(dataTransfer);
    }
    return false;
}
/**
 * Check if this is a cross-window drag (has native data but no local data).
 * Safe to call during dragover events.
 */
function isCrossWindowDrag(dataTransfer) {
    var hasLocal = getPanelData() !== undefined;
    var hasNative = dataTransfer ? hasNativePanelData(dataTransfer) : false;
    return !hasLocal && hasNative;
}
/**
 * Get panel data, with fallback to native dataTransfer for cross-window drag support.
 *
 * WARNING: This should only be called during 'drop' events, not 'dragover'.
 * For dragover, use hasPanelData() to check if panel data exists.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns Panel transfer data from either LocalSelectionTransfer or native dataTransfer
 */
function getPanelDataWithNativeFallback(dataTransfer) {
    // First check the local (same-window) transfer
    var localData = getPanelData();
    if (localData) {
        return localData;
    }
    // Fall back to native dataTransfer for cross-window drags
    if (dataTransfer) {
        return getNativePanelData(dataTransfer);
    }
    return undefined;
}
function getPaneData() {
    var paneTransfer = LocalSelectionTransfer.getInstance();
    var isPanelEvent = paneTransfer.hasData(PaneTransfer.prototype);
    if (!isPanelEvent) {
        return undefined;
    }
    return paneTransfer.getData(PaneTransfer.prototype)[0];
}
