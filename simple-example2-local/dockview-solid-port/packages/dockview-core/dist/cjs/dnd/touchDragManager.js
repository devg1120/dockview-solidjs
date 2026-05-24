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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockviewTouchDragManager = void 0;
var dom_1 = require("../dom");
var events_1 = require("../events");
var lifecycle_1 = require("../lifecycle");
var dragSession_1 = require("./dragSession");
var droptarget_1 = require("./droptarget");
var LONG_PRESS_DELAY_MS = 320;
var PENDING_CANCEL_DISTANCE_PX = 24;
var GHOST_OFFSET_X = 18;
var GHOST_OFFSET_Y = 18;
function getPointerTravelDistance(startX, startY, event) {
    var dx = event.clientX - startX;
    var dy = event.clientY - startY;
    return Math.hypot(dx, dy);
}
var TouchDragGhost = /** @class */ (function () {
    function TouchDragGhost(document, label) {
        this.element = document.createElement('div');
        this.element.className = 'dv-touch-drag-ghost';
        (0, dom_1.addTestId)(this.element, 'dockview-drag-ghost');
        this.element.textContent = label;
        document.body.appendChild(this.element);
    }
    TouchDragGhost.prototype.move = function (clientX, clientY) {
        this.element.style.transform = "translate3d(".concat(Math.round(clientX + GHOST_OFFSET_X), "px, ").concat(Math.round(clientY + GHOST_OFFSET_Y), "px, 0)");
    };
    TouchDragGhost.prototype.dispose = function () {
        this.element.remove();
    };
    return TouchDragGhost;
}());
var DockviewTouchDragManager = /** @class */ (function (_super) {
    __extends(DockviewTouchDragManager, _super);
    function DockviewTouchDragManager(rootElement, environment, dragSessionStore) {
        var _a;
        var _this = _super.call(this) || this;
        _this.rootElement = rootElement;
        _this.environment = environment;
        _this.dragSessionStore = dragSessionStore;
        _this.win = (_a = rootElement.ownerDocument.defaultView) !== null && _a !== void 0 ? _a : window;
        return _this;
    }
    DockviewTouchDragManager.prototype.registerSource = function (options) {
        var _this = this;
        return (0, events_1.addDisposableListener)(options.element, 'pointerdown', function (event) {
            _this.onPointerDown(event, options);
        });
    };
    DockviewTouchDragManager.prototype.dispose = function () {
        this.cleanupActiveSource();
        _super.prototype.dispose.call(this);
    };
    DockviewTouchDragManager.prototype.onPointerDown = function (event, options) {
        var _this = this;
        var _a;
        if (((_a = options.disabled) === null || _a === void 0 ? void 0 : _a.call(options)) ||
            this.environment.interactionMode !== 'touch' ||
            event.button !== 0 ||
            !event.isPrimary ||
            event.pointerType === 'mouse') {
            return;
        }
        this.cleanupActiveSource();
        var cleanup = new lifecycle_1.CompositeDisposable();
        var dragDataDisposable = new lifecycle_1.MutableDisposable();
        var contextMenuDisposable = (0, events_1.addDisposableListener)(this.win, 'contextmenu', function (contextEvent) {
            var _a;
            if (((_a = _this.activeSource) === null || _a === void 0 ? void 0 : _a.pointerId) === event.pointerId) {
                contextEvent.preventDefault();
            }
        }, true);
        var descriptor = options.getDescriptor();
        var state = {
            options: options,
            pointerId: event.pointerId,
            cleanup: cleanup,
            dragDataDisposable: dragDataDisposable,
            startX: event.clientX,
            startY: event.clientY,
            descriptor: descriptor,
            contextMenuDisposable: contextMenuDisposable,
            lastEvent: event,
            timer: undefined,
            started: false,
            hasPointerCapture: false,
            ghost: undefined,
        };
        state.timer = this.win.setTimeout(function () {
            _this.beginTouchDrag(state);
        }, LONG_PRESS_DELAY_MS);
        cleanup.addDisposables(dragDataDisposable, contextMenuDisposable, (0, events_1.addDisposableListener)(this.win, 'pointermove', function (moveEvent) {
            _this.onPointerMove(moveEvent);
        }, { capture: true, passive: false }), (0, events_1.addDisposableListener)(this.win, 'pointerup', function (upEvent) {
            _this.onPointerUp(upEvent);
        }, true), (0, events_1.addDisposableListener)(this.win, 'pointercancel', function (cancelEvent) {
            _this.onPointerCancel(cancelEvent);
        }, true), lifecycle_1.Disposable.from(function () {
            if (state.timer !== undefined) {
                _this.win.clearTimeout(state.timer);
                state.timer = undefined;
            }
        }));
        this.activeSource = state;
        this.dragSessionStore.createPending({
            backend: 'touch',
            item: descriptor,
            coordinates: (0, dragSession_1.getDragCoordinates)(event),
            nativeEvent: event,
        });
    };
    DockviewTouchDragManager.prototype.onPointerMove = function (event) {
        var e_1, _a;
        var _b;
        var state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        state.lastEvent = event;
        if (!state.started) {
            var movedFarEnough = getPointerTravelDistance(state.startX, state.startY, event) > PENDING_CANCEL_DISTANCE_PX;
            if (movedFarEnough) {
                this.cancelTouchDrag(event, false);
            }
            return;
        }
        event.preventDefault();
        this.dragSessionStore.updateCoordinates((0, dragSession_1.getDragCoordinates)(event), event);
        (_b = state.ghost) === null || _b === void 0 ? void 0 : _b.move(event.clientX, event.clientY);
        var candidates = droptarget_1.Droptarget.findTargetsAtPoint(event.clientX, event.clientY, this.rootElement);
        var accepted = false;
        try {
            for (var candidates_1 = __values(candidates), candidates_1_1 = candidates_1.next(); !candidates_1_1.done; candidates_1_1 = candidates_1.next()) {
                var candidate = candidates_1_1.value;
                var interaction = (0, dragSession_1.toDockviewDragInteraction)({
                    nativeEvent: event,
                    currentTarget: candidate.element,
                    backend: 'touch',
                    session: this.dragSessionStore.value,
                });
                if (candidate.handleExternalDragOver(interaction)) {
                    accepted = true;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (candidates_1_1 && !candidates_1_1.done && (_a = candidates_1.return)) _a.call(candidates_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (!accepted) {
            droptarget_1.Droptarget.clearActiveTarget();
            this.dragSessionStore.clearActiveDropTarget();
        }
    };
    DockviewTouchDragManager.prototype.onPointerUp = function (event) {
        var state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        state.lastEvent = event;
        if (!state.started) {
            this.cancelTouchDrag(event, false);
            return;
        }
        event.preventDefault();
        var activeDropTarget = droptarget_1.Droptarget.getActiveTarget();
        if (activeDropTarget) {
            var interaction = (0, dragSession_1.toDockviewDragInteraction)({
                nativeEvent: event,
                currentTarget: activeDropTarget.element,
                backend: 'touch',
                session: this.dragSessionStore.value,
            });
            if (activeDropTarget.handleExternalDrop(interaction)) {
                this.cleanupActiveSource('drop');
                return;
            }
        }
        this.cancelTouchDrag(event, true);
    };
    DockviewTouchDragManager.prototype.onPointerCancel = function (event) {
        var state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        this.cancelTouchDrag(event, true);
    };
    DockviewTouchDragManager.prototype.beginTouchDrag = function (state) {
        var _a, _b;
        if (this.activeSource !== state || state.started) {
            return;
        }
        state.started = true;
        (_b = (_a = state.options).setDraggingState) === null || _b === void 0 ? void 0 : _b.call(_a, true);
        state.options.element.classList.add('dv-dragged');
        state.dragDataDisposable.value = state.options.onDragStart(state.lastEvent);
        this.dragSessionStore.startDragging({
            backend: 'touch',
            item: state.descriptor,
            coordinates: (0, dragSession_1.getDragCoordinates)(state.lastEvent),
            nativeEvent: state.lastEvent,
        });
        state.ghost = new TouchDragGhost(this.rootElement.ownerDocument, state.options.getGhostLabel());
        state.ghost.move(state.lastEvent.clientX, state.lastEvent.clientY);
        try {
            state.options.element.setPointerCapture(state.pointerId);
            state.hasPointerCapture = true;
        }
        catch (_error) {
            state.hasPointerCapture = false;
        }
        this.onPointerMove(state.lastEvent);
    };
    DockviewTouchDragManager.prototype.cancelTouchDrag = function (event, markCancelled) {
        if (markCancelled || this.dragSessionStore.value.state === 'pending') {
            this.dragSessionStore.markCancelled({
                coordinates: (0, dragSession_1.getDragCoordinates)(event),
                nativeEvent: event,
            });
        }
        this.cleanupActiveSource();
    };
    DockviewTouchDragManager.prototype.cleanupActiveSource = function (reason) {
        var _a, _b, _c;
        if (reason === void 0) { reason = 'cancel'; }
        var state = this.activeSource;
        if (!state) {
            return;
        }
        this.activeSource = undefined;
        if (state.hasPointerCapture) {
            try {
                state.options.element.releasePointerCapture(state.pointerId);
            }
            catch (_error) {
                // ignored
            }
        }
        state.options.element.classList.remove('dv-dragged');
        (_b = (_a = state.options).setDraggingState) === null || _b === void 0 ? void 0 : _b.call(_a, false);
        (_c = state.ghost) === null || _c === void 0 ? void 0 : _c.dispose();
        state.cleanup.dispose();
        droptarget_1.Droptarget.clearActiveTarget();
        this.dragSessionStore.clearActiveDropTarget();
        this.dragSessionStore.reset();
        if (reason === 'cancel') {
            state.dragDataDisposable.dispose();
            return;
        }
        state.dragDataDisposable.dispose();
    };
    return DockviewTouchDragManager;
}(lifecycle_1.CompositeDisposable));
exports.DockviewTouchDragManager = DockviewTouchDragManager;
