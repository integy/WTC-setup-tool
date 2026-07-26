#!/usr/bin/env python3
"""Generate USDZ files for WTC terrain layouts — minimal working version."""

import os
import zipfile
import subprocess
import shutil

BOARD_DIR = "public/layouts"
USDZ_DIR = "public/usdz"

# Minimal USD — everything at root level, no Xform wrapper
USD_TEMPLATE = """#usda 1.0
(
    defaultPrim = "board"
    metersPerUnit = 0.01
    upAxis = "Y"
)

def Mesh "board"
{
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    normal3f[] normals = [(0, 1, 0), (0, 1, 0), (0, 1, 0), (0, 1, 0)] (
        interpolation = "vertex"
    )
    point3f[] points = [(-76.2, 0, -55.88), (76.2, 0, -55.88), (76.2, 0, 55.88), (-76.2, 0, 55.88)]
    texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (
        interpolation = "vertex"
    )
    int[] primvars:st:indices = [0, 1, 2, 3]

    rel material:binding = </material>
}

def Material "material"
{
    token outputs:surface.connect = </material/shader.outputs:surface>

    def Shader "shader"
    {
        uniform token info:id = "UsdPreviewSurface"
        color3f inputs:diffuseColor.connect = </material/diffuseTex.outputs:rgb>
        float inputs:opacity = 0.9
        token outputs:surface
    }

    def Shader "diffuseTex"
    {
        uniform token info:id = "UsdUVTexture"
        asset inputs:file = @texture.jpg@
        token inputs:wrapS = "clamp"
        token inputs:wrapT = "clamp"
        token outputs:rgb
    }
}
"""

os.makedirs(USDZ_DIR, exist_ok=True)

for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'):
        continue

    base = fname.replace('.png', '')
    png_path = os.path.join(BOARD_DIR, fname)
    usdz_path = os.path.join(USDZ_DIR, f"{base}.usdz")

    tmp = f"/tmp/usdz_{base}"
    os.makedirs(tmp, exist_ok=True)

    # Convert PNG to JPG (smaller, works better with USDZ)
    jpg_path = os.path.join(tmp, "texture.jpg")
    subprocess.run([
        "sips", "-s", "format", "jpeg", "-s", "formatOptions", "85",
        png_path, "--out", jpg_path
    ], check=True, capture_output=True)

    # Write USD file
    with open(os.path.join(tmp, "model.usda"), "w") as f:
        f.write(USD_TEMPLATE)

    # Create USDZ (zip with no compression)
    with zipfile.ZipFile(usdz_path, "w", zipfile.ZIP_STORED) as zf:
        zf.write(os.path.join(tmp, "model.usda"), "model.usda")
        zf.write(jpg_path, "texture.jpg")

    shutil.rmtree(tmp)

    size = os.path.getsize(usdz_path)
    print(f"OK: {base}.usdz ({size/1024:.0f} KB)")

print(f"\nDone! {len(os.listdir(USDZ_DIR))} USDZ files in {USDZ_DIR}")
