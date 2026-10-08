# GNOME Dynamic Workspaces

Indicador de workspaces dinâmico e minimalista para **GNOME Shell 50 / 51** (e retrocompatível com 45+):
- Exibe dinamicamente apenas a workspace ativa e aquelas que contêm janelas abertas (estilo Hyprland).
- **5 Modos Visuais Integrados**: alterne em tempo real pela nova aba **Visual** das preferências.
- Navegação direta entre até 10 workspaces com atalhos de teclado (`Super+1..0`).
- Mover janela ativa e acompanhar o foco automaticamente para a nova workspace (`Super+Shift+1..0`, estilo `movetoworkspace`).
- Alternar diretamente de workspace clicando com o mouse em qualquer pílula.
- Ciclar entre workspaces rolando a roda do mouse sobre o indicador.
- Script de instalação e empacotamento automatizado para Wayland e X11.

---

## 🎨 Modos Visuais (Aba "Visual")

Nas configurações da extensão (`gnome-extensions prefs dynamic-workspaces@enthonyaraujo.github.io`), acesse a aba **Visual** para escolher entre:

1. **GNOME Puro (Padrão)**:
   - Indicador minimalista seguindo a linguagem visual padrão do GNOME Shell.
   - Tipografia nativa com destaque sutil de contraste para o workspace ativo.
2. **Indicadores de uso**:
   - Exibe o número da workspace com um ponto discreto (`•`) posicionado exclusivamente abaixo da workspace ativa.
3. **Cápsula sutil**:
   - Destaca a workspace ativa com uma superfície translúcida suave estilo Adwaita (`rgba(255, 255, 255, 0.16)`).

---

## Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Super+1..9`, `Super+0` | Alternar diretamente para a workspace 1 a 10 |
| `Super+Shift+1..9`, `Super+Shift+0` | Mover janela ativa e acompanhar foco para workspace 1 a 10 |
| `Clique Esquerdo` | Alternar diretamente para a workspace clicada |
| `Roda do Mouse` | Percorrer workspaces sequencialmente |

---

## Instalação e Configuração

Execute o script de instalação automática:

```bash
./install.sh
```

---

## Empacotamento para Publicação

Para gerar o pacote `.zip` oficial para envio em [extensions.gnome.org/upload](https://extensions.gnome.org/upload/):

```bash
./package.sh
```

O script atualiza os catálogos de tradução, gera o `.shell-extension.zip` via `gnome-extensions pack` e valida a conformidade das regras do GNOME via `shexli`.

---

## Autor & Mantenedor

Desenvolvido por **Enthony Araujo** ([@enthonyaraujo](https://github.com/enthonyaraujo)).

---

## Licença

Distribuído sob a licença **GNU General Public License v2.0 ou posterior**. Consulte o arquivo [LICENSE](LICENSE) para obter o texto completo da licença.
