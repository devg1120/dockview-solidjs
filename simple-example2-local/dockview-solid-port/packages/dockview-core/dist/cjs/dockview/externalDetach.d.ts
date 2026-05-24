/**
 * External detach/reattach functionality for dockview.
 *
 * This module provides opt-in support for detaching panels to external windows
 * (e.g., Tauri windows) and reattaching them later.
 *
 * Design principles:
 * - Dockview only emits events; it doesn't open network sockets
 * - Panel serialization is handled via request-serialize events
 * - Panels self-register their serializers
 * - Visual affordances are CSS-based
 */
import { Event } from '../events';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
/** Screen coordinates for external detach operations */
export interface ExternalScreenCoords {
    x: number;
    y: number;
}
/** Metadata about a panel being dragged */
export interface DraggedPanelMeta {
    panelId: string;
    panelType: string;
    groupId: string;
    panel: IDockviewPanel;
    group: DockviewGroupPanel;
}
/** Event fired when a panel drag exits the window bounds */
export interface ExternalDragExitEvent {
    panelMeta: DraggedPanelMeta;
    screenCoords: ExternalScreenCoords;
    nativeEvent: DragEvent;
}
/** Event fired when a panel is dropped outside the window */
export interface ExternalDropOutsideEvent {
    panelMeta: DraggedPanelMeta;
    screenCoords: ExternalScreenCoords;
    nativeEvent: DragEvent;
}
/** Event fired when a dragged panel returns to the window */
export interface ExternalDragReturnEvent {
    panelId: string;
    nativeEvent: DragEvent;
}
/** Result from the detach handler */
export interface DetachResult {
    /** Whether the detach was accepted */
    accept: boolean;
    /** Serialized panel state if available */
    serializedState?: unknown;
    /** Error message if detach was rejected */
    error?: string;
}
/** Handler called when a panel is dropped outside the window */
export type DetachHandler = (panelId: string, screenCoords: ExternalScreenCoords, panelMeta: DraggedPanelMeta) => Promise<DetachResult>;
/** Request to serialize a panel's state */
export interface SerializeRequestEvent {
    panelId: string;
    respond: (state: unknown) => void;
}
/** Configuration for external detach behavior */
export interface ExternalDetachConfig {
    /** Enable external detach functionality. Default: false */
    allowExternalDetach: boolean;
    /** CSS class to apply when dragging outside bounds. Default: 'dv-external-detach-allowed' */
    dragOutsideClassName?: string;
    /** Minimum distance from window edge to trigger external drop detection (pixels). Default: 50 */
    edgeThreshold?: number;
    /** Handler called when a panel is dropped outside */
    detachHandler?: DetachHandler;
}
/**
 * External detach controller for dockview.
 *
 * Attach this to a DockviewComponent to enable external detach functionality.
 */
export declare class ExternalDetachController {
    private readonly _onDragExit;
    readonly onDragExit: Event<ExternalDragExitEvent>;
    private readonly _onDropOutside;
    readonly onDropOutside: Event<ExternalDropOutsideEvent>;
    private readonly _onDragReturn;
    readonly onDragReturn: Event<ExternalDragReturnEvent>;
    private readonly _onSerializeRequest;
    readonly onSerializeRequest: Event<SerializeRequestEvent>;
    private config;
    private isOutsideWindow;
    private currentDragMeta;
    /** Panels that have been detached (tracked for reattach) */
    private detachedPanels;
    /** Panel serializers registered by panels */
    private panelSerializers;
    constructor(config?: Partial<ExternalDetachConfig>);
    /** Check if external detach is allowed */
    get allowExternalDetach(): boolean;
    /** Set whether external detach is allowed */
    set allowExternalDetach(value: boolean);
    /** Update configuration */
    updateConfig(config: Partial<ExternalDetachConfig>): void;
    /**
     * Register a serializer for a panel.
     * Panels should call this to opt-in to state serialization.
     */
    registerSerializer(panelId: string, serializer: () => Promise<unknown>): () => void;
    /**
     * Handle drag start - track the panel being dragged.
     */
    handleDragStart(panel: IDockviewPanel, group: DockviewGroupPanel): void;
    /**
     * Handle drag over - check if we're outside the window bounds.
     */
    handleDragOver(event: DragEvent): void;
    /**
     * Handle drag end - check if dropped outside.
     */
    handleDragEnd(event: DragEvent): Promise<void>;
    /**
     * Request serialization of a panel's state.
     * Returns a promise that resolves with the state or rejects on timeout.
     */
    requestSerializePanel(panelId: string, timeoutMs?: number): Promise<unknown>;
    /**
     * Accept a panel reattachment from an external window.
     * This should be called by the host application when a detached panel
     * needs to be reinserted into the dockview layout.
     */
    acceptExternalReattach(panelId: string, serializedState?: unknown): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Check if a panel is currently detached.
     */
    isDetached(panelId: string): boolean;
    /**
     * Get the list of detached panel IDs.
     */
    getDetachedPanelIds(): string[];
    /**
     * Get detached panel info.
     */
    getDetachedPanel(panelId: string): {
        meta: DraggedPanelMeta;
        serializedState?: unknown;
    } | undefined;
    /**
     * Dispose the controller.
     */
    dispose(): void;
    private isOutsideBounds;
    private cleanup;
}
