# Recursos e Funcionalidades: GNOME Dynamic Workspaces

## 1. Workspaces Dinâmicas Estilo Hyprland
- **Visualização limpa e inteligente**:
  - Exibe apenas as workspaces que contêm janelas abertas e a workspace atualmente ativa.
  - As workspaces vazias intermediárias não ocupam espaço na barra superior.
  - Ao alternar para uma nova workspace vazia, ela surge em destaque; caso você saia dela sem abrir nenhuma janela, ela se recolhe e desaparece automaticamente.
- **Workspaces Persistentes**:
  - Configuração ajustável para manter as primeiras $N$ workspaces sempre visíveis (padrão: `1`), mesmo que estejam completamente vazias.

## 2. Nova Seção "Visual": 3 Modos de Apresentação
Configuráveis em tempo de execução via interface gráfica sem necessidade de reiniciar a sessão:

1. **GNOME Puro (Minimalista)**:
   - Indicador minimalista seguindo a linguagem visual padrão do GNOME Shell.
   - Tipografia nativa com alto contraste para a workspace ativa e menor contraste para inativas.
   - Sem bordas, sem fundos chamativos e sem elementos decorativos desnecessários.
2. **Indicadores de Uso (Dots)**:
   - Exibe o número da workspace com um ponto discreto (`•`) posicionado exclusivamente abaixo da workspace ativa.
   - Inativas permanecem limpas como texto simples, destacando com precisão o workspace atual.
3. **Cápsula Sutil (Adwaita)**:
   - Destaca a workspace ativa com uma superfície discreta translúcida (`rgba(255, 255, 255, 0.16)`).
   - Inativos permanecem como texto simples sem fundos pesados.

## 3. Navegação Rápida e Produtiva via Teclado
- **Alternar de Workspace Diretamente**:
  - `Super+1` a `Super+9`: salta direto para as workspaces 1 a 9.
  - `Super+0`: salta direto para a workspace 10.
- **Mover Janela e Acompanhar Foco (`movetoworkspace`)**:
  - `Super+Shift+1` a `Super+Shift+9`: move a janela em foco para a workspace correspondente e transporta a visualização e o foco instantaneamente junto com ela.
  - `Super+Shift+0`: move a janela em foco para a workspace 10 e transporta a visualização.

## 4. Interação com Mouse e Touchpad
- **Clique Direto**: Clique com o botão esquerdo em qualquer pílula de workspace para alternar para ela imediatamente.
- **Rolagem do Mouse (Mouse Wheel)**: Ao posicionar o cursor sobre o indicador e rolar para cima ou para baixo, as workspaces são percorridas sequencialmente.
- **Tooltips Informativos**: Passe o mouse sobre qualquer pílula para ver o nome real configurado da workspace.

## 5. Suporte a Multi-Monitor
- **Modo Global**: Considera janelas em todos os monitores conectados para manter as workspaces visíveis.
- **Filtro por Monitor (`filter-by-monitor`)**: Opção para considerar ocupada apenas a workspace que tiver janelas presentes na tela física onde o painel específico está localizado.

## 6. Painel e Customização (Libadwaita)
- **Aba Comportamento**: Configuração de workspaces persistentes, limite máximo, seguimento de janela e atalhos.
- **Aba Visual**:
  - Seletor dos 5 estilos com descrição contextual explicativa.
  - Prévia visual dinâmica e leve em tempo real.
  - Edição de nomes para até 10 workspaces.
  - Posicionamento no painel (`left`, `center`, `right`).
  - Ocultar indicador nativo de atividades/pontos do GNOME.
