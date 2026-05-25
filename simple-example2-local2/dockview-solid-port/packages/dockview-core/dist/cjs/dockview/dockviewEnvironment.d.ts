import { Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
export type DockviewInteractionMode = 'desktop' | 'touch';
export type DockviewLayoutMode = 'compact' | 'full';
export interface DockviewEnvironmentSnapshot {
    readonly interactionMode: DockviewInteractionMode;
    readonly layoutMode: DockviewLayoutMode;
    readonly containerWidth: number;
    readonly containerHeight: number;
}
export declare function detectInteractionMode(win: Window): DockviewInteractionMode;
export declare function detectLayoutModeFromSize(width: number): DockviewLayoutMode;
export declare class DockviewEnvironmentController extends CompositeDisposable {
    private readonly element;
    private readonly win;
    private _interactionMode;
    private _layoutMode;
    private _containerWidth;
    private _containerHeight;
    private readonly _onDidInteractionModeChange;
    readonly onDidInteractionModeChange: Event<DockviewInteractionMode>;
    private readonly _onDidLayoutModeChange;
    readonly onDidLayoutModeChange: Event<DockviewLayoutMode>;
    get interactionMode(): DockviewInteractionMode;
    get layoutMode(): DockviewLayoutMode;
    get value(): DockviewEnvironmentSnapshot;
    constructor(element: HTMLElement);
    private updateInteractionMode;
    private updateLayoutMode;
    private readContainerSize;
    private watchMediaQuery;
}
