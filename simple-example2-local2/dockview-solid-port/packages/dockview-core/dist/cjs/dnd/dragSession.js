"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockviewDragSessionStore = exports.EMPTY_DOCKVIEW_DRAG_SESSION = void 0;
exports.getDragCoordinates = getDragCoordinates;
exports.getDataTransferFromNativeEvent = getDataTransferFromNativeEvent;
exports.toDockviewDragInteraction = toDockviewDragInteraction;
var events_1 = require("../events");
exports.EMPTY_DOCKVIEW_DRAG_SESSION = {
    sessionId: null,
    backend: null,
    state: 'idle',
};
function cloneSession(current, changes) {
    return __assign(__assign({}, current), changes);
}
function getDragCoordinates(event) {
    var _a, _b;
    return {
        clientX: (_a = event.clientX) !== null && _a !== void 0 ? _a : 0,
        clientY: (_b = event.clientY) !== null && _b !== void 0 ? _b : 0,
    };
}
function getDataTransferFromNativeEvent(event) {
    var _a;
    if (!event) {
        return undefined;
    }
    if ('dataTransfer' in event) {
        return (_a = event.dataTransfer) !== null && _a !== void 0 ? _a : undefined;
    }
    return undefined;
}
function toDockviewDragInteraction(options) {
    var _a, _b, _c, _d, _e, _f;
    var nativeEvent = options.nativeEvent;
    return {
        nativeEvent: nativeEvent,
        currentTarget: options.currentTarget,
        target: nativeEvent.target,
        backend: options.backend,
        session: options.session,
        clientX: (_a = nativeEvent.clientX) !== null && _a !== void 0 ? _a : 0,
        clientY: (_b = nativeEvent.clientY) !== null && _b !== void 0 ? _b : 0,
        dataTransfer: getDataTransferFromNativeEvent(nativeEvent),
        shiftKey: (_c = nativeEvent.shiftKey) !== null && _c !== void 0 ? _c : false,
        altKey: (_d = nativeEvent.altKey) !== null && _d !== void 0 ? _d : false,
        ctrlKey: (_e = nativeEvent.ctrlKey) !== null && _e !== void 0 ? _e : false,
        metaKey: (_f = nativeEvent.metaKey) !== null && _f !== void 0 ? _f : false,
        preventDefault: function () { return nativeEvent.preventDefault(); },
        stopPropagation: function () { return nativeEvent.stopPropagation(); },
    };
}
var DockviewDragSessionStore = /** @class */ (function () {
    function DockviewDragSessionStore() {
        this._value = exports.EMPTY_DOCKVIEW_DRAG_SESSION;
        this._onDidChange = new events_1.Emitter({ replay: true });
        this.onDidChange = this._onDidChange.event;
    }
    Object.defineProperty(DockviewDragSessionStore.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    DockviewDragSessionStore.prototype.createPending = function (options) {
        var _a;
        return this.update({
            sessionId: "drag-session-".concat(DockviewDragSessionStore.nextId++),
            backend: options.backend,
            state: 'pending',
            item: options.item,
            coordinates: options.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_a = options.nativeEvent) === null || _a === void 0 ? void 0 : _a.type,
        });
    };
    DockviewDragSessionStore.prototype.startDragging = function (options) {
        var _a, _b;
        var sessionId = (_a = this._value.sessionId) !== null && _a !== void 0 ? _a : "drag-session-".concat(DockviewDragSessionStore.nextId++);
        return this.update({
            sessionId: sessionId,
            backend: options.backend,
            state: 'dragging',
            item: options.item,
            coordinates: options.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_b = options.nativeEvent) === null || _b === void 0 ? void 0 : _b.type,
        });
    };
    DockviewDragSessionStore.prototype.updateCoordinates = function (coordinates, nativeEvent) {
        var _a;
        return this.update({
            coordinates: coordinates,
            lastNativeEventType: (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.type) !== null && _a !== void 0 ? _a : this._value.lastNativeEventType,
        });
    };
    DockviewDragSessionStore.prototype.setActiveDropTarget = function (activeDropTarget, activeDropZone, coordinates, nativeEvent) {
        var _a;
        return this.update({
            state: this._value.state === 'idle'
                ? 'dragging'
                : this._value.state,
            activeDropTarget: activeDropTarget,
            activeDropZone: activeDropZone,
            coordinates: coordinates !== null && coordinates !== void 0 ? coordinates : this._value.coordinates,
            lastNativeEventType: (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.type) !== null && _a !== void 0 ? _a : this._value.lastNativeEventType,
        });
    };
    DockviewDragSessionStore.prototype.clearActiveDropTarget = function (targetId) {
        if (targetId &&
            this._value.activeDropTarget &&
            this._value.activeDropTarget.id !== targetId) {
            return this._value;
        }
        return this.update({
            activeDropTarget: undefined,
            activeDropZone: undefined,
        });
    };
    DockviewDragSessionStore.prototype.markDropped = function (options) {
        var _a, _b, _c, _d, _e;
        return this.update({
            state: 'dropped',
            coordinates: (_a = options.coordinates) !== null && _a !== void 0 ? _a : this._value.coordinates,
            activeDropTarget: (_b = options.activeDropTarget) !== null && _b !== void 0 ? _b : this._value.activeDropTarget,
            activeDropZone: (_c = options.activeDropZone) !== null && _c !== void 0 ? _c : this._value.activeDropZone,
            lastNativeEventType: (_e = (_d = options.nativeEvent) === null || _d === void 0 ? void 0 : _d.type) !== null && _e !== void 0 ? _e : this._value.lastNativeEventType,
        });
    };
    DockviewDragSessionStore.prototype.markCancelled = function (options) {
        var _a, _b, _c;
        if (options === void 0) { options = {}; }
        return this.update({
            state: 'cancelled',
            coordinates: (_a = options.coordinates) !== null && _a !== void 0 ? _a : this._value.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_c = (_b = options.nativeEvent) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : this._value.lastNativeEventType,
        });
    };
    DockviewDragSessionStore.prototype.reset = function () {
        this._value = exports.EMPTY_DOCKVIEW_DRAG_SESSION;
        this._onDidChange.fire(this._value);
        return this._value;
    };
    DockviewDragSessionStore.prototype.dispose = function () {
        this._onDidChange.dispose();
    };
    DockviewDragSessionStore.prototype.update = function (changes) {
        this._value = cloneSession(this._value, changes);
        this._onDidChange.fire(this._value);
        return this._value;
    };
    DockviewDragSessionStore.nextId = 0;
    return DockviewDragSessionStore;
}());
exports.DockviewDragSessionStore = DockviewDragSessionStore;
