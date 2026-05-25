import { Emitter } from '../events';
export const EMPTY_DOCKVIEW_DRAG_SESSION = {
    sessionId: null,
    backend: null,
    state: 'idle',
};
function cloneSession(current, changes) {
    return Object.assign(Object.assign({}, current), changes);
}
export function getDragCoordinates(event) {
    var _a, _b;
    return {
        clientX: (_a = event.clientX) !== null && _a !== void 0 ? _a : 0,
        clientY: (_b = event.clientY) !== null && _b !== void 0 ? _b : 0,
    };
}
export function getDataTransferFromNativeEvent(event) {
    var _a;
    if (!event) {
        return undefined;
    }
    if ('dataTransfer' in event) {
        return (_a = event.dataTransfer) !== null && _a !== void 0 ? _a : undefined;
    }
    return undefined;
}
export function toDockviewDragInteraction(options) {
    var _a, _b, _c, _d, _e, _f;
    const { nativeEvent } = options;
    return {
        nativeEvent,
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
        preventDefault: () => nativeEvent.preventDefault(),
        stopPropagation: () => nativeEvent.stopPropagation(),
    };
}
export class DockviewDragSessionStore {
    constructor() {
        this._value = EMPTY_DOCKVIEW_DRAG_SESSION;
        this._onDidChange = new Emitter({ replay: true });
        this.onDidChange = this._onDidChange.event;
    }
    get value() {
        return this._value;
    }
    createPending(options) {
        var _a;
        return this.update({
            sessionId: `drag-session-${DockviewDragSessionStore.nextId++}`,
            backend: options.backend,
            state: 'pending',
            item: options.item,
            coordinates: options.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_a = options.nativeEvent) === null || _a === void 0 ? void 0 : _a.type,
        });
    }
    startDragging(options) {
        var _a, _b;
        const sessionId = (_a = this._value.sessionId) !== null && _a !== void 0 ? _a : `drag-session-${DockviewDragSessionStore.nextId++}`;
        return this.update({
            sessionId,
            backend: options.backend,
            state: 'dragging',
            item: options.item,
            coordinates: options.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_b = options.nativeEvent) === null || _b === void 0 ? void 0 : _b.type,
        });
    }
    updateCoordinates(coordinates, nativeEvent) {
        var _a;
        return this.update({
            coordinates,
            lastNativeEventType: (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.type) !== null && _a !== void 0 ? _a : this._value.lastNativeEventType,
        });
    }
    setActiveDropTarget(activeDropTarget, activeDropZone, coordinates, nativeEvent) {
        var _a;
        return this.update({
            state: this._value.state === 'idle'
                ? 'dragging'
                : this._value.state,
            activeDropTarget,
            activeDropZone,
            coordinates: coordinates !== null && coordinates !== void 0 ? coordinates : this._value.coordinates,
            lastNativeEventType: (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.type) !== null && _a !== void 0 ? _a : this._value.lastNativeEventType,
        });
    }
    clearActiveDropTarget(targetId) {
        if (targetId &&
            this._value.activeDropTarget &&
            this._value.activeDropTarget.id !== targetId) {
            return this._value;
        }
        return this.update({
            activeDropTarget: undefined,
            activeDropZone: undefined,
        });
    }
    markDropped(options) {
        var _a, _b, _c, _d, _e;
        return this.update({
            state: 'dropped',
            coordinates: (_a = options.coordinates) !== null && _a !== void 0 ? _a : this._value.coordinates,
            activeDropTarget: (_b = options.activeDropTarget) !== null && _b !== void 0 ? _b : this._value.activeDropTarget,
            activeDropZone: (_c = options.activeDropZone) !== null && _c !== void 0 ? _c : this._value.activeDropZone,
            lastNativeEventType: (_e = (_d = options.nativeEvent) === null || _d === void 0 ? void 0 : _d.type) !== null && _e !== void 0 ? _e : this._value.lastNativeEventType,
        });
    }
    markCancelled(options = {}) {
        var _a, _b, _c;
        return this.update({
            state: 'cancelled',
            coordinates: (_a = options.coordinates) !== null && _a !== void 0 ? _a : this._value.coordinates,
            activeDropTarget: undefined,
            activeDropZone: undefined,
            lastNativeEventType: (_c = (_b = options.nativeEvent) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : this._value.lastNativeEventType,
        });
    }
    reset() {
        this._value = EMPTY_DOCKVIEW_DRAG_SESSION;
        this._onDidChange.fire(this._value);
        return this._value;
    }
    dispose() {
        this._onDidChange.dispose();
    }
    update(changes) {
        this._value = cloneSession(this._value, changes);
        this._onDidChange.fire(this._value);
        return this._value;
    }
}
DockviewDragSessionStore.nextId = 0;
