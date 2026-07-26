#!/usr/bin/env python3
"""Generate USDZ files for each WTC terrain layout.
Each USDZ is a flat textured plane (60" x 44") viewable in AR Quick Look."""

import os
import zipfile
import shutil

BOARD_DIR = "public/layouts"
USDZ_DIR = "public/usdz"

# USD template for a textured plane at 60" x 44" (1.524m x 1.1176m)
# Centered at origin, laying flat on XZ plane
USD_TEMPLATE = """#usda 1.0
(
    defaultPrim = "board"
    metersPerUnit = 1.0
    upAxis = "Y"
)

def Xform "board"
{
    def Mesh "plane"
    {
        float3[] extent = [(-0.762, 0, -0.5588), (0.762, 0, 0.5588)]
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        normal3f[] normals = [(0, 1, 0), (0, 1, 0), (0, 1, 0), (0, 1, 0)] (
            interpolation = "vertex"
        )
        point3f[] points = [(-0.762, 0, -0.5588), (0.762, 0, -0.5588), (0.762, 0, 0.5588), (-0.762, 0, 0.5588)]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (
            interpolation = "vertex"
        )
        int[] primvars:st:indices = [0, 1, 2, 3]

        rel material:binding = </board/material>
    }

    def Material "material"
    {
        token outputs:surface.connect = </board/material/surfaceShader.outputs:surface>

        def Shader "surfaceShader"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor.connect = </board/material/textureShader.outputs:rgb>
            token outputs:surface
        }

        def Shader "textureShader"
        {
            uniform token info:id = "UsdUVTexture"
            asset inputs:file = @texture.png@
            token inputs:wrapS = "clamp"
            token inputs:wrapT = "clamp"
            token outputs:rgb
        }
    }
}
"""

os.makedirs(USDZ_DIR, exist_ok=True)

# Find all layout images
for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'):
        continue

    base = fname.replace('.png', '')
    usdz_path = os.path.join(USDZ_DIR, f"{base}.usdz")

    # Check if already generated and up to date
    png_path = os.path.join(BOARD_DIR, fname)
    if os.path.exists(usdz_path) and os.path.getmtime(usdz_path) > os.path.getmtime(png_path):
        print(f"SKIP (up to date): {base}.usdz")
        continue

    # Create temp directory
    tmp = f"/tmp/usdz_{base}"
    os.makedirs(tmp, exist_ok=True)

    # Write USD file
    with open(os.path.join(tmp, "model.usda"), "w") as f:
        f.write(USD_TEMPLATE)

    # Copy texture as "texture.png"
    shutil.copy2(png_path, os.path.join(tmp, "texture.png"))

    # Create USDZ (zip) - must use no compression for AR Quick Look compatibility
    with zipfile.ZipFile(usdz_path, "w", zipfile.ZIP_STORED) as zf:
        zf.write(os.path.join(tmp, "model.usda"), "model.usda")
        zf.write(os.path.join(tmp, "texture.png"), "texture.png")

    # Cleanup
    shutil.rmtree(tmp)

    size = os.path.getsize(usdz_path)
    print(f"OK: {base}.usdz ({size/1024:.0f} KB)")

print("\nDone! USDZ files in", USDZ_DIR)
