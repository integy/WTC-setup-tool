#!/usr/bin/env python3
"""Generate USDZ for WTC terrain — double-sided, self-illuminated plane."""

import os, zipfile, subprocess, shutil

BOARD_DIR = "public/layouts"
USDZ_DIR = "public/usdz"

# Double-sided, self-illuminated plane at 60" x 44" (= 152.4cm x 111.76cm)
USD = """#usda 1.0
(
    defaultPrim = "board"
    metersPerUnit = 0.01
    upAxis = "Y"
)

def Xform "board" (
    prepend references = @./texture.jpg@
)
{
}

def Scope "Geom"
{
    def Mesh "plane"
    {
        uniform bool doubleSided = 1
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-76.2, 0, -55.88), (76.2, 0, -55.88), (76.2, 0, 55.88), (-76.2, 0, 55.88)]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)]
        int[] primvars:st:indices = [0, 1, 2, 3]
        rel material:binding = </Looks/material>
    }
}

def Scope "Looks"
{
    def Material "material"
    {
        token outputs:surface.connect = </Looks/material/shader.outputs:surface>

        def Shader "shader"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (1, 1, 1)
            color3f inputs:emissiveColor = (0.3, 0.3, 0.3)
            float inputs:metallic = 0
            float inputs:roughness = 1
            float inputs:opacity = 0.95
            token outputs:surface
        }
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

    # Convert PNG to JPG
    jpg_path = os.path.join(tmp, "texture.jpg")
    subprocess.run([
        "sips", "-s", "format", "jpeg", "-s", "formatOptions", "85",
        png_path, "--out", jpg_path
    ], check=True, capture_output=True)

    # Write USD
    with open(os.path.join(tmp, "model.usda"), "w") as f:
        f.write(USD)

    # Create USDZ
    with zipfile.ZipFile(usdz_path, "w", zipfile.ZIP_STORED) as zf:
        zf.write(os.path.join(tmp, "model.usda"), "model.usda")
        zf.write(jpg_path, "texture.jpg")

    shutil.rmtree(tmp)
    print(f"OK: {base}.usdz ({os.path.getsize(usdz_path)/1024:.0f} KB)")

print(f"\nDone! {len(os.listdir(USDZ_DIR))} USDZ files")
