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
exports.Droptarget = exports.WillShowOverlayEvent = void 0;
exports.directionToPosition = directionToPosition;
exports.positionToDirection = positionToDirection;
exports.calculateQuadrantAsPercentage = calculateQuadrantAsPercentage;
exports.calculateQuadrantAsPixels = calculateQuadrantAsPixels;
var dom_1 = require("../dom");
var events_1 = require("../events");
var lifecycle_1 = require("../lifecycle");
var dnd_1 = require("./dnd");
var math_1 = require("../math");
var dragSession_1 = require("./dragSession");
function setGPUOptimizedBounds(element, bounds) {
    var top = bounds.top, left = bounds.left, width = bounds.width, height = bounds.height;
    var topPx = "".concat(Math.round(top), "px");
    var leftPx = "".concat(Math.round(left), "px");
    var widthPx = "".concat(Math.round(width), "px");
    var heightPx = "".concat(Math.round(height), "px");
    element.style.top = topPx;
    element.style.left = leftPx;
    element.style.width = widthPx;
    element.style.height = heightPx;
    element.style.visibility = 'visible';
    if (!element.style.transform || element.style.transform === '') {
        element.style.transform = 'translate3d(0, 0, 0)';
    }
}
function setGPUOptimizedBoundsFromStrings(element, bounds) {
    var top = bounds.top, left = bounds.left, width = bounds.width, height = bounds.height;
    element.style.top = top;
    element.style.left = left;
    element.style.width = width;
    element.style.height = height;
    element.style.visibility = 'visible';
    if (!element.style.transform || element.style.transform === '') {
        element.style.transform = 'translate3d(0, 0, 0)';
    }
}
function checkBoundsChanged(element, bounds) {
    var top = bounds.top, left = bounds.left, width = bounds.width, height = bounds.height;
    var topPx = "".concat(Math.round(top), "px");
    var leftPx = "".concat(Math.round(left), "px");
    var widthPx = "".concat(Math.round(width), "px");
    var heightPx = "".concat(Math.round(height), "px");
    return (element.style.top !== topPx ||
        element.style.left !== leftPx ||
        element.style.width !== widthPx ||
        element.style.height !== heightPx);
}
var WillShowOverlayEvent = /** @class */ (function (_super) {
    __extends(WillShowOverlayEvent, _super);
    function WillShowOverlayEvent(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        return _this;
    }
    Object.defineProperty(WillShowOverlayEvent.prototype, "nativeEvent", {
        get: function () {
            return this.options.nativeEvent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WillShowOverlayEvent.prototype, "position", {
        get: function () {
            return this.options.position;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WillShowOverlayEvent.prototype, "descriptor", {
        get: function () {
            return this.options.descriptor;
        },
        enumerable: false,
        configurable: true
    });
    return WillShowOverlayEvent;
}(events_1.DockviewEvent));
exports.WillShowOverlayEvent = WillShowOverlayEvent;
function directionToPosition(direction) {
    switch (direction) {
        case 'above':
            return 'top';
        case 'below':
            return 'bottom';
        case 'left':
            return 'left';
        case 'right':
            return 'right';
        case 'within':
            return 'center';
        default:
            throw new Error("invalid direction '".concat(direction, "'"));
    }
}
function positionToDirection(position) {
    switch (position) {
        case 'top':
            return 'above';
        case 'bottom':
            return 'below';
        case 'left':
            return 'left';
        case 'right':
            return 'right';
        case 'center':
            return 'within';
        default:
            throw new Error("invalid position '".concat(position, "'"));
    }
}
var DEFAULT_ACTIVATION_SIZE = {
    value: 20,
    type: 'percentage',
};
var DEFAULT_SIZE = {
    value: 50,
    type: 'percentage',
};
var SMALL_WIDTH_BOUNDARY = 100;
var SMALL_HEIGHT_BOUNDARY = 100;
var dropTargetCounter = 0;
var Droptarget = /** @class */ (function (_super) {
    __extends(Droptarget, _super);
    function Droptarget(elementRef, options) {
        var _a, _b, _c, _d;
        var _this = _super.call(this) || this;
        _this.elementRef = elementRef;
        _this.options = options;
        _this._onDrop = new events_1.Emitter();
        _this.onDrop = _this._onDrop.event;
        _this._onWillShowOverlay = new events_1.Emitter();
        _this.onWillShowOverlay = _this._onWillShowOverlay.event;
        _this._disabled = false;
        _this._acceptedTargetZonesSet = new Set(_this.options.acceptedTargetZones);
        _this.descriptorValue = {
            id: "dockview-drop-target-".concat(dropTargetCounter++),
            kind: (_b = (_a = _this.options.targetDescriptor) === null || _a === void 0 ? void 0 : _a.kind) !== null && _b !== void 0 ? _b : 'generic',
            groupId: (_c = _this.options.targetDescriptor) === null || _c === void 0 ? void 0 : _c.groupId,
            panelId: (_d = _this.options.targetDescriptor) === null || _d === void 0 ? void 0 : _d.panelId,
        };
        Droptarget.REGISTRY.set(_this.elementRef, _this);
        _this.dnd = new dnd_1.DragAndDropObserver(_this.elementRef, {
            onDragEnter: function () {
                var _a, _b, _c;
                (_c = (_b = (_a = _this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.getElements();
            },
            onDragOver: function (e) {
                var _a, _b;
                var interaction = (0, dragSession_1.toDockviewDragInteraction)({
                    nativeEvent: e,
                    currentTarget: _this.elementRef,
                    backend: 'desktop',
                    session: (_b = (_a = _this.options.dragSessionStore) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : {
                        sessionId: null,
                        backend: null,
                        state: 'idle',
                    },
                });
                _this.handleExternalDragOver(interaction);
            },
            onDragLeave: function () {
                _this.removeDropTarget();
            },
            onDragEnd: function (e) {
                var _a, _b, _c, _d;
                var target = (_b = (_a = _this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
                if (target && Droptarget.ACTUAL_TARGET === _this && _this._state) {
                    var interaction = (0, dragSession_1.toDockviewDragInteraction)({
                        nativeEvent: e,
                        currentTarget: _this.elementRef,
                        backend: 'desktop',
                        session: (_d = (_c = _this.options.dragSessionStore) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : {
                            sessionId: null,
                            backend: null,
                            state: 'idle',
                        },
                    });
                    _this.handleExternalDrop(interaction);
                    return;
                }
                _this.removeDropTarget();
                target === null || target === void 0 ? void 0 : target.clear();
            },
            onDrop: function (e) {
                var _a, _b;
                var interaction = (0, dragSession_1.toDockviewDragInteraction)({
                    nativeEvent: e,
                    currentTarget: _this.elementRef,
                    backend: 'desktop',
                    session: (_b = (_a = _this.options.dragSessionStore) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : {
                        sessionId: null,
                        backend: null,
                        state: 'idle',
                    },
                });
                _this.handleExternalDrop(interaction);
            },
        });
        _this.addDisposables(_this._onDrop, _this._onWillShowOverlay, _this.dnd);
        return _this;
    }
    Object.defineProperty(Droptarget.prototype, "disabled", {
        get: function () {
            return this._disabled;
        },
        set: function (value) {
            this._disabled = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Droptarget.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Droptarget.prototype, "element", {
        get: function () {
            return this.elementRef;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Droptarget.prototype, "descriptor", {
        get: function () {
            return this.descriptorValue;
        },
        enumerable: false,
        configurable: true
    });
    Droptarget.getActiveTarget = function () {
        return Droptarget.ACTUAL_TARGET;
    };
    Droptarget.clearActiveTarget = function () {
        var _a;
        (_a = Droptarget.ACTUAL_TARGET) === null || _a === void 0 ? void 0 : _a.removeDropTarget();
    };
    Droptarget.findTargetsAtPoint = function (clientX, clientY, root) {
        var _a;
        var ownerDocument = (_a = root === null || root === void 0 ? void 0 : root.ownerDocument) !== null && _a !== void 0 ? _a : document;
        if (typeof ownerDocument.elementFromPoint !== 'function') {
            return [];
        }
        var hitElement = ownerDocument.elementFromPoint(clientX, clientY);
        if (!(hitElement instanceof HTMLElement)) {
            return [];
        }
        var targets = [];
        var current = hitElement;
        while (current) {
            var target = Droptarget.REGISTRY.get(current);
            if (target) {
                targets.push(target);
            }
            if (root && current === root) {
                break;
            }
            current = current.parentElement;
        }
        return targets.reverse();
    };
    Droptarget.prototype.setTargetZones = function (acceptedTargetZones) {
        this._acceptedTargetZonesSet = new Set(acceptedTargetZones);
    };
    Droptarget.prototype.setOverlayModel = function (model) {
        this.options.overlayModel = model;
    };
    Droptarget.prototype.handleExternalDragOver = function (input) {
        return this.renderDropTarget(input) !== null;
    };
    Droptarget.prototype.handleExternalDrop = function (input) {
        var _a, _b, _c, _d, _e;
        input.preventDefault();
        var state = this._state;
        this.removeDropTarget();
        (_c = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.clear();
        if (!state) {
            return false;
        }
        input.stopPropagation();
        (_d = this.options.dragSessionStore) === null || _d === void 0 ? void 0 : _d.markDropped({
            coordinates: (0, dragSession_1.getDragCoordinates)(input.nativeEvent),
            nativeEvent: input.nativeEvent,
            activeDropTarget: this.descriptorValue,
            activeDropZone: state,
        });
        this._onDrop.fire({
            position: state,
            nativeEvent: input.nativeEvent,
            descriptor: this.descriptorValue,
        });
        if (input.backend === 'desktop') {
            (_e = this.options.dragSessionStore) === null || _e === void 0 ? void 0 : _e.reset();
        }
        return true;
    };
    Droptarget.prototype.dispose = function () {
        this.removeDropTarget();
        Droptarget.REGISTRY.delete(this.elementRef);
        _super.prototype.dispose.call(this);
    };
    Droptarget.prototype.markAsUsed = function (event) {
        event[Droptarget.USED_EVENT_ID] =
            true;
    };
    Droptarget.prototype.isAlreadyUsed = function (event) {
        var value = event[Droptarget.USED_EVENT_ID];
        return typeof value === 'boolean' && value;
    };
    Droptarget.prototype.renderDropTarget = function (input) {
        var _a, _b, _c, _d, _e, _f;
        if (this.disabled) {
            this.removeDropTarget();
            return null;
        }
        var overrideTarget = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (this._acceptedTargetZonesSet.size === 0) {
            this.removeDropTarget();
            return null;
        }
        var target = (_e = (_d = (_c = this.options).getOverlayOutline) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : this.elementRef;
        var width = target.offsetWidth;
        var height = target.offsetHeight;
        if (width === 0 || height === 0) {
            this.removeDropTarget();
            return null;
        }
        var rect = this.elementRef.getBoundingClientRect();
        var x = input.clientX - rect.left;
        var y = input.clientY - rect.top;
        var quadrant = this.calculateQuadrant(this._acceptedTargetZonesSet, x, y, width, height);
        if (this.isAlreadyUsed(input) || quadrant === null) {
            this.removeDropTarget();
            return null;
        }
        if (!this.options.canDisplayOverlay(input, quadrant)) {
            this.removeDropTarget();
            overrideTarget === null || overrideTarget === void 0 ? void 0 : overrideTarget.clear();
            return null;
        }
        var willShowOverlayEvent = new WillShowOverlayEvent({
            nativeEvent: input.nativeEvent,
            position: quadrant,
            descriptor: this.descriptorValue,
        });
        this._onWillShowOverlay.fire(willShowOverlayEvent);
        if (willShowOverlayEvent.defaultPrevented) {
            this.removeDropTarget();
            overrideTarget === null || overrideTarget === void 0 ? void 0 : overrideTarget.clear();
            return null;
        }
        this.markAsUsed(input);
        if (Droptarget.ACTUAL_TARGET && Droptarget.ACTUAL_TARGET !== this) {
            Droptarget.ACTUAL_TARGET.removeDropTarget();
        }
        Droptarget.ACTUAL_TARGET = this;
        if (!overrideTarget && !this.targetElement) {
            this.targetElement = document.createElement('div');
            this.targetElement.className = 'dv-drop-target-dropzone';
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'dv-drop-target-selection';
            (0, dom_1.addTestId)(this.overlayElement, 'dockview-drop-overlay');
            this.targetElement.appendChild(this.overlayElement);
            target.classList.add('dv-drop-target');
            target.append(this.targetElement);
        }
        this.toggleClasses(quadrant, width, height);
        this._state = quadrant;
        (_f = this.options.dragSessionStore) === null || _f === void 0 ? void 0 : _f.setActiveDropTarget(this.descriptorValue, quadrant, {
            clientX: input.clientX,
            clientY: input.clientY,
        }, input.nativeEvent);
        return quadrant;
    };
    Droptarget.prototype.toggleClasses = function (quadrant, width, height) {
        var _a, _b, _c, _d, _e, _f, _g;
        var target = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (!target && !this.overlayElement) {
            return;
        }
        var isSmallX = width < SMALL_WIDTH_BOUNDARY;
        var isSmallY = height < SMALL_HEIGHT_BOUNDARY;
        var isLeft = quadrant === 'left';
        var isRight = quadrant === 'right';
        var isTop = quadrant === 'top';
        var isBottom = quadrant === 'bottom';
        var rightClass = !isSmallX && isRight;
        var leftClass = !isSmallX && isLeft;
        var topClass = !isSmallY && isTop;
        var bottomClass = !isSmallY && isBottom;
        var size = 1;
        var sizeOptions = (_d = (_c = this.options.overlayModel) === null || _c === void 0 ? void 0 : _c.size) !== null && _d !== void 0 ? _d : DEFAULT_SIZE;
        if (sizeOptions.type === 'percentage') {
            size = (0, math_1.clamp)(sizeOptions.value, 0, 100) / 100;
        }
        else {
            if (rightClass || leftClass) {
                size = (0, math_1.clamp)(0, sizeOptions.value, width) / width;
            }
            if (topClass || bottomClass) {
                size = (0, math_1.clamp)(0, sizeOptions.value, height) / height;
            }
        }
        if (target) {
            var outlineEl = (_g = (_f = (_e = this.options).getOverlayOutline) === null || _f === void 0 ? void 0 : _f.call(_e)) !== null && _g !== void 0 ? _g : this.elementRef;
            var elBox = outlineEl.getBoundingClientRect();
            var ta = target.getElements(undefined, outlineEl);
            var el = ta.root;
            var overlay_1 = ta.overlay;
            var bigbox = el.getBoundingClientRect();
            var rootTop = elBox.top - bigbox.top;
            var rootLeft = elBox.left - bigbox.left;
            var box_1 = {
                top: rootTop,
                left: rootLeft,
                width: width,
                height: height,
            };
            if (rightClass) {
                box_1.left = rootLeft + width * (1 - size);
                box_1.width = width * size;
            }
            else if (leftClass) {
                box_1.width = width * size;
            }
            else if (topClass) {
                box_1.height = height * size;
            }
            else if (bottomClass) {
                box_1.top = rootTop + height * (1 - size);
                box_1.height = height * size;
            }
            if (isSmallX && isLeft) {
                box_1.width = 4;
            }
            if (isSmallX && isRight) {
                box_1.left = rootLeft + width - 4;
                box_1.width = 4;
            }
            if (!checkBoundsChanged(overlay_1, box_1)) {
                this.applyOverlayMetadata(overlay_1, quadrant);
                return;
            }
            setGPUOptimizedBounds(overlay_1, box_1);
            overlay_1.className = "dv-drop-target-anchor".concat(this.options.className ? " ".concat(this.options.className) : '');
            this.applyOverlayClasses(overlay_1, quadrant, isSmallX, isSmallY);
            if (ta.changed) {
                (0, dom_1.toggleClass)(overlay_1, 'dv-drop-target-anchor-container-changed', true);
                setTimeout(function () {
                    (0, dom_1.toggleClass)(overlay_1, 'dv-drop-target-anchor-container-changed', false);
                }, 10);
            }
            this.applyOverlayMetadata(overlay_1, quadrant);
            return;
        }
        if (!this.overlayElement) {
            return;
        }
        var box = { top: '0px', left: '0px', width: '100%', height: '100%' };
        if (rightClass) {
            box.left = "".concat(100 * (1 - size), "%");
            box.width = "".concat(100 * size, "%");
        }
        else if (leftClass) {
            box.width = "".concat(100 * size, "%");
        }
        else if (topClass) {
            box.height = "".concat(100 * size, "%");
        }
        else if (bottomClass) {
            box.top = "".concat(100 * (1 - size), "%");
            box.height = "".concat(100 * size, "%");
        }
        setGPUOptimizedBoundsFromStrings(this.overlayElement, box);
        this.applyOverlayClasses(this.overlayElement, quadrant, isSmallX, isSmallY);
        this.applyOverlayMetadata(this.overlayElement, quadrant);
    };
    Droptarget.prototype.applyOverlayClasses = function (overlay, quadrant, isSmallX, isSmallY) {
        var isLeft = quadrant === 'left';
        var isRight = quadrant === 'right';
        var isTop = quadrant === 'top';
        var isBottom = quadrant === 'bottom';
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-small-vertical', isSmallY);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-small-horizontal', isSmallX);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-left', isLeft);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-right', isRight);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-top', isTop);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-bottom', isBottom);
        (0, dom_1.toggleClass)(overlay, 'dv-drop-target-center', quadrant === 'center');
    };
    Droptarget.prototype.applyOverlayMetadata = function (overlay, quadrant) {
        (0, dom_1.addTestId)(overlay, 'dockview-drop-overlay');
        overlay.dataset.dropZone = quadrant;
        overlay.dataset.dropTargetKind = this.descriptorValue.kind;
        if (this.descriptorValue.groupId) {
            overlay.dataset.groupId = this.descriptorValue.groupId;
        }
        else {
            delete overlay.dataset.groupId;
        }
        if (typeof this.descriptorValue.panelId === 'string') {
            overlay.dataset.panelId = this.descriptorValue.panelId;
        }
        else {
            delete overlay.dataset.panelId;
        }
    };
    Droptarget.prototype.calculateQuadrant = function (overlayType, x, y, width, height) {
        var _a, _b;
        var activationSizeOptions = (_b = (_a = this.options.overlayModel) === null || _a === void 0 ? void 0 : _a.activationSize) !== null && _b !== void 0 ? _b : DEFAULT_ACTIVATION_SIZE;
        if (activationSizeOptions.type === 'percentage') {
            return calculateQuadrantAsPercentage(overlayType, x, y, width, height, activationSizeOptions.value);
        }
        return calculateQuadrantAsPixels(overlayType, x, y, width, height, activationSizeOptions.value);
    };
    Droptarget.prototype.removeDropTarget = function () {
        var _a, _b, _c, _d, _e;
        var activeTarget = Droptarget.ACTUAL_TARGET === this;
        this._state = undefined;
        (_c = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.clear();
        if (this.targetElement) {
            (_d = this.targetElement.parentElement) === null || _d === void 0 ? void 0 : _d.classList.remove('dv-drop-target');
            this.targetElement.remove();
            this.targetElement = undefined;
            this.overlayElement = undefined;
        }
        if (activeTarget) {
            Droptarget.ACTUAL_TARGET = undefined;
        }
        (_e = this.options.dragSessionStore) === null || _e === void 0 ? void 0 : _e.clearActiveDropTarget(this.descriptorValue.id);
    };
    Droptarget.REGISTRY = new WeakMap();
    Droptarget.USED_EVENT_ID = '__dockview_droptarget_event_is_used__';
    return Droptarget;
}(lifecycle_1.CompositeDisposable));
exports.Droptarget = Droptarget;
function calculateQuadrantAsPercentage(overlayType, x, y, width, height, threshold) {
    var xp = (100 * x) / width;
    var yp = (100 * y) / height;
    if (overlayType.has('left') && xp <= threshold) {
        return 'left';
    }
    if (overlayType.has('right') && xp >= 100 - threshold) {
        return 'right';
    }
    if (overlayType.has('top') && yp <= threshold) {
        return 'top';
    }
    if (overlayType.has('bottom') && yp >= 100 - threshold) {
        return 'bottom';
    }
    if (!overlayType.has('center')) {
        return null;
    }
    return 'center';
}
function calculateQuadrantAsPixels(overlayType, x, y, width, height, threshold) {
    if (overlayType.has('left') && x <= threshold) {
        return 'left';
    }
    if (overlayType.has('right') && x >= width - threshold) {
        return 'right';
    }
    if (overlayType.has('top') && y <= threshold) {
        return 'top';
    }
    if (overlayType.has('bottom') && y >= height - threshold) {
        return 'bottom';
    }
    if (!overlayType.has('center')) {
        return null;
    }
    return 'center';
}
