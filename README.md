# GNOME Dynamic Workspaces

Extensão para o **GNOME Shell 50 / 51** (e retrocompatível com 45+) que traz o comportamento de workspaces dinâmicas e navegação estilo **Hyprland**:
- Exibe dinamicamente apenas a workspace ativa e aquelas que contêm janelas abertas.
- Navegação direta entre até 10 workspaces com atalhos de teclado (`Super+1..0`).
- Mover janela ativa e acompanhar o foco automaticamente para a nova workspace (`Super+Shift+1..0`, estilo `movetoworkspace`).
- Alternar diretamente de workspace clicando com o mouse em qualquer pílula do indicador.
- Ciclar entre workspaces rolando a roda do mouse sobre o indicador.
- Script de instalação e configuração automatizado para Wayland e X11.

> **Equivalente GNOME** do projeto [`plasma-dynamic-workspaces`](https://github.com/enthonyaraujo/plasma-dynamic-workspaces) do KDE Plasma 6.

---

## Comportamento e Recursos

1. **Workspaces Dinâmicas**:
   - Inicialmente, exibe apenas a workspace persistente configurada (padrão: `[1]`).
   - Ao navegar para outra workspace (ex.: `Super+2`), a nova workspace aparece em destaque (`[1] [2]`).
   - Ao trocar para uma workspace vazia seguinte (ex.: `[3]`), a workspace intermediária vazia (`[2]`) desaparece automaticamente (`[1] [3]`).
   - Se a workspace intermediária contiver ao menos uma janela aberta, ela permanece visível com opacidade intermediária (`[1] [2] [3]`).
2. **Estilo e Tematização GNOME / Libadwaita**:
   - Workspace ativa: cor de destaque do sistema (`@accent_bg_color`) e texto de alto contraste (`@accent_fg_color`).
   - Workspaces inativas com janelas: fundo translúcido suave (`alpha(currentColor, 0.12)`) e texto do tema.
   - Workspaces vazias persistentes: opacidade reduzida (`0.45`).
   - Efeito hover suave e transições animadas.
3. **Interação**:
   - Clique em qualquer pílula para alternar imediatamente para ela.
   - Rolagem do mouse sobre o indicador para ciclar entre as workspaces.
   - Tooltips com o nome real de cada workspace configurada no GNOME.
   - **Acompanhar janela ao mover (Estilo Hyprland `movetoworkspace`)**: ao usar `Super+Shift+1..0`, a janela ativa é movida para a workspace escolhida e a visualização segue imediatamente junto com ela.
4. **Desempenho Reativo (Zero Polling)**:
   - Não utiliza timers nem loops de verificação (`GLib.timeout_add`).
   - Usa diretamente os sinais de eventos do `Meta.WorkspaceManager`, `global.display` e instâncias de `Meta.Window`.
   - Filtra automaticamente janelas fixadas em todas as telas ("on all workspaces") e utilitários em segundo plano (`skip_taskbar`), evitando falsos positivos de ocupação.

---

## Multi-Monitor: Análise Técnica e Comportamento

- **Modo Padrão (Global)**: O indicador rastreia a workspace ativa e janelas abertas em qualquer tela conectada.
- **Filtro por Monitor (`filter-by-monitor`)**: Nas preferências da extensão (*Multi-Monitor > Apenas contar janelas neste monitor*), é possível restringir a contagem para considerar ocupada apenas a workspace que contiver janelas na tela física onde o painel se encontra.

---

## Estrutura do Código

```text
gnome-workspace-indicator/
├── metadata.json                                          # Metadados da extensão GNOME 50/51
├── extension.js                                           # Código principal ESM (UI, eventos, follow-window)
├── prefs.js                                               # Interface gráfica de preferências em Libadwaita
├── stylesheet.css                                         # Estilização das pílulas e tooltips
├── schemas/
│   └── org.gnome.shell.extensions.dynamic-workspaces.gschema.xml # Schema GSettings oficial
├── docs/
│   ├── ARCHITECTURE.md                                    # Arquitetura detalhada e fluxo de sinais
│   ├── CONTEXT.md                                         # Contexto, motivação e escopo
│   ├── DECISIONS.md                                       # Registro de decisões técnicas
│   ├── FEATURES.md                                        # Especificação completa de recursos
│   └── KDE_GNOME_PARITY.md                                # Matriz de paridade KDE Plasma vs GNOME
├── install.sh                                             # Script de instalação e configuração de atalhos
├── uninstall.sh                                           # Script de desinstalação e restauração
└── README.md
```

---

## Instalação

### Instalação Rápida (Script Automatizado)

Você pode instalar a extensão e configurar automaticamente os atalhos `Super+1..0` (alternar workspace) e `Super+Shift+1..0` (mover janela ativa e acompanhá-la) para até 10 workspaces executando o script incluído:

```bash
./install.sh
```

O script:
1. Compila os esquemas GSettings locais com `glib-compile-schemas`.
2. Instala a extensão no perfil do usuário (`~/.local/share/gnome-shell/extensions/dynamic-workspaces@enthonyaraujo.github.io/`).
3. Configura 10 workspaces estáticas no GNOME Mutter (`org.gnome.mutter dynamic-workspaces false` e `num-workspaces 10`).
4. Libera os atalhos `Super+1..9` do inicializador do Dash do GNOME (`switch-to-application-1..9`).
5. Atribui `Super+1..9` e `Super+0` para alternar diretamente entre as 10 workspaces (`switch-to-workspace-1..10`).
6. Atribui `Super+Shift+1..9` e `Super+Shift+0` para mover a janela ativa para qualquer uma das 10 workspaces (`move-to-workspace-1..10`).
7. Habilita a extensão em tempo real no GNOME Shell via `gnome-extensions enable`.

---

### Instalação Manual

Caso prefira instalar manualmente:

```bash
# 1. Compilar schemas
glib-compile-schemas schemas/

# 2. Criar diretório de destino
mkdir -p ~/.local/share/gnome-shell/extensions/dynamic-workspaces@enthonyaraujo.github.io/schemas

# 3. Copiar arquivos
cp metadata.json extension.js prefs.js stylesheet.css ~/.local/share/gnome-shell/extensions/dynamic-workspaces@enthonyaraujo.github.io/
cp schemas/* ~/.local/share/gnome-shell/extensions/dynamic-workspaces@enthonyaraujo.github.io/schemas/

# 4. Habilitar extensão
gnome-extensions enable dynamic-workspaces@enthonyaraujo.github.io
```

---

## Preferências

As configurações podem ser abertas via interface gráfica:

```bash
gnome-extensions prefs dynamic-workspaces@enthonyaraujo.github.io
```

Opções disponíveis:
- **Workspaces sempre visíveis**: Quantidade de workspaces que permanecem visíveis mesmo vazias (padrão: `1`).
- **Máximo de workspaces**: Limite de workspaces exibidas no indicador (padrão: `10`).
- **Acompanhar janela ao mover**: Ativa ou desativa a alternância automática de visão ao mover uma janela com `Super+Shift+n`.
- **Posição no painel**: Escolha entre Esquerda (`left`), Centro (`center`) ou Direita (`right`).
- **Ocultar indicador padrão**: Oculta os pontos de workspaces nativos do GNOME Shell.
- **Multi-monitor**: Filtra janelas apenas pelo monitor do painel.
- **Mostrar nomes**: Exibe os nomes configurados das workspaces nas pílulas em vez de números.
- **Tooltips**: Exibe o nome da workspace ao passar o mouse.

---

## Como Testar

1. Execute `./install.sh`.
2. Verifique o indicador na barra superior: com apenas a workspace 1 em uso, apenas a pílula `[1]` estará visível em destaque.
3. Pressione `Super+2`: a pílula `[2]` aparecerá em destaque e `[1]` ficará esmaecida.
4. Pressione `Super+3`: a workspace `[2]` desaparecerá automaticamente e a `[3]` estará ativa.
5. Abra uma janela na workspace 3 (ex.: terminal ou navegador) e volte para a workspace 1 (`Super+1`): a pílula `[3]` permanecerá visível indicando que há janelas ativas naquele desktop.
6. Com uma janela aberta, pressione `Super+Shift+2`: a janela será enviada para a workspace 2 e a sua visualização acompanhará o foco imediatamente para a workspace 2!
7. Role a roda do mouse sobre o indicador para avançar e voltar de workspace rapidamente.
8. Clique com o botão esquerdo do mouse em qualquer pílula para saltar diretamente para ela.

---

## Desinstalação

### Desinstalação Automática

Para desabilitar e remover a extensão e restaurar os atalhos originais do sistema GNOME:

```bash
./uninstall.sh
```

---

## Autor & Mantenedor

Desenvolvido por **Enthony Araujo** ([@enthonyaraujo](https://github.com/enthonyaraujo)).

---

## Licença

Distribuído sob a licença **GNU General Public License v2.0 ou posterior**. Consulte o arquivo [LICENSE](LICENSE) para obter o texto completo da licença.
