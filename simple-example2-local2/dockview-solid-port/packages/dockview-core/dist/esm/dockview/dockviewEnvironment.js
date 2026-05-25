import { addDisposableListener, Emitter } from '../events';
import { CompositeDisposable, Disposable } from '../lifecycle';
import { watchElementResize } from '../dom';
const COMPACT_LAYOUT_WIDTH = 720;
function mediaMatches(win, query) {
    return typeof win.matchMedia === 'function' && win.matchMedia(query).matches;
}
function getMobileHint(win) {
    const userAgentData = win.navigator.userAgentData;
    if (typeof (userAgentData === null || userAgentData === void 0 ? void 0 : userAgentData.mobile) === 'boolean') {
        return userAgentData.mobile;
    }
    return undefined;
}
function isMobileUserAgent(userAgent) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}
export function detectInteractionMode(win) {
    const hoverNone = mediaMatches(win, '(hover: none)');
    const hoverHover = mediaMatches(win, '(hover: hover)');
    const pointerCoarse = mediaMatches(win, '(pointer: coarse)');
    const pointerFine = mediaMatches(win, '(pointer: fine)');
    const anyHoverHover = mediaMatches(win, '(any-hover: hover)');
    const anyPointerFine = mediaMatches(win, '(any-pointer: fine)');
    const mobileHint = getMobileHint(win);
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
export function detectLayoutModeFromSize(width) {
    return width < COMPACT_LAYOUT_WIDTH ? 'compact' : 'full';
}
export class DockviewEnvironmentController extends CompositeDisposable {
    get interactionMode() {
        return this._interactionMode;
    }
    get layoutMode() {
        return this._layoutMode;
    }
    get value() {
        return {
            interactionMode: this._interactionMode,
            layoutMode: this._layoutMode,
            containerWidth: this._containerWidth,
            containerHeight: this._containerHeight,
        };
    }
    constructor(element) {
        var _a;
        super();
        this.element = element;
        this._containerWidth = 0;
        this._containerHeight = 0;
        this._onDidInteractionModeChange = new Emitter({ replay: true });
        this.onDidInteractionModeChange = this._onDidInteractionModeChange.event;
        this._onDidLayoutModeChange = new Emitter({ replay: true });
        this.onDidLayoutModeChange = this._onDidLayoutModeChange.event;
        this.win = (_a = element.ownerDocument.defaultView) !== null && _a !== void 0 ? _a : window;
        this._interactionMode = detectInteractionMode(this.win);
        const initialSize = this.readContainerSize();
        this._containerWidth = initialSize.width;
        this._containerHeight = initialSize.height;
        this._layoutMode = detectLayoutModeFromSize(this._containerWidth);
        const mediaQueries = [
            '(hover: none)',
            '(hover: hover)',
            '(pointer: coarse)',
            '(pointer: fine)',
            '(any-hover: hover)',
            '(any-pointer: fine)',
        ];
        this.addDisposables(this._onDidInteractionModeChange, this._onDidLayoutModeChange, watchElementResize(this.element, () => {
            this.updateLayoutMode();
        }), ...mediaQueries.map((query) => this.watchMediaQuery(query)), addDisposableListener(this.win, 'resize', () => {
            this.updateLayoutMode();
            this.updateInteractionMode();
        }));
        this._onDidInteractionModeChange.fire(this._interactionMode);
        this._onDidLayoutModeChange.fire(this._layoutMode);
    }
    updateInteractionMode() {
        const nextValue = detectInteractionMode(this.win);
        if (nextValue === this._interactionMode) {
            return;
        }
        this._interactionMode = nextValue;
        this._onDidInteractionModeChange.fire(this._interactionMode);
    }
    updateLayoutMode() {
        const size = this.readContainerSize();
        this._containerWidth = size.width;
        this._containerHeight = size.height;
        const nextValue = detectLayoutModeFromSize(this._containerWidth);
        if (nextValue === this._layoutMode) {
            return;
        }
        this._layoutMode = nextValue;
        this._onDidLayoutModeChange.fire(this._layoutMode);
    }
    readContainerSize() {
        const width = this.element.clientWidth ||
            this.element.getBoundingClientRect().width ||
            this.win.innerWidth;
        const height = this.element.clientHeight ||
            this.element.getBoundingClientRect().height ||
            this.win.innerHeight;
        return {
            width: Math.max(0, Math.round(width)),
            height: Math.max(0, Math.round(height)),
        };
    }
    watchMediaQuery(query) {
        var _a;
        if (typeof this.win.matchMedia !== 'function') {
            return Disposable.NONE;
        }
        const mediaQueryList = this.win.matchMedia(query);
        const listener = () => {
            this.updateInteractionMode();
        };
        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', listener);
            return Disposable.from(() => {
                mediaQueryList.removeEventListener('change', listener);
            });
        }
        const legacyMediaQueryList = mediaQueryList;
        (_a = legacyMediaQueryList.addListener) === null || _a === void 0 ? void 0 : _a.call(legacyMediaQueryList, listener);
        return Disposable.from(() => {
            var _a;
            (_a = legacyMediaQueryList.removeListener) === null || _a === void 0 ? void 0 : _a.call(legacyMediaQueryList, listener);
        });
    }
}
