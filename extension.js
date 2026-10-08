/*
 * SPDX-FileCopyrightText: 2026 Enthony Araujo <enthonyaraujo01@gmail.com>
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const TOOLTIP_OFFSET = 6;
const TOOLTIP_ANIMATION_TIME = 150;
const SLIDER_ANIMATION_TIME = 180;

/**
 * Base Strategy for Indicator Presentation Styles
 */
class BaseIndicatorStyle {
    constructor(indicator) {
        this.indicator = indicator;
    }

    get styleClass() {
        return 'style-pure';
    }

    apply() {
        this.indicator.showSlider(false);
    }

    updateButton(button, state) {}

    onActiveChanged(activeIndex, previousIndex) {}

    destroy() {}
}

/**
 * 1. GNOME Puro (Minimalist)
 */
class PureStyle extends BaseIndicatorStyle {
    get styleClass() {
        return 'style-pure';
    }

    updateButton(button, state) {
        button.setDotVisible(false);
        button.setNameVisible(false);
        button.setActive(state.isActive);
    }
}

/**
 * 2. Indicadores de Uso (Dots)
 */
class UsageStyle extends BaseIndicatorStyle {
    get styleClass() {
        return 'style-dots';
    }

    updateButton(button, state) {
        button.setDotVisible(true);
        button.setDotOccupied(state.isOccupied, state.isActive);
        button.setNameVisible(false);
        button.setActive(state.isActive);
    }
}

/**
 * 3. Cápsula Sutil (Adwaita)
 */
class PillStyle extends BaseIndicatorStyle {
    get styleClass() {
        return 'style-pill';
    }

    updateButton(button, state) {
        button.setDotVisible(false);
        button.setNameVisible(false);
        button.setActive(state.isActive);
    }
}

/**
 * 4. Nomes Dinâmicos
 */
class NamedStyle extends BaseIndicatorStyle {
    get styleClass() {
        return 'style-names';
    }

    updateButton(button, state) {
        button.setDotVisible(false);
        const hasName = Boolean(state.customName && state.customName.length > 0);
        button.setNameVisible(hasName, state.customName);
        button.setActive(state.isActive);
    }
}

/**
 * 5. Transição Animada (Sliding Pill)
 */
class AnimatedStyle extends BaseIndicatorStyle {
    get styleClass() {
        return 'style-animated';
    }

    apply() {
        this.indicator.showSlider(true);
        this.indicator.syncSlider(false);
    }

    updateButton(button, state) {
        button.setDotVisible(false);
        button.setNameVisible(false);
        button.setActive(state.isActive);
    }

    onActiveChanged(activeIndex, previousIndex) {
        this.indicator.syncSlider(true);
    }

    destroy() {
        this.indicator.showSlider(false);
    }
}

const STYLE_REGISTRY = {
    pure: PureStyle,
    dots: UsageStyle,
    pill: PillStyle,
    names: NamedStyle,
    animated: AnimatedStyle,
};

/**
 * Individual Workspace Pill Button
 */
class WorkspaceButton extends St.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(index, extension) {
        super({
            style_class: 'workspace-button workspace-indicator',
            can_focus: true,
            reactive: true,
            track_hover: true,
        });

        this._index = index;
        this._extension = extension;
        this._settings = extension.getSettings();

