class TransferObject {
}
export class PanelTransfer extends TransferObject {
    constructor(viewId, groupId, panelId) {
        super();
        this.viewId = viewId;
        this.groupId = groupId;
        this.panelId = panelId;
    }
}
export class PaneTransfer extends TransferObject {
    constructor(viewId, paneId) {
        super();
        this.viewId = viewId;
        this.paneId = paneId;
    }
}
/**
 * MIME type for dockview panel transfer data.
 * Using a custom MIME type ensures our data doesn't conflict with other drag sources.
 */
export const DOCKVIEW_PANEL_MIME_TYPE = 'application/x-dockview-panel';
export const DOCKVIEW_PANE_MIME_TYPE = 'application/x-dockview-pane';
export function beginPanelTransfer(data, dataTransfer) {
    const panelTransfer = LocalSelectionTransfer.getInstance();
    panelTransfer.setData([data], PanelTransfer.prototype);
    if (dataTransfer) {
        setNativePanelData(dataTransfer, data);
    }
    return {
        dispose: () => {
            panelTransfer.clearData(PanelTransfer.prototype);
        },
    };
}
export function beginPaneTransfer(data, dataTransfer) {
    const paneTransfer = LocalSelectionTransfer.getInstance();
    paneTransfer.setData([data], PaneTransfer.prototype);
    if (dataTransfer) {
        setNativePaneData(dataTransfer, data);
    }
    return {
        dispose: () => {
            paneTransfer.clearData(PaneTransfer.prototype);
        },
    };
}
/**
 * Set panel transfer data on native dataTransfer for cross-window drag support.
 * This stores the data in the native dataTransfer object so it can be read
 * even when dragging between different windows.
 */
export function setNativePanelData(dataTransfer, data) {
    try {
        const json = JSON.stringify({
            viewId: data.viewId,
            groupId: data.groupId,
            panelId: data.panelId,
        });
        dataTransfer.setData(DOCKVIEW_PANEL_MIME_TYPE, json);
        // Also set as text/plain for debugging/compatibility
        dataTransfer.setData('text/plain', json);
    }
    catch (e) {
        console.warn('[dockview] Failed to set native panel data:', e);
    }
}
/**
 * Get panel transfer data from native dataTransfer for cross-window drag support.
 * Returns undefined if no valid dockview panel data is found.
 *
 * NOTE: This can only be called during 'drop' events. During 'dragover' events,
 * browsers block access to dataTransfer.getData() for security reasons.
 * Use hasNativePanelData() during dragover to check if panel data exists.
 */
export function getNativePanelData(dataTransfer) {
    var _a;
    try {
        const json = dataTransfer.getData(DOCKVIEW_PANEL_MIME_TYPE);
        if (!json) {
            return undefined;
        }
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed.viewId === 'string' && typeof parsed.groupId === 'string') {
            return new PanelTransfer(parsed.viewId, parsed.groupId, (_a = parsed.panelId) !== null && _a !== void 0 ? _a : null);
        }
    }
    catch (e) {
        // Not valid JSON or not our data format
    }
    return undefined;
}
/**
 * Check if native dataTransfer contains dockview panel data.
 * This works during dragover events (unlike getData which is blocked).
 * Use this in canDisplayOverlay to detect cross-window drags.
 */
export function hasNativePanelData(dataTransfer) {
    if (!dataTransfer)
        return false;
    return dataTransfer.types.includes(DOCKVIEW_PANEL_MIME_TYPE);
}
/**
 * Set pane transfer data on native dataTransfer for cross-window drag support.
 */
export function setNativePaneData(dataTransfer, data) {
    try {
        const json = JSON.stringify({
            viewId: data.viewId,
            paneId: data.paneId,
        });
        dataTransfer.setData(DOCKVIEW_PANE_MIME_TYPE, json);
    }
    catch (e) {
        console.warn('[dockview] Failed to set native pane data:', e);
    }
}
/**
 * Get pane transfer data from native dataTransfer.
 */
export function getNativePaneData(dataTransfer) {
    try {
        const json = dataTransfer.getData(DOCKVIEW_PANE_MIME_TYPE);
        if (!json) {
            return undefined;
        }
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed.viewId === 'string' && typeof parsed.paneId === 'string') {
            return new PaneTransfer(parsed.viewId, parsed.paneId);
        }
    }
    catch (e) {
        // Not valid JSON or not our data format
    }
    return undefined;
}
/**
 * A singleton to store transfer data during drag & drop operations that are only valid within the application.
 */
export class LocalSelectionTransfer {
    constructor() {
        // protect against external instantiation
    }
    static getInstance() {
        return LocalSelectionTransfer.INSTANCE;
    }
    hasData(proto) {
        return proto && proto === this.proto;
    }
    clearData(proto) {
        if (this.hasData(proto)) {
            this.proto = undefined;
            this.data = undefined;
        }
    }
    getData(proto) {
        if (this.hasData(proto)) {
            return this.data;
        }
        return undefined;
    }
    setData(data, proto) {
        if (proto) {
            this.data = data;
            this.proto = proto;
        }
    }
}
LocalSelectionTransfer.INSTANCE = new LocalSelectionTransfer();
export function getPanelData() {
    const panelTransfer = LocalSelectionTransfer.getInstance();
    const isPanelEvent = panelTransfer.hasData(PanelTransfer.prototype);
    if (!isPanelEvent) {
        return undefined;
    }
    return panelTransfer.getData(PanelTransfer.prototype)[0];
}
/**
 * Check if panel data exists (either local or cross-window).
 * This is safe to call during dragover events.
 * Use this in canDisplayOverlay to determine if the drop overlay should be shown.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns true if this is a dockview panel drag (same-window or cross-window)
 */
export function hasPanelData(dataTransfer) {
    // First check the local (same-window) transfer
    const localData = getPanelData();
    if (localData) {
        return true;
    }
    // Fall back to checking native dataTransfer types for cross-window drags
    // (We can't call getData() during dragover, but we can check types)
    if (dataTransfer) {
        return hasNativePanelData(dataTransfer);
    }
    return false;
}
/**
 * Check if this is a cross-window drag (has native data but no local data).
 * Safe to call during dragover events.
 */
export function isCrossWindowDrag(dataTransfer) {
    const hasLocal = getPanelData() !== undefined;
    const hasNative = dataTransfer ? hasNativePanelData(dataTransfer) : false;
    return !hasLocal && hasNative;
}
/**
 * Get panel data, with fallback to native dataTransfer for cross-window drag support.
 *
 * WARNING: This should only be called during 'drop' events, not 'dragover'.
 * For dragover, use hasPanelData() to check if panel data exists.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns Panel transfer data from either LocalSelectionTransfer or native dataTransfer
 */
export function getPanelDataWithNativeFallback(dataTransfer) {
    // First check the local (same-window) transfer
    const localData = getPanelData();
    if (localData) {
        return localData;
    }
    // Fall back to native dataTransfer for cross-window drags
    if (dataTransfer) {
        return getNativePanelData(dataTransfer);
    }
    return undefined;
}
export function getPaneData() {
    const paneTransfer = LocalSelectionTransfer.getInstance();
    const isPanelEvent = paneTransfer.hasData(PaneTransfer.prototype);
    if (!isPanelEvent) {
        return undefined;
    }
    return paneTransfer.getData(PaneTransfer.prototype)[0];
}
