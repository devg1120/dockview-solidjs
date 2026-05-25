// packages/dockview-core/src/dockview/externalDetach.ts
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Emitter } from '../events';
const DEFAULT_CONFIG = {
    allowExternalDetach: false,
    dragOutsideClassName: 'dv-external-detach-allowed',
    edgeThreshold: 50,
    detachHandler: () => __awaiter(void 0, void 0, void 0, function* () { return ({ accept: false, error: 'No detach handler configured' }); }),
};
/**
 * External detach controller for dockview.
 *
 * Attach this to a DockviewComponent to enable external detach functionality.
 */
export class ExternalDetachController {
    constructor(config = {}) {
        this._onDragExit = new Emitter();
        this.onDragExit = this._onDragExit.event;
        this._onDropOutside = new Emitter();
        this.onDropOutside = this._onDropOutside.event;
        this._onDragReturn = new Emitter();
        this.onDragReturn = this._onDragReturn.event;
        this._onSerializeRequest = new Emitter();
        this.onSerializeRequest = this._onSerializeRequest.event;
        this.isOutsideWindow = false;
        this.currentDragMeta = null;
        /** Panels that have been detached (tracked for reattach) */
        this.detachedPanels = new Map();
        /** Panel serializers registered by panels */
        this.panelSerializers = new Map();
        this.config = Object.assign(Object.assign({}, DEFAULT_CONFIG), config);
    }
    /** Check if external detach is allowed */
    get allowExternalDetach() {
        return this.config.allowExternalDetach;
    }
    /** Set whether external detach is allowed */
    set allowExternalDetach(value) {
        this.config.allowExternalDetach = value;
    }
    /** Update configuration */
    updateConfig(config) {
        this.config = Object.assign(Object.assign({}, this.config), config);
    }
    /**
     * Register a serializer for a panel.
     * Panels should call this to opt-in to state serialization.
     */
    registerSerializer(panelId, serializer) {
        this.panelSerializers.set(panelId, serializer);
        return () => {
            this.panelSerializers.delete(panelId);
        };
    }
    /**
     * Handle drag start - track the panel being dragged.
     */
    handleDragStart(panel, group) {
        if (!this.config.allowExternalDetach)
            return;
        this.currentDragMeta = {
            panelId: panel.id,
            panelType: panel.view.contentComponent,
            groupId: group.id,
            panel,
            group,
        };
        this.isOutsideWindow = false;
    }
    /**
     * Handle drag over - check if we're outside the window bounds.
     */
    handleDragOver(event) {
        if (!this.config.allowExternalDetach || !this.currentDragMeta)
            return;
        const isNowOutside = this.isOutsideBounds(event);
        if (isNowOutside && !this.isOutsideWindow) {
            // Just exited the window
            this.isOutsideWindow = true;
            this._onDragExit.fire({
                panelMeta: this.currentDragMeta,
                screenCoords: { x: event.screenX, y: event.screenY },
                nativeEvent: event,
            });
            // Add visual indicator
            document.body.classList.add(this.config.dragOutsideClassName);
        }
        else if (!isNowOutside && this.isOutsideWindow) {
            // Returned to the window
            this.isOutsideWindow = false;
            this._onDragReturn.fire({
                panelId: this.currentDragMeta.panelId,
                nativeEvent: event,
            });
            // Remove visual indicator
            document.body.classList.remove(this.config.dragOutsideClassName);
        }
    }
    /**
     * Handle drag end - check if dropped outside.
     */
    handleDragEnd(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config.allowExternalDetach || !this.currentDragMeta) {
                this.cleanup();
                return;
            }
            const meta = this.currentDragMeta;
            // Remove visual indicator
            document.body.classList.remove(this.config.dragOutsideClassName);
            if (this.isOutsideWindow) {
                const screenCoords = { x: event.screenX, y: event.screenY };
                // Fire drop outside event
                this._onDropOutside.fire({
                    panelMeta: meta,
                    screenCoords,
                    nativeEvent: event,
                });
                // Call detach handler
                try {
                    const result = yield this.config.detachHandler(meta.panelId, screenCoords, meta);
                    if (result.accept) {
                        // Record as detached
                        this.detachedPanels.set(meta.panelId, {
                            meta,
                            serializedState: result.serializedState,
                        });
                    }
                    else {
                        console.warn(`[ExternalDetach] Detach rejected for panel '${meta.panelId}': ${result.error}`);
                    }
                }
                catch (error) {
                    console.error(`[ExternalDetach] Detach handler error for panel '${meta.panelId}':`, error);
                }
            }
            this.cleanup();
        });
    }
    /**
     * Request serialization of a panel's state.
     * Returns a promise that resolves with the state or rejects on timeout.
     */
    requestSerializePanel(panelId_1) {
        return __awaiter(this, arguments, void 0, function* (panelId, timeoutMs = 5000) {
            // First check if we have a registered serializer
            const serializer = this.panelSerializers.get(panelId);
            if (serializer) {
                return serializer();
            }
            // Fall back to event-based serialization
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Serialize request timed out for panel: ${panelId}`));
                }, timeoutMs);
                this._onSerializeRequest.fire({
                    panelId,
                    respond: (state) => {
                        clearTimeout(timeout);
                        resolve(state);
                    },
                });
            });
        });
    }
    /**
     * Accept a panel reattachment from an external window.
     * This should be called by the host application when a detached panel
     * needs to be reinserted into the dockview layout.
     */
    acceptExternalReattach(panelId, serializedState) {
        return __awaiter(this, void 0, void 0, function* () {
            const detached = this.detachedPanels.get(panelId);
            if (!detached) {
                return {
                    success: false,
                    error: `Panel '${panelId}' is not tracked as detached`,
                };
            }
            // Remove from detached tracking
            this.detachedPanels.delete(panelId);
            // The actual panel recreation should be handled by the host application
            // via the dockview API. This just cleans up tracking.
            return { success: true };
        });
    }
    /**
     * Check if a panel is currently detached.
     */
    isDetached(panelId) {
        return this.detachedPanels.has(panelId);
    }
    /**
     * Get the list of detached panel IDs.
     */
    getDetachedPanelIds() {
        return Array.from(this.detachedPanels.keys());
    }
    /**
     * Get detached panel info.
     */
    getDetachedPanel(panelId) {
        return this.detachedPanels.get(panelId);
    }
    /**
     * Dispose the controller.
     */
    dispose() {
        this._onDragExit.dispose();
        this._onDropOutside.dispose();
        this._onDragReturn.dispose();
        this._onSerializeRequest.dispose();
        this.detachedPanels.clear();
        this.panelSerializers.clear();
        this.cleanup();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    isOutsideBounds(event) {
        const threshold = this.config.edgeThreshold;
        const { innerWidth, innerHeight } = window;
        // Check if near window edges or outside
        const isNearLeft = event.clientX < threshold;
        const isNearRight = event.clientX > innerWidth - threshold;
        const isNearTop = event.clientY < threshold;
        const isNearBottom = event.clientY > innerHeight - threshold;
        // Also check if completely outside (clientX/Y will be 0 or near it)
        const isCompletelyOutside = event.clientX <= 0 ||
            event.clientY <= 0 ||
            event.clientX >= innerWidth ||
            event.clientY >= innerHeight;
        return isCompletelyOutside || (isNearLeft || isNearRight || isNearTop || isNearBottom);
    }
    cleanup() {
        this.currentDragMeta = null;
        this.isOutsideWindow = false;
        document.body.classList.remove(this.config.dragOutsideClassName);
    }
}
