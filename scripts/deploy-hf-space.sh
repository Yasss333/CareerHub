#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  CareerHub ML Service -> Hugging Face Spaces Deployer  "
echo "=========================================================="

SPACE_URL="$1"

if [ -z "$SPACE_URL" ]; then
  echo ""
  echo "Step 1: If you haven't created a Space yet, go to: https://huggingface.co/new-space"
  echo "  - SDK: Docker"
  echo "  - Hardware: Blank / CPU basic (16GB RAM free)"
  echo "  - Visibility: Public or Private"
  echo ""
  read -p "Enter your Hugging Face Space Git Clone URL (e.g. https://huggingface.co/spaces/username/careerhub-ml): " SPACE_URL
fi

if [ -z "$SPACE_URL" ]; then
  echo "Error: Space repository URL is required."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/services/proctoring"
TEMP_DIR="$(mktemp -d -t hf-space-XXXXXX)"

echo ""
echo "[1/4] Cloning Space repository into temporary folder..."
git clone "$SPACE_URL" "$TEMP_DIR"

echo "[2/4] Copying files from services/proctoring..."
FILES=(
  "Dockerfile"
  "README.md"
  "requirements.txt"
  ".dockerignore"
  "server.py"
  "fusion_engine_new.py"
  "facial_inference.py"
  "voice_inference.py"
  "text_inference.py"
  "face_verifier.py"
)

for file in "${FILES[@]}"; do
  if [ -f "$SOURCE_DIR/$file" ]; then
    cp "$SOURCE_DIR/$file" "$TEMP_DIR/$file"
    echo "  -> Copied $file"
  fi
done

echo "[3/4] Committing files to git..."
cd "$TEMP_DIR"
git add .
if git diff-index --quiet HEAD --; then
  echo "No changes detected. Space is already up to date!"
else
  git commit -m "Deploy CareerHub ML Proctoring service"
  echo "[4/4] Pushing to Hugging Face Space..."
  git push
  echo ""
  echo " Successfully deployed to Hugging Face Spaces!"
fi

cd "$ROOT_DIR"
rm -rf "$TEMP_DIR"

echo ""
echo "NEXT STEPS:"
echo "1. Go to your Space on Hugging Face -> Settings -> Variables and secrets"
echo "2. Add Secret: INTERVIEW_ML_TOKEN (set to a strong password/secret)"
echo "3. In your Render / Backend .env, set:"
echo "   INTERVIEW_ML_URL=https://<your-space-name>.hf.space"
echo "   INTERVIEW_ML_TOKEN=<the-secret-you-created>"
echo "=========================================================="
