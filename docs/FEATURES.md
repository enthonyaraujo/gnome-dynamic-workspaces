# Recursos e Funcionalidades: GNOME Dynamic Workspaces

## 1. Workspaces Dinâmicas Estilo Hyprland
- **Visualização limpa e inteligente**:
  - Exibe apenas as workspaces que contêm janelas abertas e a workspace atualmente ativa.
  - As workspaces vazias intermediárias não ocupam espaço na barra superior.
  - Ao alternar para uma nova workspace vazia, ela surge em destaque; caso você saia dela sem abrir nenhuma janela, ela se recolhe e desaparece automaticamente.
- **Workspaces Persistentes**:
  - Configuração ajustável para manter as primeiras $N$ workspaces sempre visíveis (padrão: `1`), mesmo que estejam completamente vazias.

## 2. Navegação Rápida e Produtiva via Teclado
- **Alternar de Workspace Diretamente**:
  - `Super+1` a `Super+9`: salta direto para as workspaces 1 a 9.
  - `Super+0`: salta direto para a workspace 10.
- **Mover Janela e Acompanhar Foco (`movetoworkspace`)**:
  - `Super+Shift+1` a `Super+Shift+9`: move a janela em foco para a workspace correspondente e transporta a visualização e o foco instantaneamente junto com ela.
  - `Super+Shift+0`: move a janela em foco para a workspace 10 e transporta a visualização.

## 3. Interação com Mouse e Touchpad
- **Clique Direto**: Clique com o botão esquerdo em qualquer pílula de workspace para alternar para ela imediatamente.
- **Rolagem do Mouse (Mouse Wheel)**: Ao posicionar o cursor sobre o indicador e rolar para cima ou para baixo, as workspaces são percorridas sequencialmente.
- **Tooltips Informativos**: Passe o mouse sobre qualquer pílula para ver o nome real configurado da workspace.

## 4. Estilo Visual e Tematização Adwaita
- **Pílulas Modernas com Cores do Sistema**:
  - Workspace ativa: utiliza a cor de destaque do tema GNOME (`@accent_bg_color`) com texto de alto contraste (`@accent_fg_color`).
  - Workspaces ocupadas (com janelas): fundo translúcido suave e texto padrão.
  - Workspaces persistentes vazias: fundo com opacidade reduzida (`0.05`) e texto atenuado.
  - Efeito suave de hover e transições animadas.

## 5. Suporte a Multi-Monitor
- **Modo Global**: Considera janelas em todos os monitores conectados para manter as workspaces visíveis.
- **Filtro por Monitor (`filter-by-monitor`)**: Opção para considerar ocupada apenas a workspace que tiver janelas presentes na tela física onde o painel específico está localizado.

## 6. Painel e Customização
- **Posicionamento**: Escolha se o indicador deve ficar à esquerda (`left`), no centro (`center`) ou à direita (`right`) do painel superior.
- **Ocultar Indicador Padrão**: Opção de ocultar os pontos de workspaces nativos do GNOME para uma barra superior 100% limpa e integrada.
- **Preferências Gráficas**: Painel de configurações moderno construído em Libadwaita (`gnome-extensions prefs dynamic-workspaces@enthonyaraujo.github.io`).
