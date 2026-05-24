import { beginPanelTransfer, getPanelData, hasPanelData, isCrossWindowDrag, PanelTransfer, } from '../../../dnd/dataTransfer';
import { Droptarget, } from '../../../dnd/droptarget';
import { GroupDragHandler } from '../../../dnd/groupDragHandler';
import { addDisposableListener, Emitter } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { addTestId, toggleClass } from '../../../dom';
export class VoidContainer extends CompositeDisposable {
    get element() {
        return this._element;
    }
    constructor(accessor, group) {
        super();
        this.accessor = accessor;
        this.group = group;
        this._onDrop = new Emitter();
        this.onDrop = this._onDrop.event;
        this._onDragStart = new Emitter();
        this.onDragStart = this._onDragStart.event;
        this._element = document.createElement('div');
        this._element.className = 'dv-void-container';
        this._element.draggable = !this.accessor.options.disableDnd;
        addTestId(this._element, 'dockview-group-handle');
        this._element.dataset.groupId = this.group.id;
        toggleClass(this._element, 'dv-draggable', !this.accessor.options.disableDnd);
        this.addDisposables(this._onDrop, this._onDragStart, addDisposableListener(this._element, 'pointerdown', () => {
            this.accessor.doSetGroupActive(this.group);
        }));
        this.handler = new GroupDragHandler(this._element, accessor, group, !!this.accessor.options.disableDnd);
        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['center'],
            dragSessionStore: this.accessor.dragSessionStore,
            targetDescriptor: {
                kind: 'header_space',
                groupId: this.group.id,
            },
            canDisplayOverlay: (event, position) => {
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
                return group.model.canDisplayOverlay(event, position, 'header_space');
            },
            getOverrideTarget: () => { var _a; return (_a = group.model.dropTargetContainer) === null || _a === void 0 ? void 0 : _a.model; },
        });
        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;
        this.addDisposables(this.handler, this.handler.onDragStart((event) => {
            this.accessor.beginNativeDragSession(this.getDragDescriptor(), event);
            this._onDragStart.fire(event);
        }), this.handler.onDragEnd((event) => {
            this.accessor.completeNativeDragSession(event);
        }), this.accessor.touchDragManager.registerSource({
            element: this._element,
            disabled: () => !!this.accessor.options.disableDnd,
            getDescriptor: () => this.getDragDescriptor(),
            getGhostLabel: () => `Multiple Panels (${this.group.size})`,
            onDragStart: (event) => {
                this._onDragStart.fire(event);
                return beginPanelTransfer(new PanelTransfer(this.accessor.id, this.group.id, null));
            },
        }), this.dropTarget.onDrop((event) => {
            this._onDrop.fire(event);
        }), this.dropTarget);
    }
    updateDragAndDropState() {
        this._element.draggable = !this.accessor.options.disableDnd;
        toggleClass(this._element, 'dv-draggable', !this.accessor.options.disableDnd);
        this.handler.setDisabled(!!this.accessor.options.disableDnd);
    }
    getDragDescriptor() {
        return {
            itemType: 'group',
            sourceGroupId: this.group.id,
            sourcePanelId: null,
            sourceComponentId: this.accessor.id,
            viewId: this.accessor.id,
            label: `Multiple Panels (${this.group.size})`,
        };
    }
}
