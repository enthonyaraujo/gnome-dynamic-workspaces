# Matriz de Paridade Técnica: KDE Plasma 6 vs GNOME Shell 50/51

Esta tabela documenta como cada recurso e componente do projeto no KDE Plasma 6 (`plasma-dynamic-workspaces`) é implementado no GNOME Shell 50/51 (`gnome-workspace-indicator`).

| Recurso / Aspecto | KDE Plasma 6 (`kde-workspace`) | GNOME Shell 50/51 (`gnome-workspace-indicator`) | Paridade |
|---|---|---|---|
| **Ambiente Alvo** | KDE Plasma 6.0+ (Wayland & X11) | GNOME Shell 45, 50, 51+ (Wayland & X11) | 100% |
| **Linguagem / Stack** | QML, QtQuick, JavaScript ES6 | JavaScript ESM, GJS, St/Clutter, Libadwaita | 100% |
| **Empacotamento da UI** | Plasmoid (`package/metadata.json`) instalado via `kpackagetool6` | GNOME Extension (`metadata.json`) instalada via `gnome-extensions` | 100% |
| **Arquitetura de Processos** | 2 processos (`plasmashell` UI + script no `kwin`) | 1 processo unificado (extensão roda dentro do compositor `mutter`) | 100% (simplificada no GNOME) |
| **Workspaces Dinâmicas** | Exibe apenas a workspace ativa e as com janelas abertas | Exibe apenas a workspace ativa e as com janelas abertas | 100% idêntico |
| **Pílulas Persistentes** | Configurável (`persistentWorkspaces`, padrão `1`) | Configurável (`persistent-workspaces`, padrão `1`) | 100% idêntico |
| **Detecção de Janelas** | Reativa via `TaskManager.TasksModel` e `KSortFilterProxyModel` | Reativa via sinais `window-created`, `workspace-changed`, `restacked` | 100% (zero polling em ambos) |
| **Filtro de Janelas Pinned** | Ignora `IsOnAllVirtualDesktops` | Ignora `is_on_all_workspaces()` e `skip_taskbar` | 100% idêntico |
| **Navegação Direta** | `Win+1..9` e `Win+0` via `kglobalaccel` e KWin | `Super+1..9` e `Super+0` via `org.gnome.desktop.wm.keybindings` | 100% idêntico |
| **Mover e Acompanhar Foco** | `Win+Shift+1..0` + script KWin Companion (`com.github.enthony.followwindow`) | `Super+Shift+1..0` + handler interno `workspace-changed` no `Meta.Window` | 100% idêntico |
| **Conflito com Barra de Tarefas** | Desativa atalhos de apps do `plasmashell` (`activate task manager entry 1..10`) | Desativa atalhos de apps do GNOME Dash (`switch-to-application-1..9`) | 100% idêntico |
| **Interação de Clique** | Clique na pílula chama D-Bus `setCurrentDesktop` | Clique na pílula chama `ws.activate(timestamp)` | 100% idêntico |
| **Rolagem do Mouse** | `WheelHandler` chama D-Bus `nextDesktop`/`previousDesktop` | `scroll-event` despacha para `Main.wm.handleWorkspaceScroll(event)` | 100% idêntico |
| **Multi-Monitor** | Opção `filterByScreen` com `screenGeometry` | Opção `filter-by-monitor` com `Main.layoutManager` | 100% idêntico |
| **Tooltips** | Tooltip QML com nome do desktop | Tooltip Clutter animado com nome da workspace | 100% idêntico |
| **Interface de Configuração** | KCM QML (`contents/ui/configGeneral.qml`) | Libadwaita / GTK4 Prefs (`prefs.js`) | 100% idêntico |
| **Armazenamento de Configurações** | KConfig XML (`main.xml`) | GSettings XML (`gschema.xml`) | 100% idêntico |
| **Instalação Automatizada** | `./install.sh` (Bash + Python + D-Bus) | `./install.sh` (Bash + GSettings + gnome-extensions) | 100% idêntico |
| **Desinstalação Limpa** | `./uninstall.sh` | `./uninstall.sh` | 100% idêntico |
