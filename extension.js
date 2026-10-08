/*
 * SPDX-FileCopyrightText: 2026 Enthony Araujo de Oliveira <enthonyaraujo01@gmail.com>
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const TOOLTIP_OFFSET = 6;
const TOOLTIP_ANIMATION_TIME = 150;

/**
 * Individual Workspace Pill Button
 */
class WorkspaceButton extends St.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(index, extension) {
        super({
            style_class: 'workspace-button',
            can_focus: true,
            reactive: true,
            track_hover: true,
        });

        this._index = index;
        this._extension = extension;
        this._settings = extension.getSettings();

        this._label = new St.Label({
            style_class: 'workspace-button-label',
            text: String(index + 1),
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.set_child(this._label);

        this._active = false;
        this._occupied = false;
        this._persistent = false;

        // Tooltip actor placed in uiGroup
        this._tooltip = new St.Label({
            style_class: 'workspace-tooltip',
            visible: false,
            opacity: 0,
        });
        Main.uiGroup.add_child(this._tooltip);

        this.connect('clicked', () => this._onClicked());
        this.connect('notify::hover', () => this._onHoverChanged());
        this.connect('destroy', () => this._onDestroy());
    }

    get index() {
        return this._index;
    }

    get active() {
        return this._active;
    }

    get occupied() {
        return this._occupied;
    }

    get persistent() {
        return this._persistent;
    }

    get shown() {
        return this._active || this._occupied || this._persistent;
    }

    updateState(active, occupied, persistent, customLabel = null) {
        this._active = active;
        this._occupied = occupied;
        this._persistent = persistent;

        if (customLabel) {
            this._label.text = customLabel;
        } else {
            this._label.text = String(this._index + 1);
        }

        // Apply style classes
        this.remove_style_class_name('active');
        this.remove_style_class_name('occupied');
        this.remove_style_class_name('persistent');

        if (this._active) {
            this.add_style_class_name('active');
        } else if (this._occupied) {
            this.add_style_class_name('occupied');
        } else if (this._persistent) {
            this.add_style_class_name('persistent');
        }

        this.visible = this.shown;
    }

    _onClicked() {
        const ws = global.workspace_manager.get_workspace_by_index(this._index);
        if (ws) {
            ws.activate(global.get_current_time());
        }
    }

    _onHoverChanged() {
        if (!this._settings.get_boolean('show-tooltip')) {
            if (this._tooltip.visible) {
                this._tooltip.visible = false;
            }
            return;
        }

        if (this.hover && this.visible) {
            const name = Meta.prefs_get_workspace_name(this._index);
            const labelText = name && name.trim().length > 0
                ? name
                : _('Workspace %d').format(this._index + 1);

            this._tooltip.set({
                text: labelText,
                visible: true,
                opacity: 0,
            });

            const [stageX, stageY] = this.get_transformed_position();
            const [btnWidth, btnHeight] = this.allocation.get_size();
            const [tipWidth, tipHeight] = this._tooltip.get_size();
            const xOffset = Math.floor((btnWidth - tipWidth) / 2);

            const monitor = Main.layoutManager.findMonitorForActor(this) ||
                            Main.layoutManager.primaryMonitor;

            const targetX = Math.clamp(
                stageX + xOffset,
                monitor.x,
                monitor.x + monitor.width - tipWidth
            );

            const targetY = stageY + btnHeight + TOOLTIP_OFFSET;
            this._tooltip.set_position(targetX, targetY);

            this._tooltip.ease({
                opacity: 255,
                duration: TOOLTIP_ANIMATION_TIME,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        } else {
            this._tooltip.ease({
                opacity: 0,
                duration: TOOLTIP_ANIMATION_TIME,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    this._tooltip.visible = false;
                },
            });
        }
    }

    _onDestroy() {
        if (this._tooltip) {
            this._tooltip.destroy();
            this._tooltip = null;
        }
    }
}

/**
 * Workspace Indicator Container inside GNOME Panel
 */
class WorkspaceIndicator extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(extension) {
        // Pass true as 3rd param (dontCreateMenu) to avoid unnecessary popup menu
        super(0.0, _('Dynamic Workspaces'), true);

        this._extension = extension;
        this._settings = extension.getSettings();
        this._buttons = [];
        this._trackedWindows = new Set();

        this._box = new St.BoxLayout({
            style_class: 'workspace-indicator-box',
            vertical: false,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._box);

        // Handle mouse wheel scrolling to switch workspaces
        this.connect('scroll-event', (actor, event) => {
            return Main.wm.handleWorkspaceScroll(event);
        });

        // Track WorkspaceManager signals
        const wm = global.workspace_manager;
        wm.connectObject(
            'active-workspace-changed', () => this._onActiveWorkspaceChanged(),
            'notify::n-workspaces', () => this._rebuild(),
            'workspace-added', () => this._rebuild(),
            'workspace-removed', () => this._rebuild(),
            this
        );

        // Track Display & Window signals
        global.display.connectObject(
            'window-created', (display, window) => this._trackWindow(window),
            'restacked', () => this._updateOccupancy(),
            this
        );

        // Connect Settings signals
        this._settings.connectObject(
            'changed::persistent-workspaces', () => this._updateButtons(),
            'changed::max-workspaces', () => this._rebuild(),
            'changed::filter-by-monitor', () => this._updateOccupancy(),
            'changed::show-workspace-names', () => this._updateButtons(),
            this
        );

        // Track initial windows
        this._trackExistingWindows();

        // Build workspace buttons
        this._rebuild();
    }

    _trackExistingWindows() {
        const windows = global.get_window_actors()
            .map(actor => actor.meta_window)
            .filter(win => Boolean(win));

        for (const win of windows) {
            this._trackWindow(win);
        }
    }

    _trackWindow(win) {
        if (!win || this._trackedWindows.has(win)) return;

        this._trackedWindows.add(win);

        win.connectObject(
            'workspace-changed', () => this._onWindowWorkspaceChanged(win),
            'notify::skip-taskbar', () => this._updateOccupancy(),
            'notify::minimized', () => this._updateOccupancy(),
            'unmanaging', () => {
                this._trackedWindows.delete(win);
                win.disconnectObject(this);
                this._updateOccupancy();
            },
            this
        );

        this._updateOccupancy();
    }

    _onWindowWorkspaceChanged(win) {
        // Follow Window on Move (Hyprland movetoworkspace style)
        if (this._settings.get_boolean('follow-window')) {
            if (win === global.display.focus_window && !win.is_on_all_workspaces()) {
                const targetWs = win.get_workspace();
                if (targetWs && targetWs !== global.workspace_manager.get_active_workspace()) {
                    targetWs.activate(global.get_current_time());
                    win.activate(global.get_current_time());
                }
            }
        }

        this._updateOccupancy();
    }

    _rebuild() {
        this._box.destroy_all_children();
        this._buttons = [];

        const totalWorkspaces = global.workspace_manager.n_workspaces;
        const maxConfigured = this._settings.get_int('max-workspaces');
        const count = Math.min(totalWorkspaces, maxConfigured);

        for (let i = 0; i < count; i++) {
            const btn = new WorkspaceButton(i, this._extension);
            this._buttons.push(btn);
            this._box.add_child(btn);
        }

        this._updateButtons();
    }

    _onActiveWorkspaceChanged() {
        this._updateButtons();
    }

    _updateOccupancy() {
        this._updateButtons();
    }

    _isWorkspaceOccupied(wsIndex) {
        const ws = global.workspace_manager.get_workspace_by_index(wsIndex);
        if (!ws) return false;

        const filterByMonitor = this._settings.get_boolean('filter-by-monitor');
        let currentMonitor = -1;
        if (filterByMonitor) {
            currentMonitor = Main.layoutManager.findIndexForActor(this);
        }

        const windows = ws.list_windows();
        for (const win of windows) {
            if (win.is_on_all_workspaces()) continue;
            if (win.skip_taskbar) continue;

            // Only normal windows, dialogs and utility windows count
            const type = win.get_window_type();
            if (type !== Meta.WindowType.NORMAL &&
                type !== Meta.WindowType.DIALOG &&
                type !== Meta.WindowType.MODAL_DIALOG &&
                type !== Meta.WindowType.UTILITY) {
                continue;
            }

            if (filterByMonitor && currentMonitor >= 0) {
                if (win.get_monitor() !== currentMonitor) continue;
            }

            return true;
        }

        return false;
    }

    _updateButtons() {
        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const persistentCount = this._settings.get_int('persistent-workspaces');
        const showNames = this._settings.get_boolean('show-workspace-names');

        for (const btn of this._buttons) {
            const i = btn.index;
            const isActive = (i === activeIndex);
            const isOccupied = this._isWorkspaceOccupied(i);
            const isPersistent = (i < persistentCount);

            let labelText = null;
            if (showNames) {
                const name = Meta.prefs_get_workspace_name(i);
                if (name && name.trim().length > 0) {
                    labelText = name;
                }
            }

            btn.updateState(isActive, isOccupied, isPersistent, labelText);
        }
    }

    destroy() {
        // Clean up connections
        this._settings.disconnectObject(this);
        global.workspace_manager.disconnectObject(this);
        global.display.disconnectObject(this);

        for (const win of this._trackedWindows) {
            win.disconnectObject(this);
        }
        this._trackedWindows.clear();

        for (const btn of this._buttons) {
            btn.destroy();
        }
        this._buttons = [];

        super.destroy();
    }
}

/**
 * Main GNOME Shell Extension
 */
export default class DynamicWorkspacesExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._indicator = null;
        this._setupIndicator();

        // Listen for panel position changes
        this._settings.connectObject(
            'changed::panel-position', () => this._resetIndicator(),
            'changed::hide-default-indicator', () => this._syncDefaultIndicator(),
            this
        );

        this._syncDefaultIndicator();
    }

    disable() {
        this._settings.disconnectObject(this);

        // Restore default GNOME workspace indicator visibility
        const activities = Main.panel.statusArea['activities'];
        if (activities && activities.container) {
            activities.container.visible = true;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    _setupIndicator() {
        if (this._indicator) return;

        this._indicator = new WorkspaceIndicator(this);

        const position = this._settings.get_string('panel-position') || 'left';
        // Add to panel statusArea: left, center, or right
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, position);
    }

    _resetIndicator() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._setupIndicator();
    }

    _syncDefaultIndicator() {
        const hide = this._settings.get_boolean('hide-default-indicator');
        const activities = Main.panel.statusArea['activities'];
        if (activities && activities.container) {
            activities.container.visible = !hide;
        }
    }
}
