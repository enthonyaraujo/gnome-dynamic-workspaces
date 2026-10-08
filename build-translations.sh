#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN="dynamic-workspaces@enthony.github.io"
POT_FILE="po/${DOMAIN}.pot"

echo "=========================================================="
echo "  Construindo traduções para Dynamic Workspaces"
echo "=========================================================="

mkdir -p po locale

echo ""
echo "[1/3] Extraindo mensagens com xgettext..."
xgettext --from-code=UTF-8 \
         --language=JavaScript \
         --keyword=_ \
         --keyword=ngettext:1,2 \
         --keyword=pgettext:1c,2 \
         --add-comments \
         --package-name="Dynamic Workspaces" \
         --package-version="1" \
         --msgid-bugs-address="enthonyaraujo01@gmail.com" \
         -o "$POT_FILE" \
         extension.js prefs.js

echo "  -> Template POT gerado em $POT_FILE"

echo ""
echo "[2/3] Atualizando catálogos PO existentes com msgmerge..."
for po in po/*.po; do
    [ -f "$po" ] || continue
    echo "  -> Mesclando $po..."
    msgmerge --update --backup=none --quiet "$po" "$POT_FILE"
done

echo ""
echo "[3/3] Compilando arquivos MO com msgfmt..."
for po in po/*.po; do
    [ -f "$po" ] || continue
    lang=$(basename "$po" .po)
    target_dir="locale/${lang}/LC_MESSAGES"
    mkdir -p "$target_dir"
    msgfmt -o "${target_dir}/${DOMAIN}.mo" "$po"
    echo "  -> Compilado: ${target_dir}/${DOMAIN}.mo"
done

echo ""
echo "=========================================================="
echo "  Traduções construídas com sucesso!"
echo "=========================================================="
