import { addTestId } from '../dom';
import { addDisposableListener } from '../events';
import { CompositeDisposable, Disposable, MutableDisposable, } from '../lifecycle';
import { getDragCoordinates, toDockviewDragInteraction, } from './dragSession';
import { Droptarget } from './droptarget';
const LONG_PRESS_DELAY_MS = 320;
const PENDING_CANCEL_DISTANCE_PX = 24;
const GHOST_OFFSET_X = 18;
const GHOST_OFFSET_Y = 18;
function getPointerTravelDistance(startX, startY, event) {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    return Math.hypot(dx, dy);
}
class TouchDragGhost {
    constructor(document, label) {
        this.element = document.createElement('div');
        this.element.className = 'dv-touch-drag-ghost';
        addTestId(this.element, 'dockview-drag-ghost');
        this.element.textContent = label;
        document.body.appendChild(this.element);
    }
    move(clientX, clientY) {
        this.element.style.transform = `translate3d(${Math.round(clientX + GHOST_OFFSET_X)}px, ${Math.round(clientY + GHOST_OFFSET_Y)}px, 0)`;
    }
    dispose() {
        this.element.remove();
    }
}
export class DockviewTouchDragManager extends CompositeDisposable {
    constructor(rootElement, environment, dragSessionStore) {
        var _a;
        super();
        this.rootElement = rootElement;
        this.environment = environment;
        this.dragSessionStore = dragSessionStore;
        this.win = (_a = rootElement.ownerDocument.defaultView) !== null && _a !== void 0 ? _a : window;
    }
    registerSource(options) {
        return addDisposableListener(options.element, 'pointerdown', (event) => {
            this.onPointerDown(event, options);
        });
    }
    dispose() {
        this.cleanupActiveSource();
        super.dispose();
    }
    onPointerDown(event, options) {
        var _a;
        if (((_a = options.disabled) === null || _a === void 0 ? void 0 : _a.call(options)) ||
            this.environment.interactionMode !== 'touch' ||
            event.button !== 0 ||
            !event.isPrimary ||
            event.pointerType === 'mouse') {
            return;
        }
        this.cleanupActiveSource();
        const cleanup = new CompositeDisposable();
        const dragDataDisposable = new MutableDisposable();
        const contextMenuDisposable = addDisposableListener(this.win, 'contextmenu', (contextEvent) => {
            var _a;
            if (((_a = this.activeSource) === null || _a === void 0 ? void 0 : _a.pointerId) === event.pointerId) {
                contextEvent.preventDefault();
            }
        }, true);
        const descriptor = options.getDescriptor();
        const state = {
            options,
            pointerId: event.pointerId,
            cleanup,
            dragDataDisposable,
            startX: event.clientX,
            startY: event.clientY,
            descriptor,
            contextMenuDisposable,
            lastEvent: event,
            timer: undefined,
            started: false,
            hasPointerCapture: false,
            ghost: undefined,
        };
        state.timer = this.win.setTimeout(() => {
            this.beginTouchDrag(state);
        }, LONG_PRESS_DELAY_MS);
        cleanup.addDisposables(dragDataDisposable, contextMenuDisposable, addDisposableListener(this.win, 'pointermove', (moveEvent) => {
            this.onPointerMove(moveEvent);
        }, { capture: true, passive: false }), addDisposableListener(this.win, 'pointerup', (upEvent) => {
            this.onPointerUp(upEvent);
        }, true), addDisposableListener(this.win, 'pointercancel', (cancelEvent) => {
            this.onPointerCancel(cancelEvent);
        }, true), Disposable.from(() => {
            if (state.timer !== undefined) {
                this.win.clearTimeout(state.timer);
                state.timer = undefined;
            }
        }));
        this.activeSource = state;
        this.dragSessionStore.createPending({
            backend: 'touch',
            item: descriptor,
            coordinates: getDragCoordinates(event),
            nativeEvent: event,
        });
    }
    onPointerMove(event) {
        var _a;
        const state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        state.lastEvent = event;
        if (!state.started) {
            const movedFarEnough = getPointerTravelDistance(state.startX, state.startY, event) > PENDING_CANCEL_DISTANCE_PX;
            if (movedFarEnough) {
                this.cancelTouchDrag(event, false);
            }
            return;
        }
        event.preventDefault();
        this.dragSessionStore.updateCoordinates(getDragCoordinates(event), event);
        (_a = state.ghost) === null || _a === void 0 ? void 0 : _a.move(event.clientX, event.clientY);
        const candidates = Droptarget.findTargetsAtPoint(event.clientX, event.clientY, this.rootElement);
        let accepted = false;
        for (const candidate of candidates) {
            const interaction = toDockviewDragInteraction({
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
        if (!accepted) {
            Droptarget.clearActiveTarget();
            this.dragSessionStore.clearActiveDropTarget();
        }
    }
    onPointerUp(event) {
        const state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        state.lastEvent = event;
        if (!state.started) {
            this.cancelTouchDrag(event, false);
            return;
        }
        event.preventDefault();
        const activeDropTarget = Droptarget.getActiveTarget();
        if (activeDropTarget) {
            const interaction = toDockviewDragInteraction({
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
    }
    onPointerCancel(event) {
        const state = this.activeSource;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }
        this.cancelTouchDrag(event, true);
    }
    beginTouchDrag(state) {
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
            coordinates: getDragCoordinates(state.lastEvent),
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
    }
    cancelTouchDrag(event, markCancelled) {
        if (markCancelled || this.dragSessionStore.value.state === 'pending') {
            this.dragSessionStore.markCancelled({
                coordinates: getDragCoordinates(event),
                nativeEvent: event,
            });
        }
        this.cleanupActiveSource();
    }
    cleanupActiveSource(reason = 'cancel') {
        var _a, _b, _c;
        const state = this.activeSource;
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
        Droptarget.clearActiveTarget();
        this.dragSessionStore.clearActiveDropTarget();
        this.dragSessionStore.reset();
        if (reason === 'cancel') {
            state.dragDataDisposable.dispose();
            return;
        }
        state.dragDataDisposable.dispose();
    }
}
