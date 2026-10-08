/*
 * SPDX-FileCopyrightText: 2026 Enthony Araujo <enthonyaraujo01@gmail.com>
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class DynamicWorkspacesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const _ = this.gettext.bind(this);
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // 1. Behavior Group
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Workspaces Behavior'),
            description: _('Configure dynamic display and persistent workspaces'),
        });
        page.add(behaviorGroup);

        // Persistent workspaces (always visible)
        const persistentRow = new Adw.SpinRow({
            title: _('Always visible workspaces'),
            subtitle: _('The first N workspaces stay visible even when empty. The active workspace is always shown.'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 20,
                step_increment: 1,
                page_increment: 5,
                value: settings.get_int('persistent-workspaces'),
            }),
        });
        settings.bind('persistent-workspaces', persistentRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(persistentRow);

        // Max workspaces to show
        const maxRow = new Adw.SpinRow({
            title: _('Maximum workspaces'),
            subtitle: _('Maximum number of workspaces to show in the indicator.'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 20,
                step_increment: 1,
                page_increment: 5,
                value: settings.get_int('max-workspaces'),
            }),
        });
        settings.bind('max-workspaces', maxRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(maxRow);

        // Follow window on move (Hyprland style)
        const followWindowRow = new Adw.SwitchRow({
            title: _('Follow window when moving'),
            subtitle: _('When moving active window to another workspace (Super+Shift+1..0), automatically follow focus to target workspace (Hyprland movetoworkspace).'),
        });
        settings.bind('follow-window', followWindowRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(followWindowRow);

        // 2. Appearance & Layout Group
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance and Layout'),
            description: _('Configure panel placement and visual elements'),
        });
        page.add(appearanceGroup);

        // Panel position
        const positions = ['left', 'center', 'right'];
        const currentPos = settings.get_string('panel-position');
        const posIndex = Math.max(0, positions.indexOf(currentPos));

        const positionRow = new Adw.ComboRow({
            title: _('Panel position'),
            subtitle: _('Position of the dynamic workspace pills on the GNOME top bar'),
            model: new Gtk.StringList({
                strings: [_('Left'), _('Center'), _('Right')],
            }),
            selected: posIndex,
        });
        positionRow.connect('notify::selected', () => {
            const selected = positions[positionRow.selected] || 'left';
            settings.set_string('panel-position', selected);
        });
        appearanceGroup.add(positionRow);

        // Hide default indicator / activities
        const hideDefaultRow = new Adw.SwitchRow({
            title: _('Hide default workspace indicator'),
            subtitle: _('Hide the built-in GNOME activities / workspace dots button in the top bar.'),
        });
        settings.bind('hide-default-indicator', hideDefaultRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearanceGroup.add(hideDefaultRow);

        // Show workspace names
        const showNamesRow = new Adw.SwitchRow({
            title: _('Show workspace names on pills'),
            subtitle: _('Show custom workspace names instead of numbers.'),
        });
        settings.bind('show-workspace-names', showNamesRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearanceGroup.add(showNamesRow);

        // Show tooltip on hover
        const showTooltipRow = new Adw.SwitchRow({
            title: _('Show tooltip on hover'),
            subtitle: _('Show tooltip with workspace name when hovering over a pill.'),
        });
        settings.bind('show-tooltip', showTooltipRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearanceGroup.add(showTooltipRow);

        // 3. Multi-Monitor Group
        const monitorGroup = new Adw.PreferencesGroup({
            title: _('Multi-Monitor'),
            description: _('Multi-display occupancy filtering'),
        });
        page.add(monitorGroup);

        const filterMonitorRow = new Adw.SwitchRow({
            title: _('Only count windows on this monitor'),
            subtitle: _('When enabled, a workspace is considered occupied only if it contains windows on the screen where the indicator is located.'),
        });
        settings.bind('filter-by-monitor', filterMonitorRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        monitorGroup.add(filterMonitorRow);

        // 4. Keyboard Shortcuts Reference Group
        const shortcutsGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcuts Reference'),
            description: _('Configured system shortcuts for navigation and window management'),
        });
        page.add(shortcutsGroup);

        const shortcutsInfo = new Gtk.Label({
            label: _(
                '• <b>Super+1..9, Super+0</b> — Switch directly to workspace 1–10\n' +
                '• <b>Super+Shift+1..9, Super+Shift+0</b> — Move active window to workspace and follow view\n' +
                '• <b>Left-Click</b> on any workspace pill — Switch to that workspace\n' +
                '• <b>Mouse Wheel Scroll</b> on the indicator — Cycle workspaces forward / backward'
            ),
            use_markup: true,
            xalign: 0,
            margin_top: 8,
            margin_bottom: 8,
            margin_start: 12,
            margin_end: 12,
            wrap: true,
            selectable: true,
        });
        shortcutsGroup.add(shortcutsInfo);
    }
}
