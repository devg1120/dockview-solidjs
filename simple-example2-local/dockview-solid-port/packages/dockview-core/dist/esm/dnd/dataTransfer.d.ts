declare class TransferObject {
}
export declare class PanelTransfer extends TransferObject {
    readonly viewId: string;
    readonly groupId: string;
    readonly panelId: string | null;
    constructor(viewId: string, groupId: string, panelId: string | null);
}
export declare class PaneTransfer extends TransferObject {
    readonly viewId: string;
    readonly paneId: string;
    constructor(viewId: string, paneId: string);
}
/**
 * MIME type for dockview panel transfer data.
 * Using a custom MIME type ensures our data doesn't conflict with other drag sources.
 */
export declare const DOCKVIEW_PANEL_MIME_TYPE = "application/x-dockview-panel";
export declare const DOCKVIEW_PANE_MIME_TYPE = "application/x-dockview-pane";
export declare function beginPanelTransfer(data: PanelTransfer, dataTransfer?: DataTransfer | null): {
    dispose(): void;
};
export declare function beginPaneTransfer(data: PaneTransfer, dataTransfer?: DataTransfer | null): {
    dispose(): void;
};
/**
 * Set panel transfer data on native dataTransfer for cross-window drag support.
 * This stores the data in the native dataTransfer object so it can be read
 * even when dragging between different windows.
 */
export declare function setNativePanelData(dataTransfer: DataTransfer, data: PanelTransfer): void;
/**
 * Get panel transfer data from native dataTransfer for cross-window drag support.
 * Returns undefined if no valid dockview panel data is found.
 *
 * NOTE: This can only be called during 'drop' events. During 'dragover' events,
 * browsers block access to dataTransfer.getData() for security reasons.
 * Use hasNativePanelData() during dragover to check if panel data exists.
 */
export declare function getNativePanelData(dataTransfer: DataTransfer): PanelTransfer | undefined;
/**
 * Check if native dataTransfer contains dockview panel data.
 * This works during dragover events (unlike getData which is blocked).
 * Use this in canDisplayOverlay to detect cross-window drags.
 */
export declare function hasNativePanelData(dataTransfer: DataTransfer | null | undefined): boolean;
/**
 * Set pane transfer data on native dataTransfer for cross-window drag support.
 */
export declare function setNativePaneData(dataTransfer: DataTransfer, data: PaneTransfer): void;
/**
 * Get pane transfer data from native dataTransfer.
 */
export declare function getNativePaneData(dataTransfer: DataTransfer): PaneTransfer | undefined;
/**
 * A singleton to store transfer data during drag & drop operations that are only valid within the application.
 */
export declare class LocalSelectionTransfer<T> {
    private static readonly INSTANCE;
    private data?;
    private proto?;
    private constructor();
    static getInstance<T>(): LocalSelectionTransfer<T>;
    hasData(proto: T): boolean;
    clearData(proto: T): void;
    getData(proto: T): T[] | undefined;
    setData(data: T[], proto: T): void;
}
export declare function getPanelData(): PanelTransfer | undefined;
/**
 * Check if panel data exists (either local or cross-window).
 * This is safe to call during dragover events.
 * Use this in canDisplayOverlay to determine if the drop overlay should be shown.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns true if this is a dockview panel drag (same-window or cross-window)
 */
export declare function hasPanelData(dataTransfer?: DataTransfer | null): boolean;
/**
 * Check if this is a cross-window drag (has native data but no local data).
 * Safe to call during dragover events.
 */
export declare function isCrossWindowDrag(dataTransfer?: DataTransfer | null): boolean;
/**
 * Get panel data, with fallback to native dataTransfer for cross-window drag support.
 *
 * WARNING: This should only be called during 'drop' events, not 'dragover'.
 * For dragover, use hasPanelData() to check if panel data exists.
 *
 * @param dataTransfer - The native DataTransfer object from the drag event
 * @returns Panel transfer data from either LocalSelectionTransfer or native dataTransfer
 */
export declare function getPanelDataWithNativeFallback(dataTransfer?: DataTransfer | null): PanelTransfer | undefined;
export declare function getPaneData(): PaneTransfer | undefined;
export {};
