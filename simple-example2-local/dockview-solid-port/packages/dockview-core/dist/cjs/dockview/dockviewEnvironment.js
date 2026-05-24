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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockviewEnvironmentController = void 0;
exports.detectInteractionMode = detectInteractionMode;
exports.detectLayoutModeFromSize = detectLayoutModeFromSize;
var events_1 = require("../events");
var lifecycle_1 = require("../lifecycle");
var dom_1 = require("../dom");
var COMPACT_LAYOUT_WIDTH = 720;
function mediaMatches(win, query) {
    return typeof win.matchMedia === 'function' && win.matchMedia(query).matches;
}
function getMobileHint(win) {
    var userAgentData = win.navigator.userAgentData;
    if (typeof (userAgentData === null || userAgentData === void 0 ? void 0 : userAgentData.mobile) === 'boolean') {
        return userAgentData.mobile;
    }
    return undefined;
}
function isMobileUserAgent(userAgent) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}
function detectInteractionMode(win) {
    var hoverNone = mediaMatches(win, '(hover: none)');
    var hoverHover = mediaMatches(win, '(hover: hover)');
    var pointerCoarse = mediaMatches(win, '(pointer: coarse)');
    var pointerFine = mediaMatches(win, '(pointer: fine)');
    var anyHoverHover = mediaMatches(win, '(any-hover: hover)');
    var anyPointerFine = mediaMatches(win, '(any-pointer: fine)');
    var mobileHint = getMobileHint(win);
    if (pointerCoarse && hoverNone) {
        return 'touch';
    }
    if (pointerFine && hoverHover) {
        return 'desktop';
    }
    if (pointerCoarse && !pointerFine) {
        return 'touch';
    }
    if (hoverNone && !anyPointerFine && !anyHoverHover) {
        return 'touch';
    }
    if (mobileHint === true && (pointerCoarse || hoverNone)) {
        return 'touch';
    }
    if (anyPointerFine && anyHoverHover) {
        return 'desktop';
    }
    if (pointerFine || hoverHover) {
        return 'desktop';
    }
    if (mobileHint === true) {
        return 'touch';
    }
    return isMobileUserAgent(win.navigator.userAgent) ? 'touch' : 'desktop';
}
function detectLayoutModeFromSize(width) {
    return width < COMPACT_LAYOUT_WIDTH ? 'compact' : 'full';
}
var DockviewEnvironmentController = /** @class */ (function (_super) {
    __extends(DockviewEnvironmentController, _super);
    function DockviewEnvironmentController(element) {
        var _a;
        var _this = _super.call(this) || this;
        _this.element = element;
        _this._containerWidth = 0;
        _this._containerHeight = 0;
        _this._onDidInteractionModeChange = new events_1.Emitter({ replay: true });
        _this.onDidInteractionModeChange = _this._onDidInteractionModeChange.event;
        _this._onDidLayoutModeChange = new events_1.Emitter({ replay: true });
        _this.onDidLayoutModeChange = _this._onDidLayoutModeChange.event;
        _this.win = (_a = element.ownerDocument.defaultView) !== null && _a !== void 0 ? _a : window;
        _this._interactionMode = detectInteractionMode(_this.win);
        var initialSize = _this.readContainerSize();
        _this._containerWidth = initialSize.width;
        _this._containerHeight = initialSize.height;
        _this._layoutMode = detectLayoutModeFromSize(_this._containerWidth);
        var mediaQueries = [
            '(hover: none)',
            '(hover: hover)',
            '(pointer: coarse)',
            '(pointer: fine)',
            '(any-hover: hover)',
            '(any-pointer: fine)',
        ];
        _this.addDisposables.apply(_this, __spreadArray(__spreadArray([_this._onDidInteractionModeChange,
            _this._onDidLayoutModeChange,
            (0, dom_1.watchElementResize)(_this.element, function () {
                _this.updateLayoutMode();
            })], __read(mediaQueries.map(function (query) { return _this.watchMediaQuery(query); })), false), [(0, events_1.addDisposableListener)(_this.win, 'resize', function () {
                _this.updateLayoutMode();
                _this.updateInteractionMode();
            })], false));
        _this._onDidInteractionModeChange.fire(_this._interactionMode);
        _this._onDidLayoutModeChange.fire(_this._layoutMode);
        return _this;
    }
    Object.defineProperty(DockviewEnvironmentController.prototype, "interactionMode", {
        get: function () {
            return this._interactionMode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DockviewEnvironmentController.prototype, "layoutMode", {
        get: function () {
            return this._layoutMode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DockviewEnvironmentController.prototype, "value", {
        get: function () {
            return {
                interactionMode: this._interactionMode,
                layoutMode: this._layoutMode,
                containerWidth: this._containerWidth,
                containerHeight: this._containerHeight,
            };
        },
        enumerable: false,
        configurable: true
    });
    DockviewEnvironmentController.prototype.updateInteractionMode = function () {
        var nextValue = detectInteractionMode(this.win);
        if (nextValue === this._interactionMode) {
            return;
        }
        this._interactionMode = nextValue;
        this._onDidInteractionModeChange.fire(this._interactionMode);
    };
    DockviewEnvironmentController.prototype.updateLayoutMode = function () {
        var size = this.readContainerSize();
        this._containerWidth = size.width;
        this._containerHeight = size.height;
        var nextValue = detectLayoutModeFromSize(this._containerWidth);
        if (nextValue === this._layoutMode) {
            return;
        }
        this._layoutMode = nextValue;
        this._onDidLayoutModeChange.fire(this._layoutMode);
    };
    DockviewEnvironmentController.prototype.readContainerSize = function () {
        var width = this.element.clientWidth ||
            this.element.getBoundingClientRect().width ||
            this.win.innerWidth;
        var height = this.element.clientHeight ||
            this.element.getBoundingClientRect().height ||
            this.win.innerHeight;
        return {
            width: Math.max(0, Math.round(width)),
            height: Math.max(0, Math.round(height)),
        };
    };
    DockviewEnvironmentController.prototype.watchMediaQuery = function (query) {
        var _this = this;
        var _a;
        if (typeof this.win.matchMedia !== 'function') {
            return lifecycle_1.Disposable.NONE;
        }
        var mediaQueryList = this.win.matchMedia(query);
        var listener = function () {
            _this.updateInteractionMode();
        };
        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', listener);
            return lifecycle_1.Disposable.from(function () {
                mediaQueryList.removeEventListener('change', listener);
            });
        }
        var legacyMediaQueryList = mediaQueryList;
        (_a = legacyMediaQueryList.addListener) === null || _a === void 0 ? void 0 : _a.call(legacyMediaQueryList, listener);
        return lifecycle_1.Disposable.from(function () {
            var _a;
            (_a = legacyMediaQueryList.removeListener) === null || _a === void 0 ? void 0 : _a.call(legacyMediaQueryList, listener);
        });
    };
    return DockviewEnvironmentController;
}(lifecycle_1.CompositeDisposable));
exports.DockviewEnvironmentController = DockviewEnvironmentController;
