#!/usr/bin/env bash
# Script de instalação e configuração do Dynamic Workspaces no GNOME Shell 50/51.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_UUID="dynamic-workspaces@enthonyaraujo.github.io"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "=========================================================="
echo "  Instalação do Dynamic Workspaces (GNOME Shell 50/51)"
echo "=========================================================="

# 1. Compilar GSettings Schemas e Traduções
echo ""
echo "[1/6] Compilando schemas GSettings e traduções..."
if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas "$SCRIPT_DIR/schemas"
    echo "  -> Schemas compilados localmente com sucesso."
else
    echo "  -> ERRO: 'glib-compile-schemas' não encontrado."
    exit 1
fi

if [ -f "$SCRIPT_DIR/build-translations.sh" ]; then
    "$SCRIPT_DIR/build-translations.sh"
    echo "  -> Traduções compiladas com sucesso."
fi

# 2. Instalar arquivos no diretório de extensões do GNOME Shell e esquemas de usuário
echo ""
echo "[2/6] Instalando extensão no diretório do usuário..."
mkdir -p "$TARGET_DIR/schemas"

cp "$SCRIPT_DIR/metadata.json" "$TARGET_DIR/"
cp "$SCRIPT_DIR/extension.js" "$TARGET_DIR/"
cp "$SCRIPT_DIR/prefs.js" "$TARGET_DIR/"
cp "$SCRIPT_DIR/stylesheet.css" "$TARGET_DIR/"
cp "$SCRIPT_DIR/schemas/org.gnome.shell.extensions.dynamic-workspaces.gschema.xml" "$TARGET_DIR/schemas/"
cp "$SCRIPT_DIR/schemas/gschemas.compiled" "$TARGET_DIR/schemas/"

# Copiar catálogo de traduções
if [ -d "$SCRIPT_DIR/locale" ]; then
    cp -r "$SCRIPT_DIR/locale" "$TARGET_DIR/"
    echo "  -> Diretório locale copiado para $TARGET_DIR/locale"
fi

# Instalar também no diretório global de schemas do usuário para compatibilidade com gsettings
USER_SCHEMAS_DIR="$HOME/.local/share/glib-2.0/schemas"
mkdir -p "$USER_SCHEMAS_DIR"
cp "$SCRIPT_DIR/schemas/org.gnome.shell.extensions.dynamic-workspaces.gschema.xml" "$USER_SCHEMAS_DIR/"
glib-compile-schemas "$USER_SCHEMAS_DIR"

echo "  -> Arquivos instalados em $TARGET_DIR e schemas registrados."

# 3. Configurar número de workspaces no Mutter
echo ""
echo "[3/6] Configurando workspaces no GNOME (dinâmico por padrão)..."
gsettings set org.gnome.mutter dynamic-workspaces true
gsettings set org.gnome.desktop.wm.preferences num-workspaces 10
echo "  -> Workspaces dinâmicas configuradas por padrão (com base de 10 para modo fixo)."

# 4. Desativar atalhos conflitantes do GNOME Dash (Super+1..9)
echo ""
echo "[4/6] Liberando atalhos Super+1..9 do inicializador do Dash..."
for i in {1..9}; do
    gsettings set org.gnome.shell.keybindings "switch-to-application-$i" "[]" 2>/dev/null || true
done
echo "  -> Atalhos switch-to-application-1..9 liberados."

# 5. Configurar atalhos no Mutter (Super+1..0 e Super+Shift+1..0)
echo ""
echo "[5/6] Configurando atalhos de navegação e movimentação de janelas..."
for i in {1..10}; do
    num=$(( i == 10 ? 0 : i ))
    gsettings set org.gnome.desktop.wm.keybindings "switch-to-workspace-$i" "['<Super>$num']"
    gsettings set org.gnome.desktop.wm.keybindings "move-to-workspace-$i" "['<Super><Shift>$num']"
done
echo "  -> Super+1..9 e Super+0 mapeados para alternar workspaces."
echo "  -> Super+Shift+1..9 e Super+Shift+0 mapeados para mover janelas e acompanhar foco."

# 6. Habilitar a extensão
echo ""
echo "[6/6] Habilitando a extensão no GNOME Shell..."
if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null || true
    echo "  -> Extensão habilitada via gnome-extensions."
else
    echo "  -> Aviso: comando gnome-extensions não disponível. Ative manualmente no app Extensões."
fi

echo ""
echo "=========================================================="
echo "  Instalação concluída com sucesso!"
echo "=========================================================="
echo ""
echo "Recursos ativos:"
echo "1. Indicador dinâmico de workspaces estilo Hyprland na barra superior."
echo "2. Navegação direta: Super+1..9 e Super+0."
echo "3. Mover janela e acompanhar o foco: Super+Shift+1..9 e Super+Shift+0."
echo "4. Alternar workspaces clicando com o mouse em qualquer pílula."
echo "5. Rolar a roda do mouse sobre o indicador para avançar/voltar de workspace."
echo "6. Preferências acessíveis via 'gnome-extensions prefs $EXTENSION_UUID'."
echo ""
