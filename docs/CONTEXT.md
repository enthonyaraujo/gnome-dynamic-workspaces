# Contexto do Projeto: GNOME Dynamic Workspaces

- **Projeto**: `gnome-workspace-indicator`
- **Extensão ID**: `dynamic-workspaces@enthony.github.io`
- **Repositório local**: `/home/enthony/GitHub/gnome-workspace-indicator`
- **Status**: Ativo; implementação compatível com GNOME Shell 50/51 (e retrocompatível com 45+)
- **Stack**: GNOME Shell (ESM JavaScript), Mutter/Meta API, Clutter/St, Libadwaita (GTK4), GSettings (XML Schema), Bash
- **Projeto irmão (referência KDE)**: `/home/enthony/GitHub/kde-workspace` (`plasma-dynamic-workspaces`)

---

## 1. Motivação e Objetivo

Em ambientes de desktop modernos como o **Hyprland** (tiling window manager no Wayland), a experiência de workspaces é extremamente limpa, dinâmica e ágil:
1. **Redução de ruído**: Apenas as workspaces ativas e as que contêm janelas abertas são exibidas no painel. Workspaces intermediárias vazias desaparecem automaticamente.
2. **Navegação direta**: Teclas rápidas (`Super+1..0`) alternam instantaneamente para qualquer workspace.
3. **Mover janela acompanhando foco (`movetoworkspace`)**: Ao pressionar `Super+Shift+1..0`, a janela ativa é movida para a workspace desejada e a visualização do usuário acompanha a janela imediatamente.

No KDE Plasma 6, essa experiência foi implementada no projeto irmão `plasma-dynamic-workspaces` através de uma combinação de Plasmoid QML (`package/`), script KWin (`kwin-script/`) e automação via Bash e D-Bus.

O objetivo do **GNOME Dynamic Workspaces** (`gnome-workspace-indicator`) é fornecer **exatamente a mesma experiência de usabilidade, agilidade e elegância visual no GNOME Shell 50 e 51**, respeitando as convenções nativas da plataforma GNOME, seu sistema de temas (Libadwaita/Accent Colors), sua arquitetura ESM e seus mecanismos de atalhos e compositor Mutter.

---

## 2. Princípios de Engenharia

- **Zero Polling (100% Reativo)**: Nunca usar `GLib.timeout_add` para checar janelas ou workspaces periodicamente. Todas as atualizações são disparadas via sinais de eventos do `Meta.WorkspaceManager`, `global.display` e instâncias de `Meta.Window`.
- **Compatibilidade Nativa GNOME 50/51**: Código escrito estritamente de acordo com o padrão ESM introduzido no GNOME 45 e mantido nas versões 50/51, utilizando `import`, `GObject.registerClass`, `connectObject` e Libadwaita nas preferências.
- **Ciclo de Vida Limpo (Zero Leaks)**: Desconexão de todos os sinais e remoção de todos os atores da interface quando a extensão for desabilitada (`disable()`), sem deixar rastros no processo do Shell.
- **Configurabilidade Granular**: Interface de preferências (`prefs.js`) com schema GSettings oficial, permitindo ao usuário ajustar número de workspaces persistentes, posição no painel, filtro multi-monitor e comportamento de seguimento de foco.
