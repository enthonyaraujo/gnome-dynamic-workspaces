# Arquitetura Técnica: GNOME Dynamic Workspaces

## 1. Visão Geral da Arquitetura

O GNOME Shell executa todas as suas extensões dentro do mesmo processo do compositor (`mutter`). Diferente do KDE Plasma (onde o painel roda no `plasmashell` separado do compositor `kwin`), no GNOME Shell a extensão tem acesso direto e síncrono tanto aos atores da UI (`St`, `Clutter`, `Main.panel`) quanto ao gerenciador de janelas e workspaces (`Meta.WorkspaceManager`, `global.display`, `Meta.Window`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                              GNOME Shell                               │
│                                                                        │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │     WorkspaceManager  │              │       global.display      │  │
│  │ (active-workspace, n) │              │      (window-created)     │  │
│  └───────────┬───────────┘              └─────────────┬─────────────┘  │
│              │ sinais                                 │ sinais         │
│              ▼                                        ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                WorkspaceIndicator (PanelMenu.Button)             │  │
│  │                                                                  │  │
│  │  • _onActiveWorkspaceChanged()   • _trackWindow(win)             │  │
│  │  • _rebuild()                    • _onWindowWorkspaceChanged()   │  │
│  │  • _updateButtons()              • _isWorkspaceOccupied(i)       │  │
│  │  • handleWorkspaceScroll(event)                                 │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ renderiza                        │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Top Panel (UI)                           │  │
│  │   [1] (ativo)     [2] (ocupado)     [4] (persistente vazio)      │  │
│  │   (accent color)   (translucido)     (opacidade reduzida)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes Internos

### 2.1. `WorkspaceButton` (`St.Button`)
- Representa visualmente uma pílula de workspace individual.
- Gerencia seu estado interno:
  - `active`: booleano indicando se é o desktop virtual em foco.
  - `occupied`: booleano indicando se há janelas válidas abertas nela.
  - `persistent`: booleano indicando se deve permanecer visível mesmo vazia (`index < persistentWorkspaces`).
  - `shown`: `active || occupied || persistent`.
- Exibe tooltip nativo no hover utilizando `Meta.prefs_get_workspace_name(index)` ou `Workspace N`, alinhado dinamicamente com as coordenadas do ator e monitor.
- No clique do mouse, invoca `workspace.activate(global.get_current_time())`.

### 2.2. `WorkspaceIndicator` (`PanelMenu.Button`)
- Contêiner inserido na barra superior (`Main.panel`) via `Main.panel.addToStatusArea()`.
- Captura eventos de scroll do mouse (`scroll-event`) e os despacha para `Main.wm.handleWorkspaceScroll(event)` para alternância contínua entre workspaces.
- Monitora os sinais de ciclo de vida do `global.workspace_manager`:
  - `active-workspace-changed`
  - `notify::n-workspaces`
  - `workspace-added`
  - `workspace-removed`
- Rastreia a criação e destruição de janelas via `global.display.connectObject('window-created', ...)`.

### 2.3. Rastreamento de Ocupação Reativo (Zero Polling)
- Para cada janela criada, o indicador conecta sinais pontuais via `connectObject`:
  - `workspace-changed`: dispara reavaliação de ocupação e seguimento de foco.
  - `notify::skip-taskbar`: reavalia ocupação (ex: docks e widgets de fundo são ignorados).
  - `notify::minimized`: reavalia ocupação.
  - `unmanaging`: desconecta sinais ao fechar a janela.
- Janelas elegíveis para manter uma workspace visível:
  - Não estão em todos os desktops (`!win.is_on_all_workspaces()`).
  - Não possuem flag `skip_taskbar`.
  - Pertencem aos tipos `NORMAL`, `DIALOG`, `MODAL_DIALOG` ou `UTILITY`.
  - Se o filtro multi-monitor estiver ativo (`filter-by-monitor`), estão no monitor onde a barra reside (`win.get_monitor() === monitorIndex`).

### 2.4. Acompanhar Janela ao Mover (`movetoworkspace` / Follow Window)
No GNOME nativo, quando uma janela é movida para outra workspace via atalho (`Super+Shift+1..0`), ela é transferida, mas a tela permanece na workspace de origem.

O indicador intercepta isso de forma transparente:
```javascript
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
```
Isso garante que **qualquer método** que transfira a janela ativa (atalho do Mutter, arrastar na visualização de visão geral, scripts externos) faça a visualização e o foco acompanharem a janela para a nova workspace.

---

## 3. Integração com o Sistema

1. **GSettings (`schemas/`)**:
   - Schema compilado via `glib-compile-schemas`.
   - Permite alteração dinâmica de configurações sem necessidade de reiniciar o Shell.
2. **Libadwaita (`prefs.js`)**:
   - Interface visual de preferências com GTK4 / Libadwaita (`Adw.PreferencesPage`, `Adw.SpinRow`, `Adw.SwitchRow`, `Adw.ComboRow`).
3. **Estilos (`stylesheet.css`)**:
   - Integração com as cores de destaque dinâmicas do GNOME (`@accent_bg_color`, `@accent_fg_color`).
