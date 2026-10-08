#!/usr/bin/env bash
# Script de desinstalação do Dynamic Workspaces no GNOME Shell.

set -euo pipefail

EXTENSION_UUID="dynamic-workspaces@enthonyaraujo.github.io"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "=========================================================="
echo "  Desinstalação do Dynamic Workspaces (GNOME Shell)"
echo "=========================================================="

# 1. Desabilitar a extensão
echo ""
echo "[1/4] Desabilitando extensão no GNOME Shell..."
if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
    echo "  -> Extensão desabilitada."
fi

# 2. Remover diretório da extensão e schemas de usuário
echo ""
echo "[2/4] Removendo arquivos da extensão..."
if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "  -> Diretório $TARGET_DIR removido."
else
    echo "  -> Extensão não encontrada em $TARGET_DIR."
fi

USER_SCHEMA_FILE="$HOME/.local/share/glib-2.0/schemas/org.gnome.shell.extensions.dynamic-workspaces.gschema.xml"
if [ -f "$USER_SCHEMA_FILE" ]; then
    rm -f "$USER_SCHEMA_FILE"
    glib-compile-schemas "$HOME/.local/share/glib-2.0/schemas" 2>/dev/null || true
    echo "  -> Schemas de usuário removidos."
fi

# 3. Restaurar atalhos padrão do GNOME
echo ""
echo "[3/4] Restaurando atalhos originais do sistema..."
for i in {1..9}; do
    gsettings reset org.gnome.shell.keybindings "switch-to-application-$i" 2>/dev/null || true
done

for i in {1..10}; do
    gsettings reset org.gnome.desktop.wm.keybindings "switch-to-workspace-$i" 2>/dev/null || true
    gsettings reset org.gnome.desktop.wm.keybindings "move-to-workspace-$i" 2>/dev/null || true
done
echo "  -> Atalhos restaurados para o padrão."

# 4. Restaurar configuração de workspaces do GNOME
echo ""
echo "[4/4] Restaurando comportamento padrão de workspaces..."
gsettings reset org.gnome.mutter dynamic-workspaces 2>/dev/null || true
gsettings reset org.gnome.desktop.wm.preferences num-workspaces 2>/dev/null || true
echo "  -> Configurações de workspaces restauradas."

echo ""
echo "=========================================================="
echo "  Desinstalação concluída com sucesso!"
echo "=========================================================="
echo ""