        // Horizontal container for number and optional custom name
        this._textContainer = new St.BoxLayout({
            vertical: false,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._label = new St.Label({
            style_class: 'workspace-button-label workspace-indicator-label',
            text: String(index + 1),
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this._textContainer.add_child(this._label);

        this._nameLabel = new St.Label({
            style_class: 'workspace-name-label',
            visible: false,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._nameLabel.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        this._textContainer.add_child(this._nameLabel);

        // Small dot for usage/occupancy indicator (Style 2)
        this._dot = new St.Widget({
            style_class: 'workspace-dot',
            visible: false,
            x_align: Clutter.ActorAlign.CENTER,
        });

        // Vertical content box holding text and dot
        this._contentBox = new St.BoxLayout({
            vertical: true,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this._contentBox.add_child(this._textContainer);
        this._contentBox.add_child(this._dot);
        this.set_child(this._contentBox);

        this._active = false;
        this._occupied = false;
        this._persistent = false;
        this._customName = '';

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

    setDotVisible(visible) {
        this._dot.visible = visible;
    }

    setDotOccupied(isOccupied, isActive) {
        this._dot.remove_style_class_name('active-dot');
        this._dot.remove_style_class_name('inactive-dot');

        if (isOccupied) {
            this._dot.opacity = 255;
            this._dot.add_style_class_name(isActive ? 'active-dot' : 'inactive-dot');
        } else {
            // Keep transparent placeholder to avoid layout jumps
            this._dot.opacity = 0;
        }
    }

    setNameVisible(visible, nameText = '') {
        this._nameLabel.visible = visible;
        if (visible) {
            this._nameLabel.text = nameText;
        }
    }

    setActive(isActive) {
        if (isActive) {
            this.add_style_class_name('active');
        } else {
            this.remove_style_class_name('active');
        }
    }

    updateState(active, occupied, persistent, customName = '') {
        this._active = active;
        this._occupied = occupied;
        this._persistent = persistent;
        this._customName = customName;

        this.remove_style_class_name('occupied');
        this.remove_style_class_name('persistent');

        if (this._occupied) {
            this.add_style_class_name('occupied');
        }
        if (this._persistent) {
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
            if (this._tooltip && this._tooltip.visible) {
                this._tooltip.visible = false;
            }
            return;
        }

        if (this.hover && this.visible) {
            let labelText = '';
            if (this._customName && this._customName.length > 0) {
                labelText = _('Workspace %d: %s').format(this._index + 1, this._customName);
            } else {
                const sysName = Meta.prefs_get_workspace_name(this._index);
                labelText = (sysName && sysName.trim().length > 0)
                    ? sysName
                    : _('Workspace %d').format(this._index + 1);
            }

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
                    if (this._tooltip) {
                        this._tooltip.visible = false;
                    }
                },
            });
        }
    }

    _onDestroy() {
        if (this._tooltip) {
            this._tooltip.remove_all_transitions();
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
        super(0.0, _('Dynamic Workspaces'), true);

        this.add_style_class_name('workspace-indicator-panel');

        this._extension = extension;
        this._settings = extension.getSettings();
        this._buttons = [];
        this._trackedWindows = new Set();
        this._currentStyle = null;
        this._currentStyleId = null;
        this._lastActiveIndex = global.workspace_manager.get_active_workspace_index();

        // Top level container with BinLayout for sliding background support
        this._container = new Clutter.Actor({
            layout_manager: new Clutter.BinLayout(),
        });
        this.add_child(this._container);

        // Sliding pill widget for Animated Transition style (placed behind buttons)
        this._slider = new St.Widget({
            style_class: 'workspace-slider-pill',
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER,
            reactive: false,
            visible: false,
        });
        this._container.add_child(this._slider);

        // Horizontal box holding the workspace buttons
        this._box = new St.BoxLayout({
            style_class: 'workspace-indicator-box',
            vertical: false,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this._container.add_child(this._box);

        // Re-align slider when layout allocation updates
        this._box.connect('notify::allocation', () => {
            if (this._currentStyleId === 'animated') {
                this.syncSlider(false);
            }
        });

        // Mouse wheel scrolling cycles workspaces
        this.connect('scroll-event', (actor, event) => {
            return Main.wm.handleWorkspaceScroll(event);
        });

        // WorkspaceManager signals
        const wm = global.workspace_manager;
        wm.connectObject(
            'active-workspace-changed', () => this._onActiveWorkspaceChanged(),
            'notify::n-workspaces', () => this._rebuild(),
            'workspace-added', () => this._rebuild(),
            'workspace-removed', () => this._rebuild(),
            this
        );

        // Display signals
        global.display.connectObject(
            'window-created', (display, window) => this._trackWindow(window),
            'restacked', () => this._updateOccupancy(),
            this
        );

        // Settings signals
        this._settings.connectObject(
            'changed::indicator-style', () => this._updateStyle(),
            'changed::workspace-names', () => this._updateButtons(),
            'changed::persistent-workspaces', () => this._updateButtons(),
            'changed::max-workspaces', () => this._rebuild(),
            'changed::filter-by-monitor', () => this._updateOccupancy(),
            this
        );

        // Track existing windows and build
        this._trackExistingWindows();
        this._rebuild();
        this._updateStyle();
    }

    showSlider(visible) {
        if (this._slider) {
            this._slider.visible = visible;
        }
    }

    syncSlider(animate = false) {
        if (!this._slider || this._currentStyleId !== 'animated') return;

        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const activeBtn = this._buttons.find(btn => btn.index === activeIndex && btn.shown);
        if (!activeBtn || activeBtn.width === 0) return;

        this._slider.remove_all_transitions();
        if (animate) {
            this._slider.ease({
                translation_x: activeBtn.x,
                width: activeBtn.width,
                duration: SLIDER_ANIMATION_TIME,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        } else {
            this._slider.translation_x = activeBtn.x;
            this._slider.width = activeBtn.width;
        }
    }

    _updateStyle() {
        const styleId = this._settings.get_string('indicator-style') || 'pure';
        if (this._currentStyleId === styleId && this._currentStyle) {
            this._updateButtons();
            return;
        }

        if (this._currentStyle) {
            this._box.remove_style_class_name(this._currentStyle.styleClass);
            this._currentStyle.destroy();
        }

        this._currentStyleId = styleId;
        const StyleClass = STYLE_REGISTRY[styleId] || PureStyle;
        this._currentStyle = new StyleClass(this);
        this._box.add_style_class_name(this._currentStyle.styleClass);
        this._currentStyle.apply();

        this._updateButtons();
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
        for (const btn of this._buttons) {
            btn.destroy();
        }
        this._buttons = [];
        this._box.destroy_all_children();

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
        const prevIndex = this._lastActiveIndex;
        const newIndex = global.workspace_manager.get_active_workspace_index();
        this._lastActiveIndex = newIndex;

        this._updateButtons();
        if (this._currentStyle) {
            this._currentStyle.onActiveChanged(newIndex, prevIndex);
        }
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
        const customNames = this._settings.get_strv('workspace-names');

        for (const btn of this._buttons) {
            const i = btn.index;
            const isActive = (i === activeIndex);
            const isOccupied = this._isWorkspaceOccupied(i);
            const isPersistent = (i < persistentCount);
            const customName = (customNames && customNames[i]) ? customNames[i].trim() : '';

            btn.updateState(isActive, isOccupied, isPersistent, customName);

            if (this._currentStyle) {
                this._currentStyle.updateButton(btn, {
                    index: i,
                    isActive,
                    isOccupied,
                    isPersistent,
                    customName,
                });
            }
        }
    }

    destroy() {
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

        if (this._currentStyle) {
            this._currentStyle.destroy();
            this._currentStyle = null;
        }

        if (this._slider) {
            this._slider.remove_all_transitions();
            this._slider.destroy();
            this._slider = null;
        }

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

        this._settings.connectObject(
            'changed::panel-position', () => this._resetIndicator(),
            'changed::hide-default-indicator', () => this._syncDefaultIndicator(),
            this
        );

        this._syncDefaultIndicator();
    }

    disable() {
        this._settings.disconnectObject(this);

        const activities = Main.panel.statusArea['activities'];
        if (activities) {
            if (activities.container) {
                activities.container.visible = true;
            }
            activities.visible = true;
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
        if (activities) {
            if (activities.container) {
                activities.container.visible = !hide;
            }
            activities.visible = !hide;
        }
    }
}
