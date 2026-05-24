import { CompositeDisposable, MutableDisposable, } from '../../../lifecycle';
import { Emitter } from '../../../events';
import { addTestId, trackFocus } from '../../../dom';
import { Droptarget } from '../../../dnd/droptarget';
import { getPanelData, hasPanelData, isCrossWindowDrag } from '../../../dnd/dataTransfer';
export class ContentContainer extends CompositeDisposable {
    get element() {
        return this._element;
    }
    constructor(accessor, group) {
        super();
        this.accessor = accessor;
        this.group = group;
        this.disposable = new MutableDisposable();
        this._onDidFocus = new Emitter();
        this.onDidFocus = this._onDidFocus.event;
        this._onDidBlur = new Emitter();
        this.onDidBlur = this._onDidBlur.event;
        this._element = document.createElement('div');
        this._element.className = 'dv-content-container';
        this._element.tabIndex = -1;
        addTestId(this._element, 'dockview-group-content');
        this._element.dataset.groupId = this.group.id;
        this.addDisposables(this._onDidFocus, this._onDidBlur);
        const target = group.dropTargetContainer;
        this.dropTarget = new Droptarget(this.element, {
            getOverlayOutline: () => {
                var _a;
                return ((_a = accessor.options.theme) === null || _a === void 0 ? void 0 : _a.dndPanelOverlay) === 'group'
                    ? this.element.parentElement
                    : null;
            },
            className: 'dv-drop-target-content',
            dragSessionStore: this.accessor.dragSessionStore,
            targetDescriptor: {
                kind: 'content',
                groupId: this.group.id,
            },
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            canDisplayOverlay: (event, position) => {
                if (this.group.locked === 'no-drop-target' ||
                    (this.group.locked && position === 'center')) {
                    return false;
                }
                // Check if this is a panel drag (same-window or cross-window)
                // Use hasPanelData() since getData() is blocked during dragover
                const hasData = hasPanelData(event.dataTransfer);
                const localData = getPanelData();
                const crossWindow = isCrossWindowDrag(event.dataTransfer);
                if (!hasData &&
                    event.shiftKey &&
                    this.group.location.type !== 'floating') {
                    return false;
                }
                if (hasData) {
                    // For same-window drags, check viewId matches
                    if (localData && localData.viewId === this.accessor.id) {
                        return true;
                    }
                    // For cross-window drags, accept
                    if (crossWindow) {
                        return true;
                    }
                }
                return this.group.canDisplayOverlay(event, position, 'content');
            },
            getOverrideTarget: target ? () => target.model : undefined,
        });
        this.addDisposables(this.dropTarget);
    }
    show() {
        this.element.style.display = '';
    }
    hide() {
        this.element.style.display = 'none';
    }
    renderPanel(panel, options = { asActive: true }) {
        const doRender = options.asActive ||
            (this.panel && this.group.isPanelActive(this.panel));
        if (this.panel &&
            this.panel.view.content.element.parentElement === this._element) {
            /**
             * If the currently attached panel is mounted directly to the content then remove it
             */
            this._element.removeChild(this.panel.view.content.element);
        }
        this.panel = panel;
        let container;
        switch (panel.api.renderer) {
            case 'onlyWhenVisible':
                this.group.renderContainer.detatch(panel);
                if (this.panel) {
                    if (doRender) {
                        this._element.appendChild(this.panel.view.content.element);
                    }
                }
                container = this._element;
                break;
            case 'always':
                if (panel.view.content.element.parentElement === this._element) {
                    this._element.removeChild(panel.view.content.element);
                }
                container = this.group.renderContainer.attach({
                    panel,
                    referenceContainer: this,
                });
                break;
            default:
                throw new Error(`dockview: invalid renderer type '${panel.api.renderer}'`);
        }
        if (doRender) {
            const focusTracker = trackFocus(container);
            const disposable = new CompositeDisposable();
            disposable.addDisposables(focusTracker, focusTracker.onDidFocus(() => this._onDidFocus.fire()), focusTracker.onDidBlur(() => this._onDidBlur.fire()));
            this.disposable.value = disposable;
        }
    }
    openPanel(panel) {
        if (this.panel === panel) {
            return;
        }
        this.renderPanel(panel);
    }
    layout(_width, _height) {
        // noop
    }
    closePanel() {
        var _a;
        if (this.panel) {
            if (this.panel.api.renderer === 'onlyWhenVisible') {
                (_a = this.panel.view.content.element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.panel.view.content.element);
            }
        }
        this.panel = undefined;
    }
    dispose() {
        this.disposable.dispose();
        super.dispose();
    }
}
