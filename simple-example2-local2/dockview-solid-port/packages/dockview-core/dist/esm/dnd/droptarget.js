import { addTestId, toggleClass } from '../dom';
import { DockviewEvent, Emitter } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { clamp } from '../math';
import { getDragCoordinates, toDockviewDragInteraction, } from './dragSession';
function setGPUOptimizedBounds(element, bounds) {
    const { top, left, width, height } = bounds;
    const topPx = `${Math.round(top)}px`;
    const leftPx = `${Math.round(left)}px`;
    const widthPx = `${Math.round(width)}px`;
    const heightPx = `${Math.round(height)}px`;
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
    const { top, left, width, height } = bounds;
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
    const { top, left, width, height } = bounds;
    const topPx = `${Math.round(top)}px`;
    const leftPx = `${Math.round(left)}px`;
    const widthPx = `${Math.round(width)}px`;
    const heightPx = `${Math.round(height)}px`;
    return (element.style.top !== topPx ||
        element.style.left !== leftPx ||
        element.style.width !== widthPx ||
        element.style.height !== heightPx);
}
export class WillShowOverlayEvent extends DockviewEvent {
    get nativeEvent() {
        return this.options.nativeEvent;
    }
    get position() {
        return this.options.position;
    }
    get descriptor() {
        return this.options.descriptor;
    }
    constructor(options) {
        super();
        this.options = options;
    }
}
export function directionToPosition(direction) {
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
            throw new Error(`invalid direction '${direction}'`);
    }
}
export function positionToDirection(position) {
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
            throw new Error(`invalid position '${position}'`);
    }
}
const DEFAULT_ACTIVATION_SIZE = {
    value: 20,
    type: 'percentage',
};
const DEFAULT_SIZE = {
    value: 50,
    type: 'percentage',
};
const SMALL_WIDTH_BOUNDARY = 100;
const SMALL_HEIGHT_BOUNDARY = 100;
let dropTargetCounter = 0;
export class Droptarget extends CompositeDisposable {
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
    }
    get state() {
        return this._state;
    }
    get element() {
        return this.elementRef;
    }
    get descriptor() {
        return this.descriptorValue;
    }
    constructor(elementRef, options) {
        var _a, _b, _c, _d;
        super();
        this.elementRef = elementRef;
        this.options = options;
        this._onDrop = new Emitter();
        this.onDrop = this._onDrop.event;
        this._onWillShowOverlay = new Emitter();
        this.onWillShowOverlay = this._onWillShowOverlay.event;
        this._disabled = false;
        this._acceptedTargetZonesSet = new Set(this.options.acceptedTargetZones);
        this.descriptorValue = {
            id: `dockview-drop-target-${dropTargetCounter++}`,
            kind: (_b = (_a = this.options.targetDescriptor) === null || _a === void 0 ? void 0 : _a.kind) !== null && _b !== void 0 ? _b : 'generic',
            groupId: (_c = this.options.targetDescriptor) === null || _c === void 0 ? void 0 : _c.groupId,
            panelId: (_d = this.options.targetDescriptor) === null || _d === void 0 ? void 0 : _d.panelId,
        };
        Droptarget.REGISTRY.set(this.elementRef, this);
        this.dnd = new DragAndDropObserver(this.elementRef, {
            onDragEnter: () => {
                var _a, _b, _c;
                (_c = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.getElements();
            },
            onDragOver: (e) => {
                var _a, _b;
                const interaction = toDockviewDragInteraction({
                    nativeEvent: e,
                    currentTarget: this.elementRef,
                    backend: 'desktop',
                    session: (_b = (_a = this.options.dragSessionStore) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : {
                        sessionId: null,
                        backend: null,
                        state: 'idle',
                    },
                });
                this.handleExternalDragOver(interaction);
            },
            onDragLeave: () => {
                this.removeDropTarget();
            },
            onDragEnd: (e) => {
                var _a, _b, _c, _d;
                const target = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
                if (target && Droptarget.ACTUAL_TARGET === this && this._state) {
                    const interaction = toDockviewDragInteraction({
                        nativeEvent: e,
                        currentTarget: this.elementRef,
                        backend: 'desktop',
                        session: (_d = (_c = this.options.dragSessionStore) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : {
                            sessionId: null,
                            backend: null,
                            state: 'idle',
                        },
                    });
                    this.handleExternalDrop(interaction);
                    return;
                }
                this.removeDropTarget();
                target === null || target === void 0 ? void 0 : target.clear();
            },
            onDrop: (e) => {
                var _a, _b;
                const interaction = toDockviewDragInteraction({
                    nativeEvent: e,
                    currentTarget: this.elementRef,
                    backend: 'desktop',
                    session: (_b = (_a = this.options.dragSessionStore) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : {
                        sessionId: null,
                        backend: null,
                        state: 'idle',
                    },
                });
                this.handleExternalDrop(interaction);
            },
        });
        this.addDisposables(this._onDrop, this._onWillShowOverlay, this.dnd);
    }
    static getActiveTarget() {
        return Droptarget.ACTUAL_TARGET;
    }
    static clearActiveTarget() {
        var _a;
        (_a = Droptarget.ACTUAL_TARGET) === null || _a === void 0 ? void 0 : _a.removeDropTarget();
    }
    static findTargetsAtPoint(clientX, clientY, root) {
        var _a;
        const ownerDocument = (_a = root === null || root === void 0 ? void 0 : root.ownerDocument) !== null && _a !== void 0 ? _a : document;
        if (typeof ownerDocument.elementFromPoint !== 'function') {
            return [];
        }
        const hitElement = ownerDocument.elementFromPoint(clientX, clientY);
        if (!(hitElement instanceof HTMLElement)) {
            return [];
        }
        const targets = [];
        let current = hitElement;
        while (current) {
            const target = Droptarget.REGISTRY.get(current);
            if (target) {
                targets.push(target);
            }
            if (root && current === root) {
                break;
            }
            current = current.parentElement;
        }
        return targets.reverse();
    }
    setTargetZones(acceptedTargetZones) {
        this._acceptedTargetZonesSet = new Set(acceptedTargetZones);
    }
    setOverlayModel(model) {
        this.options.overlayModel = model;
    }
    handleExternalDragOver(input) {
        return this.renderDropTarget(input) !== null;
    }
    handleExternalDrop(input) {
        var _a, _b, _c, _d, _e;
        input.preventDefault();
        const state = this._state;
        this.removeDropTarget();
        (_c = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.clear();
        if (!state) {
            return false;
        }
        input.stopPropagation();
        (_d = this.options.dragSessionStore) === null || _d === void 0 ? void 0 : _d.markDropped({
            coordinates: getDragCoordinates(input.nativeEvent),
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
    }
    dispose() {
        this.removeDropTarget();
        Droptarget.REGISTRY.delete(this.elementRef);
        super.dispose();
    }
    markAsUsed(event) {
        event[Droptarget.USED_EVENT_ID] =
            true;
    }
    isAlreadyUsed(event) {
        const value = event[Droptarget.USED_EVENT_ID];
        return typeof value === 'boolean' && value;
    }
    renderDropTarget(input) {
        var _a, _b, _c, _d, _e, _f;
        if (this.disabled) {
            this.removeDropTarget();
            return null;
        }
        const overrideTarget = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (this._acceptedTargetZonesSet.size === 0) {
            this.removeDropTarget();
            return null;
        }
        const target = (_e = (_d = (_c = this.options).getOverlayOutline) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : this.elementRef;
        const width = target.offsetWidth;
        const height = target.offsetHeight;
        if (width === 0 || height === 0) {
            this.removeDropTarget();
            return null;
        }
        const rect = this.elementRef.getBoundingClientRect();
        const x = input.clientX - rect.left;
        const y = input.clientY - rect.top;
        const quadrant = this.calculateQuadrant(this._acceptedTargetZonesSet, x, y, width, height);
        if (this.isAlreadyUsed(input) || quadrant === null) {
            this.removeDropTarget();
            return null;
        }
        if (!this.options.canDisplayOverlay(input, quadrant)) {
            this.removeDropTarget();
            overrideTarget === null || overrideTarget === void 0 ? void 0 : overrideTarget.clear();
            return null;
        }
        const willShowOverlayEvent = new WillShowOverlayEvent({
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
            addTestId(this.overlayElement, 'dockview-drop-overlay');
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
    }
    toggleClasses(quadrant, width, height) {
        var _a, _b, _c, _d, _e, _f, _g;
        const target = (_b = (_a = this.options).getOverrideTarget) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (!target && !this.overlayElement) {
            return;
        }
        const isSmallX = width < SMALL_WIDTH_BOUNDARY;
        const isSmallY = height < SMALL_HEIGHT_BOUNDARY;
        const isLeft = quadrant === 'left';
        const isRight = quadrant === 'right';
        const isTop = quadrant === 'top';
        const isBottom = quadrant === 'bottom';
        const rightClass = !isSmallX && isRight;
        const leftClass = !isSmallX && isLeft;
        const topClass = !isSmallY && isTop;
        const bottomClass = !isSmallY && isBottom;
        let size = 1;
        const sizeOptions = (_d = (_c = this.options.overlayModel) === null || _c === void 0 ? void 0 : _c.size) !== null && _d !== void 0 ? _d : DEFAULT_SIZE;
        if (sizeOptions.type === 'percentage') {
            size = clamp(sizeOptions.value, 0, 100) / 100;
        }
        else {
            if (rightClass || leftClass) {
                size = clamp(0, sizeOptions.value, width) / width;
            }
            if (topClass || bottomClass) {
                size = clamp(0, sizeOptions.value, height) / height;
            }
        }
        if (target) {
            const outlineEl = (_g = (_f = (_e = this.options).getOverlayOutline) === null || _f === void 0 ? void 0 : _f.call(_e)) !== null && _g !== void 0 ? _g : this.elementRef;
            const elBox = outlineEl.getBoundingClientRect();
            const ta = target.getElements(undefined, outlineEl);
            const el = ta.root;
            const overlay = ta.overlay;
            const bigbox = el.getBoundingClientRect();
            const rootTop = elBox.top - bigbox.top;
            const rootLeft = elBox.left - bigbox.left;
            const box = {
                top: rootTop,
                left: rootLeft,
                width,
                height,
            };
            if (rightClass) {
                box.left = rootLeft + width * (1 - size);
                box.width = width * size;
            }
            else if (leftClass) {
                box.width = width * size;
            }
            else if (topClass) {
                box.height = height * size;
            }
            else if (bottomClass) {
                box.top = rootTop + height * (1 - size);
                box.height = height * size;
            }
            if (isSmallX && isLeft) {
                box.width = 4;
            }
            if (isSmallX && isRight) {
                box.left = rootLeft + width - 4;
                box.width = 4;
            }
            if (!checkBoundsChanged(overlay, box)) {
                this.applyOverlayMetadata(overlay, quadrant);
                return;
            }
            setGPUOptimizedBounds(overlay, box);
            overlay.className = `dv-drop-target-anchor${this.options.className ? ` ${this.options.className}` : ''}`;
            this.applyOverlayClasses(overlay, quadrant, isSmallX, isSmallY);
            if (ta.changed) {
                toggleClass(overlay, 'dv-drop-target-anchor-container-changed', true);
                setTimeout(() => {
                    toggleClass(overlay, 'dv-drop-target-anchor-container-changed', false);
                }, 10);
            }
            this.applyOverlayMetadata(overlay, quadrant);
            return;
        }
        if (!this.overlayElement) {
            return;
        }
        const box = { top: '0px', left: '0px', width: '100%', height: '100%' };
        if (rightClass) {
            box.left = `${100 * (1 - size)}%`;
            box.width = `${100 * size}%`;
        }
        else if (leftClass) {
            box.width = `${100 * size}%`;
        }
        else if (topClass) {
            box.height = `${100 * size}%`;
        }
        else if (bottomClass) {
            box.top = `${100 * (1 - size)}%`;
            box.height = `${100 * size}%`;
        }
        setGPUOptimizedBoundsFromStrings(this.overlayElement, box);
        this.applyOverlayClasses(this.overlayElement, quadrant, isSmallX, isSmallY);
        this.applyOverlayMetadata(this.overlayElement, quadrant);
    }
    applyOverlayClasses(overlay, quadrant, isSmallX, isSmallY) {
        const isLeft = quadrant === 'left';
        const isRight = quadrant === 'right';
        const isTop = quadrant === 'top';
        const isBottom = quadrant === 'bottom';
        toggleClass(overlay, 'dv-drop-target-small-vertical', isSmallY);
        toggleClass(overlay, 'dv-drop-target-small-horizontal', isSmallX);
        toggleClass(overlay, 'dv-drop-target-left', isLeft);
        toggleClass(overlay, 'dv-drop-target-right', isRight);
        toggleClass(overlay, 'dv-drop-target-top', isTop);
        toggleClass(overlay, 'dv-drop-target-bottom', isBottom);
        toggleClass(overlay, 'dv-drop-target-center', quadrant === 'center');
    }
    applyOverlayMetadata(overlay, quadrant) {
        addTestId(overlay, 'dockview-drop-overlay');
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
    }
    calculateQuadrant(overlayType, x, y, width, height) {
        var _a, _b;
        const activationSizeOptions = (_b = (_a = this.options.overlayModel) === null || _a === void 0 ? void 0 : _a.activationSize) !== null && _b !== void 0 ? _b : DEFAULT_ACTIVATION_SIZE;
        if (activationSizeOptions.type === 'percentage') {
            return calculateQuadrantAsPercentage(overlayType, x, y, width, height, activationSizeOptions.value);
        }
        return calculateQuadrantAsPixels(overlayType, x, y, width, height, activationSizeOptions.value);
    }
    removeDropTarget() {
        var _a, _b, _c, _d, _e;
        const activeTarget = Droptarget.ACTUAL_TARGET === this;
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
    }
}
Droptarget.REGISTRY = new WeakMap();
Droptarget.USED_EVENT_ID = '__dockview_droptarget_event_is_used__';
export function calculateQuadrantAsPercentage(overlayType, x, y, width, height, threshold) {
    const xp = (100 * x) / width;
    const yp = (100 * y) / height;
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
export function calculateQuadrantAsPixels(overlayType, x, y, width, height, threshold) {
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
