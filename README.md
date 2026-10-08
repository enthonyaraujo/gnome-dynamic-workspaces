# GNOME Dynamic Workspaces

Extensão para o **GNOME Shell 50 / 51** (e retrocompatível com 45+) que traz o comportamento de workspaces dinâmicas:
- Exibe dinamicamente apenas a workspace ativa e aquelas que contêm janelas abertas.
- Navegação direta entre até 10 workspaces com atalhos de teclado (`Super+1..0`).
- Mover janela ativa e acompanhar o foco automaticamente para a nova workspace (`Super+Shift+1..0`, estilo `movetoworkspace`).
- Alternar diretamente de workspace clicando com o mouse em qualquer pílula do indicador.
- Ciclar entre workspaces rolando a roda do mouse sobre o indicador.
- Script de instalação e configuração automatizado para Wayland e X11.

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
