"use strict";
// packages/dockview-core/src/dockview/externalDetach.ts
/**
 * External detach/reattach functionality for dockview.
 *
 * This module provides opt-in support for detaching panels to external windows
 * (e.g., Tauri windows) and reattaching them later.
 *
 * Design principles:
 * - Dockview only emits events; it doesn't open network sockets
 * - Panel serialization is handled via request-serialize events
 * - Panels self-register their serializers
 * - Visual affordances are CSS-based
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalDetachController = void 0;
var events_1 = require("../events");
var DEFAULT_CONFIG = {
    allowExternalDetach: false,
    dragOutsideClassName: 'dv-external-detach-allowed',
    edgeThreshold: 50,
    detachHandler: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ accept: false, error: 'No detach handler configured' })];
    }); }); },
};
/**
 * External detach controller for dockview.
 *
 * Attach this to a DockviewComponent to enable external detach functionality.
 */
var ExternalDetachController = /** @class */ (function () {
    function ExternalDetachController(config) {
        if (config === void 0) { config = {}; }
        this._onDragExit = new events_1.Emitter();
        this.onDragExit = this._onDragExit.event;
        this._onDropOutside = new events_1.Emitter();
        this.onDropOutside = this._onDropOutside.event;
        this._onDragReturn = new events_1.Emitter();
        this.onDragReturn = this._onDragReturn.event;
        this._onSerializeRequest = new events_1.Emitter();
        this.onSerializeRequest = this._onSerializeRequest.event;
        this.isOutsideWindow = false;
        this.currentDragMeta = null;
        /** Panels that have been detached (tracked for reattach) */
        this.detachedPanels = new Map();
        /** Panel serializers registered by panels */
        this.panelSerializers = new Map();
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
    }
    Object.defineProperty(ExternalDetachController.prototype, "allowExternalDetach", {
        /** Check if external detach is allowed */
        get: function () {
            return this.config.allowExternalDetach;
        },
        /** Set whether external detach is allowed */
        set: function (value) {
            this.config.allowExternalDetach = value;
        },
        enumerable: false,
        configurable: true
    });
    /** Update configuration */
    ExternalDetachController.prototype.updateConfig = function (config) {
        this.config = __assign(__assign({}, this.config), config);
    };
    /**
     * Register a serializer for a panel.
     * Panels should call this to opt-in to state serialization.
     */
    ExternalDetachController.prototype.registerSerializer = function (panelId, serializer) {
        var _this = this;
        this.panelSerializers.set(panelId, serializer);
        return function () {
            _this.panelSerializers.delete(panelId);
        };
    };
    /**
     * Handle drag start - track the panel being dragged.
     */
    ExternalDetachController.prototype.handleDragStart = function (panel, group) {
        if (!this.config.allowExternalDetach)
            return;
        this.currentDragMeta = {
            panelId: panel.id,
            panelType: panel.view.contentComponent,
            groupId: group.id,
            panel: panel,
            group: group,
        };
        this.isOutsideWindow = false;
    };
    /**
     * Handle drag over - check if we're outside the window bounds.
     */
    ExternalDetachController.prototype.handleDragOver = function (event) {
        if (!this.config.allowExternalDetach || !this.currentDragMeta)
            return;
        var isNowOutside = this.isOutsideBounds(event);
        if (isNowOutside && !this.isOutsideWindow) {
            // Just exited the window
            this.isOutsideWindow = true;
            this._onDragExit.fire({
                panelMeta: this.currentDragMeta,
                screenCoords: { x: event.screenX, y: event.screenY },
                nativeEvent: event,
            });
            // Add visual indicator
            document.body.classList.add(this.config.dragOutsideClassName);
        }
        else if (!isNowOutside && this.isOutsideWindow) {
            // Returned to the window
            this.isOutsideWindow = false;
            this._onDragReturn.fire({
                panelId: this.currentDragMeta.panelId,
                nativeEvent: event,
            });
            // Remove visual indicator
            document.body.classList.remove(this.config.dragOutsideClassName);
        }
    };
    /**
     * Handle drag end - check if dropped outside.
     */
    ExternalDetachController.prototype.handleDragEnd = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var meta, screenCoords, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.allowExternalDetach || !this.currentDragMeta) {
                            this.cleanup();
                            return [2 /*return*/];
                        }
                        meta = this.currentDragMeta;
                        // Remove visual indicator
                        document.body.classList.remove(this.config.dragOutsideClassName);
                        if (!this.isOutsideWindow) return [3 /*break*/, 4];
                        screenCoords = { x: event.screenX, y: event.screenY };
                        // Fire drop outside event
                        this._onDropOutside.fire({
                            panelMeta: meta,
                            screenCoords: screenCoords,
                            nativeEvent: event,
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.config.detachHandler(meta.panelId, screenCoords, meta)];
                    case 2:
                        result = _a.sent();
                        if (result.accept) {
                            // Record as detached
                            this.detachedPanels.set(meta.panelId, {
                                meta: meta,
                                serializedState: result.serializedState,
                            });
                        }
                        else {
                            console.warn("[ExternalDetach] Detach rejected for panel '".concat(meta.panelId, "': ").concat(result.error));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[ExternalDetach] Detach handler error for panel '".concat(meta.panelId, "':"), error_1);
                        return [3 /*break*/, 4];
                    case 4:
                        this.cleanup();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Request serialization of a panel's state.
     * Returns a promise that resolves with the state or rejects on timeout.
     */
    ExternalDetachController.prototype.requestSerializePanel = function (panelId_1) {
        return __awaiter(this, arguments, void 0, function (panelId, timeoutMs) {
            var serializer;
            var _this = this;
            if (timeoutMs === void 0) { timeoutMs = 5000; }
            return __generator(this, function (_a) {
                serializer = this.panelSerializers.get(panelId);
                if (serializer) {
                    return [2 /*return*/, serializer()];
                }
                // Fall back to event-based serialization
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timeout = setTimeout(function () {
                            reject(new Error("Serialize request timed out for panel: ".concat(panelId)));
                        }, timeoutMs);
                        _this._onSerializeRequest.fire({
                            panelId: panelId,
                            respond: function (state) {
                                clearTimeout(timeout);
                                resolve(state);
                            },
                        });
                    })];
            });
        });
    };
    /**
     * Accept a panel reattachment from an external window.
     * This should be called by the host application when a detached panel
     * needs to be reinserted into the dockview layout.
     */
    ExternalDetachController.prototype.acceptExternalReattach = function (panelId, serializedState) {
        return __awaiter(this, void 0, void 0, function () {
            var detached;
            return __generator(this, function (_a) {
                detached = this.detachedPanels.get(panelId);
                if (!detached) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Panel '".concat(panelId, "' is not tracked as detached"),
                        }];
                }
                // Remove from detached tracking
                this.detachedPanels.delete(panelId);
                // The actual panel recreation should be handled by the host application
                // via the dockview API. This just cleans up tracking.
                return [2 /*return*/, { success: true }];
            });
        });
    };
    /**
     * Check if a panel is currently detached.
     */
    ExternalDetachController.prototype.isDetached = function (panelId) {
        return this.detachedPanels.has(panelId);
    };
    /**
     * Get the list of detached panel IDs.
     */
    ExternalDetachController.prototype.getDetachedPanelIds = function () {
        return Array.from(this.detachedPanels.keys());
    };
    /**
     * Get detached panel info.
     */
    ExternalDetachController.prototype.getDetachedPanel = function (panelId) {
        return this.detachedPanels.get(panelId);
    };
    /**
     * Dispose the controller.
     */
    ExternalDetachController.prototype.dispose = function () {
        this._onDragExit.dispose();
        this._onDropOutside.dispose();
        this._onDragReturn.dispose();
        this._onSerializeRequest.dispose();
        this.detachedPanels.clear();
        this.panelSerializers.clear();
        this.cleanup();
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    ExternalDetachController.prototype.isOutsideBounds = function (event) {
        var threshold = this.config.edgeThreshold;
        var innerWidth = window.innerWidth, innerHeight = window.innerHeight;
        // Check if near window edges or outside
        var isNearLeft = event.clientX < threshold;
        var isNearRight = event.clientX > innerWidth - threshold;
        var isNearTop = event.clientY < threshold;
        var isNearBottom = event.clientY > innerHeight - threshold;
        // Also check if completely outside (clientX/Y will be 0 or near it)
        var isCompletelyOutside = event.clientX <= 0 ||
            event.clientY <= 0 ||
            event.clientX >= innerWidth ||
            event.clientY >= innerHeight;
        return isCompletelyOutside || (isNearLeft || isNearRight || isNearTop || isNearBottom);
    };
    ExternalDetachController.prototype.cleanup = function () {
        this.currentDragMeta = null;
        this.isOutsideWindow = false;
        document.body.classList.remove(this.config.dragOutsideClassName);
    };
    return ExternalDetachController;
}());
exports.ExternalDetachController = ExternalDetachController;
