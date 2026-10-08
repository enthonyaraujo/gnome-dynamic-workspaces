# Decisões Arquiteturais: GNOME Dynamic Workspaces

## 1. Padrão ESM para GNOME Shell 50/51
- **Decisão**: Utilizar estritamente módulos ESM (`import ... from '...'`) com a API de Extensões do GNOME Shell 45+ (`resource:///org/gnome/shell/extensions/extension.js` e `resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js`).
- **Motivo**: O GNOME Shell abandonou o sistema CommonJS legatário a partir da versão 45. Nas versões 50 e 51, o ESM é a única arquitetura suportada.
- **Consequência**: Compatibilidade nativa e à prova de futuro para GNOME 45 até 51+.

## 2. Implementação do "Follow Window on Move" sem processo separado
- **Decisão**: Ao invés de criar um daemon externo ou script auxiliar, escutar diretamente o sinal `workspace-changed` no ator `Meta.Window` da janela em foco dentro do próprio processo do GNOME Shell.
- **Motivo**: No KDE, o `plasmashell` é isolado do `kwin`, exigindo um KWin Script companion (`followwindow`). No GNOME, a extensão roda diretamente dentro do processo do Mutter, tendo acesso imediato a `global.display.focus_window` e seus eventos.
- **Consequência**: Execução atômica, zero latência de IPC e simplicidade de manutenção.

## 3. Zero Polling via Conexões de Ciclo de Vida GObject
- **Decisão**: Nunca utilizar `GLib.timeout_add` para verificar janelas abertas. Usar conexões síncronas com `connectObject` em:
  - `global.workspace_manager` (`active-workspace-changed`, `notify::n-workspaces`)
  - `global.display` (`window-created`, `restacked`)
  - instâncias de `Meta.Window` (`workspace-changed`, `notify::skip-taskbar`, `notify::minimized`, `unmanaging`)
- **Motivo**: Polling consome ciclos de CPU continuamente e causa pequenos atrasos perceptíveis. Conexões de eventos garantem resposta instantânea a 0% de uso de CPU em repouso.
- **Consequência**: Desempenho idêntico ao modelo QML TasksModel do KDE.

## 4. Integração de Atalhos via GSettings e Mutter
- **Decisão**: Usar as chaves nativas do Mutter (`org.gnome.desktop.wm.keybindings`) para os atalhos de troca de workspace e movimentação, e desativar os atalhos conflitantes de inicialização de aplicativos do Dash (`org.gnome.shell.keybindings switch-to-application-1..9`).
- **Motivo**: Permite que o Wayland gerencie o dispatch de teclas em nível de compositor sem interferir em layouts de teclado e sem necessidade de interceptar entradas de baixo nível.
- **Consequência**: Atalhos rápidos e consistentes entre sessões X11 e Wayland.
