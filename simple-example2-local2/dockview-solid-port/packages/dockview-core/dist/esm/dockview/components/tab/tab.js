import { addDisposableListener, Emitter } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { beginPanelTransfer, getPanelData, hasPanelData, isCrossWindowDrag, PanelTransfer, } from '../../../dnd/dataTransfer';
import { addTestId, toggleClass } from '../../../dom';
import { Droptarget, } from '../../../dnd/droptarget';
import { DragHandler } from '../../../dnd/abstractDragHandler';
import { addGhostImage } from '../../../dnd/ghost';
class TabDragHandler extends DragHandler {
    constructor(element, accessor, group, panel, disabled) {
        super(element, disabled);
        this.accessor = accessor;
        this.group = group;
        this.panel = panel;
    }
    getData(event) {
        const transfer = new PanelTransfer(this.accessor.id, this.group.id, this.panel.id);
        return beginPanelTransfer(transfer, event.dataTransfer);
    }
}
export class Tab extends CompositeDisposable {
    get element() {
        return this._element;
    }
    constructor(panel, accessor, group) {
        super();
        this.panel = panel;
        this.accessor = accessor;
        this.group = group;
        this.content = undefined;
        this._onPointDown = new Emitter();
        this.onPointerDown = this._onPointDown.event;
        this._onContextMenu = new Emitter();
        this.onContextMenu = this._onContextMenu.event;
        this._onDropped = new Emitter();
        this.onDrop = this._onDropped.event;
        this._onDragStart = new Emitter();
        this.onDragStart = this._onDragStart.event;
        this._element = document.createElement('div');
        this._element.className = 'dv-tab';
        this._element.tabIndex = 0;
        this._element.draggable = !this.accessor.options.disableDnd;
        addTestId(this._element, 'dockview-tab');
        this._element.dataset.groupId = this.group.id;
        this._element.dataset.panelId = this.panel.id;
        toggleClass(this.element, 'dv-inactive-tab', true);
        this.dragHandler = new TabDragHandler(this._element, this.accessor, this.group, this.panel, !!this.accessor.options.disableDnd);
        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: { activationSize: { value: 50, type: 'percentage' } },
            dragSessionStore: this.accessor.dragSessionStore,
            targetDescriptor: {
                kind: 'tab',
                groupId: this.group.id,
                panelId: this.panel.id,
            },
            canDisplayOverlay: (event, position) => {
                if (this.group.locked) {
                    return false;
                }
                const hasData = hasPanelData(event.dataTransfer);
                const localData = getPanelData();
                const crossWindow = isCrossWindowDrag(event.dataTransfer);
                if (hasData) {
                    if (localData && this.accessor.id === localData.viewId) {
                        return true;
                    }
                    if (crossWindow) {
                        return true;
                    }
                }
                return this.group.model.canDisplayOverlay(event, position, 'tab');
            },
            getOverrideTarget: () => { var _a; return (_a = group.model.dropTargetContainer) === null || _a === void 0 ? void 0 : _a.model; },
        });
        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;
        this.addDisposables(this._onPointDown, this._onContextMenu, this._onDropped, this._onDragStart, this.dragHandler.onDragStart((event) => {
            this.accessor.beginNativeDragSession(this.getDragDescriptor(), event);
            if (event.dataTransfer) {
                const style = getComputedStyle(this.element);
                const newNode = this.element.cloneNode(true);
                Array.from(style).forEach((key) => newNode.style.setProperty(key, style.getPropertyValue(key), style.getPropertyPriority(key)));
                newNode.style.position = 'absolute';
                addGhostImage(event.dataTransfer, newNode, {
                    y: -10,
                    x: 30,
                });
            }
            this._onDragStart.fire(event);
        }), this.dragHandler.onDragEnd((event) => {
            this.accessor.completeNativeDragSession(event);
        }), this.dragHandler, this.accessor.touchDragManager.registerSource({
            element: this._element,
            disabled: () => !!this.accessor.options.disableDnd,
            getDescriptor: () => this.getDragDescriptor(),
            getGhostLabel: () => { var _a; return (_a = this.panel.title) !== null && _a !== void 0 ? _a : this.panel.id; },
            onDragStart: (event) => {
                this._onDragStart.fire(event);
                return beginPanelTransfer(new PanelTransfer(this.accessor.id, this.group.id, this.panel.id));
            },
            setDraggingState: (isDragging) => {
                toggleClass(this.element, 'dv-tab-dragging', isDragging);
            },
        }), addDisposableListener(this._element, 'pointerdown', (event) => {
            this._onPointDown.fire(event);
        }), addDisposableListener(this._element, 'contextmenu', (event) => {
            this._onContextMenu.fire(event);
        }), this.dropTarget.onDrop((event) => {
            this._onDropped.fire(event);
        }), this.dropTarget);
    }
    setActive(isActive) {
        toggleClass(this.element, 'dv-active-tab', isActive);
        toggleClass(this.element, 'dv-inactive-tab', !isActive);
    }
    setContent(part) {
        if (this.content) {
            this._element.removeChild(this.content.element);
        }
        this.content = part;
        this._element.appendChild(this.content.element);
    }
    updateDragAndDropState() {
        this._element.draggable = !this.accessor.options.disableDnd;
        this.dragHandler.setDisabled(!!this.accessor.options.disableDnd);
    }
    getDragDescriptor() {
        var _a;
        return {
            itemType: 'tab',
            sourceGroupId: this.group.id,
            sourcePanelId: this.panel.id,
            sourceComponentId: this.accessor.id,
            viewId: this.accessor.id,
            label: (_a = this.panel.title) !== null && _a !== void 0 ? _a : this.panel.id,
        };
    }
}
