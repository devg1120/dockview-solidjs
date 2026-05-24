import { CompositeDisposable, IDisposable } from '../lifecycle';
import { DockviewEnvironmentController } from '../dockview/dockviewEnvironment';
import { DockviewDragItemDescriptor, DockviewDragSessionStore } from './dragSession';
export interface DockviewTouchDragSourceOptions {
    readonly element: HTMLElement;
    readonly disabled?: () => boolean;
    readonly getDescriptor: () => DockviewDragItemDescriptor;
    readonly getGhostLabel: () => string;
    readonly onDragStart: (event: PointerEvent) => IDisposable;
    readonly setDraggingState?: (isDragging: boolean) => void;
}
export declare class DockviewTouchDragManager extends CompositeDisposable {
    private readonly rootElement;
    private readonly environment;
    private readonly dragSessionStore;
    private readonly win;
    private activeSource;
    constructor(rootElement: HTMLElement, environment: DockviewEnvironmentController, dragSessionStore: DockviewDragSessionStore);
    registerSource(options: DockviewTouchDragSourceOptions): IDisposable;
    dispose(): void;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    private onPointerCancel;
    private beginTouchDrag;
    private cancelTouchDrag;
    private cleanupActiveSource;
}
