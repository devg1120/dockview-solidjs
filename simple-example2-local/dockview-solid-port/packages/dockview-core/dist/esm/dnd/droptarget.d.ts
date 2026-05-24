import { DockviewEvent, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { Direction } from '../gridview/baseComponentGridview';
import { DockviewDragInteraction, DockviewDropTargetDescriptor, DockviewDropZone, DockviewDragSessionStore, DockviewNativeDragEvent } from './dragSession';
export interface DroptargetEvent {
    readonly position: Position;
    readonly nativeEvent: DockviewNativeDragEvent;
    readonly descriptor: DockviewDropTargetDescriptor;
}
export declare class WillShowOverlayEvent extends DockviewEvent implements DroptargetEvent {
    private readonly options;
    get nativeEvent(): DockviewNativeDragEvent;
    get position(): Position;
    get descriptor(): DockviewDropTargetDescriptor;
    constructor(options: {
        nativeEvent: DockviewNativeDragEvent;
        position: Position;
        descriptor: DockviewDropTargetDescriptor;
    });
}
export declare function directionToPosition(direction: Direction): Position;
export declare function positionToDirection(position: Position): Direction;
export type Position = DockviewDropZone;
export type CanDisplayOverlay = (dragEvent: DockviewDragInteraction, state: Position) => boolean;
export type MeasuredValue = {
    value: number;
    type: 'pixels' | 'percentage';
};
export type DroptargetOverlayModel = {
    size?: MeasuredValue;
    activationSize?: MeasuredValue;
};
export interface DropTargetTargetModel {
    getElements(event?: DockviewDragInteraction, outline?: HTMLElement): {
        root: HTMLElement;
        overlay: HTMLElement;
        changed: boolean;
    };
    exists(): boolean;
    clear(): void;
}
export interface DroptargetOptions {
    canDisplayOverlay: CanDisplayOverlay;
    acceptedTargetZones: Position[];
    overlayModel?: DroptargetOverlayModel;
    getOverrideTarget?: () => DropTargetTargetModel | undefined;
    className?: string;
    getOverlayOutline?: () => HTMLElement | null;
    targetDescriptor?: Omit<DockviewDropTargetDescriptor, 'id'>;
    dragSessionStore?: DockviewDragSessionStore;
}
export declare class Droptarget extends CompositeDisposable {
    private readonly elementRef;
    private readonly options;
    private static readonly REGISTRY;
    private static readonly USED_EVENT_ID;
    private static ACTUAL_TARGET;
    private targetElement;
    private overlayElement;
    private _state;
    private _acceptedTargetZonesSet;
    private readonly descriptorValue;
    private readonly _onDrop;
    readonly onDrop: Event<DroptargetEvent>;
    private readonly _onWillShowOverlay;
    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;
    readonly dnd: DragAndDropObserver;
    private _disabled;
    get disabled(): boolean;
    set disabled(value: boolean);
    get state(): Position | undefined;
    get element(): HTMLElement;
    get descriptor(): DockviewDropTargetDescriptor;
    constructor(elementRef: HTMLElement, options: DroptargetOptions);
    static getActiveTarget(): Droptarget | undefined;
    static clearActiveTarget(): void;
    static findTargetsAtPoint(clientX: number, clientY: number, root?: HTMLElement): Droptarget[];
    setTargetZones(acceptedTargetZones: Position[]): void;
    setOverlayModel(model: DroptargetOverlayModel): void;
    handleExternalDragOver(input: DockviewDragInteraction): boolean;
    handleExternalDrop(input: DockviewDragInteraction): boolean;
    dispose(): void;
    private markAsUsed;
    private isAlreadyUsed;
    private renderDropTarget;
    private toggleClasses;
    private applyOverlayClasses;
    private applyOverlayMetadata;
    private calculateQuadrant;
    private removeDropTarget;
}
export declare function calculateQuadrantAsPercentage(overlayType: Set<Position>, x: number, y: number, width: number, height: number, threshold: number): Position | null;
export declare function calculateQuadrantAsPixels(overlayType: Set<Position>, x: number, y: number, width: number, height: number, threshold: number): Position | null;
