#!/usr/bin/env bash
# Script para empacotar a extensão pronta para upload em https://extensions.gnome.org/upload/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

UUID="dynamic-workspaces@enthonyaraujo.github.io"
ZIP_NAME="${UUID}.shell-extension.zip"

echo "=========================================================="
echo "  Empacotando Dynamic Workspaces para extensions.gnome.org"
echo "=========================================================="

# 1. Regenerar traduções
echo ""
echo "[1/3] Atualizando traduções..."
./build-translations.sh

# 2. Empacotar via gnome-extensions pack
echo ""
echo "[2/3] Gerando pacote ZIP com gnome-extensions pack..."
gnome-extensions pack \
    --podir=po \
    --schema=schemas/org.gnome.shell.extensions.dynamic-workspaces.gschema.xml \
    --extra-source=stylesheet.css \
    --force

echo "  -> Pacote gerado com sucesso: $ZIP_NAME"

# 3. Validar conformidade com as diretrizes do GNOME (shexli)
echo ""
echo "[3/3] Validando conformidade com as diretrizes do GNOME..."
if command -v shexli >/dev/null 2>&1 || python3 -m shexli --help >/dev/null 2>&1; then
    python3 -m shexli "$ZIP_NAME"
    echo "  -> Validação com shexli concluída com sucesso!"
else
    echo "  -> Aviso: 'shexli' não instalado. Pule a validação estática ou instale via 'pip install shexli'."
fi

echo ""
echo "=========================================================="
echo "  Pacote pronto para upload!"
echo "=========================================================="
echo "Arquivo: $PWD/$ZIP_NAME"
echo "Envie este arquivo diretamente em: https://extensions.gnome.org/upload/"
echo ""
