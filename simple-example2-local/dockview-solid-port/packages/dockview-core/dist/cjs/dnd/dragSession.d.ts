import { Event } from '../events';
export type DockviewInteractionBackend = 'desktop' | 'touch';
export type DockviewDragLifecycleState = 'idle' | 'pending' | 'dragging' | 'dropped' | 'cancelled';
export type DockviewDragItemType = 'tab' | 'group' | 'panel';
export type DockviewDropZone = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type DockviewNativeDragEvent = DragEvent | PointerEvent;
export interface DockviewDragCoordinates {
    readonly clientX: number;
    readonly clientY: number;
}
export interface DockviewDragItemDescriptor {
    readonly itemType: DockviewDragItemType;
    readonly sourceGroupId: string;
    readonly sourcePanelId: string | null;
    readonly sourceComponentId: string;
    readonly viewId: string;
    readonly label: string;
}
export interface DockviewDropTargetDescriptor {
    readonly id: string;
    readonly kind: string;
    readonly groupId?: string;
    readonly panelId?: string | null;
}
export interface DockviewDragSessionSnapshot {
    readonly sessionId: string | null;
    readonly backend: DockviewInteractionBackend | null;
    readonly state: DockviewDragLifecycleState;
    readonly item?: DockviewDragItemDescriptor;
    readonly coordinates?: DockviewDragCoordinates;
    readonly activeDropTarget?: DockviewDropTargetDescriptor;
    readonly activeDropZone?: DockviewDropZone;
    readonly lastNativeEventType?: string;
}
export interface DockviewDragInteraction {
    readonly nativeEvent: DockviewNativeDragEvent;
    readonly currentTarget: HTMLElement;
    readonly target: EventTarget | null;
    readonly backend: DockviewInteractionBackend;
    readonly session: DockviewDragSessionSnapshot;
    readonly clientX: number;
    readonly clientY: number;
    readonly dataTransfer?: DataTransfer | null;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    preventDefault(): void;
    stopPropagation(): void;
}
export declare const EMPTY_DOCKVIEW_DRAG_SESSION: DockviewDragSessionSnapshot;
export declare function getDragCoordinates(event: DockviewNativeDragEvent): DockviewDragCoordinates;
export declare function getDataTransferFromNativeEvent(event: DockviewNativeDragEvent | undefined | null): DataTransfer | undefined;
export declare function toDockviewDragInteraction(options: {
    nativeEvent: DockviewNativeDragEvent;
    currentTarget: HTMLElement;
    backend: DockviewInteractionBackend;
    session: DockviewDragSessionSnapshot;
}): DockviewDragInteraction;
export declare class DockviewDragSessionStore {
    private static nextId;
    private _value;
    private readonly _onDidChange;
    readonly onDidChange: Event<DockviewDragSessionSnapshot>;
    get value(): DockviewDragSessionSnapshot;
    createPending(options: {
        backend: DockviewInteractionBackend;
        item: DockviewDragItemDescriptor;
        coordinates: DockviewDragCoordinates;
        nativeEvent?: DockviewNativeDragEvent;
    }): DockviewDragSessionSnapshot;
    startDragging(options: {
        backend: DockviewInteractionBackend;
        item: DockviewDragItemDescriptor;
        coordinates: DockviewDragCoordinates;
        nativeEvent?: DockviewNativeDragEvent;
    }): DockviewDragSessionSnapshot;
    updateCoordinates(coordinates: DockviewDragCoordinates, nativeEvent?: DockviewNativeDragEvent): DockviewDragSessionSnapshot;
    setActiveDropTarget(activeDropTarget: DockviewDropTargetDescriptor, activeDropZone: DockviewDropZone, coordinates?: DockviewDragCoordinates, nativeEvent?: DockviewNativeDragEvent): DockviewDragSessionSnapshot;
    clearActiveDropTarget(targetId?: string): DockviewDragSessionSnapshot;
    markDropped(options: {
        coordinates?: DockviewDragCoordinates;
        nativeEvent?: DockviewNativeDragEvent;
        activeDropTarget?: DockviewDropTargetDescriptor;
        activeDropZone?: DockviewDropZone;
    }): DockviewDragSessionSnapshot;
    markCancelled(options?: {
        coordinates?: DockviewDragCoordinates;
        nativeEvent?: DockviewNativeDragEvent;
    }): DockviewDragSessionSnapshot;
    reset(): DockviewDragSessionSnapshot;
    dispose(): void;
    private update;
}
