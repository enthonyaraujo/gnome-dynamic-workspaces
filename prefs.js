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

        // ========================================================
        // ABA 1: COMPORTAMENTO
        // ========================================================
        const pageBehavior = new Adw.PreferencesPage({
            title: _('Behavior'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(pageBehavior);

        // 1. Grupo Gerenciamento de Espaços de Trabalho (Nativo GNOME)
        const mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
        const wmSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.wm.preferences' });

        const workspacesGroup = new Adw.PreferencesGroup({
            title: _('Workspaces'),
        });
        pageBehavior.add(workspacesGroup);

        const isDynamic = mutterSettings.get_boolean('dynamic-workspaces');

        const radioDynamic = new Gtk.CheckButton({
            active: isDynamic,
        });
        const radioFixed = new Gtk.CheckButton({
            group: radioDynamic,
            active: !isDynamic,
        });

        const rowDynamic = new Adw.ActionRow({
            title: _('Dynamic workspaces'),
            subtitle: _('Automatically removes empty workspaces'),
        });
        rowDynamic.add_prefix(radioDynamic);
        rowDynamic.set_activatable_widget(radioDynamic);
        workspacesGroup.add(rowDynamic);

        const rowFixed = new Adw.ActionRow({
            title: _('Fixed number of workspaces'),
            subtitle: _('Specifies a permanent number of workspaces'),
        });
        rowFixed.add_prefix(radioFixed);
        rowFixed.set_activatable_widget(radioFixed);
        workspacesGroup.add(rowFixed);

        const currentNum = wmSettings.get_int('num-workspaces');
        const initialNum = (currentNum && currentNum > 0) ? currentNum : 10;
        const fixedNumRow = new Adw.SpinRow({
            title: _('Number of workspaces'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 36,
                step_increment: 1,
                page_increment: 1,
                value: initialNum,
            }),
            sensitive: !isDynamic,
        });
        wmSettings.bind('num-workspaces', fixedNumRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        workspacesGroup.add(fixedNumRow);

        radioDynamic.connect('toggled', () => {
            if (radioDynamic.active) {
                mutterSettings.set_boolean('dynamic-workspaces', true);
                fixedNumRow.sensitive = false;
            }
        });

        radioFixed.connect('toggled', () => {
            if (radioFixed.active) {
                mutterSettings.set_boolean('dynamic-workspaces', false);
                fixedNumRow.sensitive = true;
            }
        });

        const mutterSignalId = mutterSettings.connect('changed::dynamic-workspaces', () => {
            const dyn = mutterSettings.get_boolean('dynamic-workspaces');
            if (radioDynamic.active !== dyn) {
                radioDynamic.active = dyn;
            }
            fixedNumRow.sensitive = !dyn;
        });

        window.connect('close-request', () => {
            if (mutterSignalId) {
                mutterSettings.disconnect(mutterSignalId);
            }
        });

        // 2. Grupo Comportamento das Workspaces
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Workspaces Behavior'),
            description: _('Configure dynamic display and persistent workspaces'),
        });
        pageBehavior.add(behaviorGroup);

        // Workspaces sempre visíveis (persistent-workspaces)
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

        // Máximo de workspaces (max-workspaces)
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

        // Seguir janela ao mover (follow-window)
        const followWindowRow = new Adw.SwitchRow({
            title: _('Follow window when moving'),
            subtitle: _('When moving active window to another workspace (Super+Shift+1..0), automatically follow focus to target workspace (Hyprland movetoworkspace).'),
        });
        settings.bind('follow-window', followWindowRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(followWindowRow);

        // 2. Grupo Multi-Monitor
        const monitorGroup = new Adw.PreferencesGroup({
            title: _('Multi-Monitor'),
            description: _('Multi-display occupancy filtering'),
        });
        pageBehavior.add(monitorGroup);

        const filterMonitorRow = new Adw.SwitchRow({
            title: _('Only count windows on this monitor'),
            subtitle: _('When enabled, a workspace is considered occupied only if it contains windows on the screen where the indicator is located.'),
        });
        settings.bind('filter-by-monitor', filterMonitorRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        monitorGroup.add(filterMonitorRow);

        // 3. Grupo Atalhos de Teclado (Referência)
        const shortcutsGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcuts Reference'),
            description: _('Configured system shortcuts for navigation and window management'),
        });
        pageBehavior.add(shortcutsGroup);

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

        // ========================================================
        // ABA 2: VISUAL
        // ========================================================
        const pageVisual = new Adw.PreferencesPage({
            title: _('Visual'),
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(pageVisual);

        // 1. Grupo Estilo do Indicador
        const styleGroup = new Adw.PreferencesGroup({
            title: _('Indicator Style'),
            description: _('Choose the visual presentation of the workspace indicator'),
        });
        pageVisual.add(styleGroup);

        const styleKeys = ['pure', 'dots', 'pill'];
        const styleNames = [
            _('GNOME Puro'),
            _('Indicadores de uso'),
            _('Cápsula sutil'),
        ];
        const styleDescriptions = {
            pure: _('Indicador minimalista seguindo a linguagem visual padrão do GNOME Shell.'),
            dots: _('Exibe o número da workspace com um ponto discreto apenas na workspace ativa.'),
            pill: _('Destaca a workspace ativa com uma superfície discreta estilo Adwaita.'),
        };

        const currentStyleKey = settings.get_string('indicator-style') || 'pure';
        let initialIndex = styleKeys.indexOf(currentStyleKey);
        if (initialIndex === -1) initialIndex = 0;

        const styleComboRow = new Adw.ComboRow({
            title: _('Indicator style'),
            subtitle: _('Select one of the 3 visual presentation modes'),
            model: new Gtk.StringList({
                strings: styleNames,
            }),
            selected: initialIndex,
        });
        styleGroup.add(styleComboRow);

        // Linha com a descrição contextual do estilo ativo
        const descActionRow = new Adw.ActionRow({
            title: _('About this style'),
            subtitle: styleDescriptions[styleKeys[initialIndex]],
        });
        styleGroup.add(descActionRow);

        // Linha com a Prévia Visual Estática
        const previewRow = new Adw.ActionRow({
            title: _('Live Preview'),
            subtitle: _('Preview of how the indicator will look in the top bar'),
        });
        styleGroup.add(previewRow);

        const previewContainer = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.END,
            margin_top: 4,
            margin_bottom: 4,
        });
        previewRow.add_suffix(previewContainer);

        // Função para atualizar a prévia estática e a descrição
        const updatePreview = (key) => {
            descActionRow.subtitle = styleDescriptions[key] || '';

            // Limpa filhos anteriores da prévia
            let child = previewContainer.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                previewContainer.remove(child);
                child = next;
            }

            if (key === 'pure') {
                const l1 = new Gtk.Label({ label: '<b>1</b>', use_markup: true, css_classes: ['title-4', 'accent'] });
                const l2 = new Gtk.Label({ label: '2', css_classes: ['dim-label'] });
                const l3 = new Gtk.Label({ label: '3', css_classes: ['dim-label'] });
                previewContainer.append(l1);
                previewContainer.append(l2);
                previewContainer.append(l3);
            } else if (key === 'dots') {
                const b1 = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 1, halign: Gtk.Align.CENTER });
                b1.append(new Gtk.Label({ label: '<b>1</b>', use_markup: true }));
                b1.append(new Gtk.Label({ label: '•', css_classes: ['accent'] }));

                const b2 = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 1, halign: Gtk.Align.CENTER });
                b2.append(new Gtk.Label({ label: '2', css_classes: ['dim-label'] }));
                b2.append(new Gtk.Label({ label: ' ' }));

                const b3 = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 1, halign: Gtk.Align.CENTER });
                b3.append(new Gtk.Label({ label: '3', css_classes: ['dim-label'] }));
                b3.append(new Gtk.Label({ label: ' ' }));

                previewContainer.append(b1);
                previewContainer.append(b2);
                previewContainer.append(b3);
            } else if (key === 'pill') {
                const p1 = new Gtk.Label({ label: ' 1 ', css_classes: ['card', 'heading'] });
                const p2 = new Gtk.Label({ label: '2', css_classes: ['dim-label'] });
                const p3 = new Gtk.Label({ label: '3', css_classes: ['dim-label'] });
                previewContainer.append(p1);
                previewContainer.append(p2);
                previewContainer.append(p3);
            }
        };

        // Atualização ao trocar estilo no combo
        styleComboRow.connect('notify::selected', () => {
            const selectedKey = styleKeys[styleComboRow.selected] || 'pure';
            settings.set_string('indicator-style', selectedKey);
            updatePreview(selectedKey);
        });

        // Inicializa preview
        updatePreview(styleKeys[initialIndex]);

        // 2. Grupo Painel e Elementos
        const panelGroup = new Adw.PreferencesGroup({
            title: _('Panel and Elements'),
            description: _('Configure panel placement and complementary visual elements'),
        });
        pageVisual.add(panelGroup);

        // Posição no painel (panel-position)
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
        panelGroup.add(positionRow);

        // Ocultar indicador nativo do GNOME (hide-default-indicator)
        const hideDefaultRow = new Adw.SwitchRow({
            title: _('Hide default workspace indicator'),
            subtitle: _('Hide the built-in GNOME activities / workspace dots button in the top bar.'),
        });
        settings.bind('hide-default-indicator', hideDefaultRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        panelGroup.add(hideDefaultRow);

        // Exibir tooltip ao passar mouse (show-tooltip)
        const showTooltipRow = new Adw.SwitchRow({
            title: _('Show tooltip on hover'),
            subtitle: _('Show tooltip with workspace name when hovering over a pill.'),
        });
        settings.bind('show-tooltip', showTooltipRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        panelGroup.add(showTooltipRow);
    }
}
