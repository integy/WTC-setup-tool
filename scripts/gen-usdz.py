#!/usr/bin/env python3
"""Generate USDZ for WTC terrain + red box test.
Key fixes: high emissive for AR visibility, unlit-like appearance."""
import os, zipfile, subprocess, shutil, struct, io

BOARD_DIR = "public/layouts"
USDZ_DIR = "public/usdz"
os.makedirs(USDZ_DIR, exist_ok=True)

# Board: 60" x 44" = 152.4cm x 111.76cm → metersPerUnit = 0.01 → use cm
# So points are in cm: half-width = 76.2, half-depth = 55.88
HW, HD = 76.2, 55.88

USD_TEMPLATE = """#usda 1.0
(
    defaultPrim = "board"
    metersPerUnit = 0.01
    upAxis = "Y"
)

def Xform "board"
{{
}}

def Scope "Geom"
{{
    def Mesh "plane"
    {{
        uniform bool doubleSided = 1
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-{hw}, 0, -{hd}), ({hw}, 0, -{hd}), ({hw}, 0, {hd}), (-{hw}, 0, {hd})]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)]
        int[] primvars:st:indices = [0, 1, 2, 3]
        rel material:binding = </Looks/material>
    }}
}}

def Scope "Looks"
{{
    def Material "material"
    {{
        token outputs:surface.connect = </Looks/material/shader.outputs:surface>

        def Shader "shader"
        {{
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = {diffuse}
            color3f inputs:emissiveColor = {emissive}
            float inputs:metallic = 0
            float inputs:roughness = 1
            token outputs:surface
        }}
    }}
}}
"""

def make_usdz(usd_content, texture_path=None, texture_name="texture.jpg", output_path=None):
    tmp = f"/tmp/usdz_tmp"
    os.makedirs(tmp, exist_ok=True)
    
    with open(os.path.join(tmp, "model.usda"), "w") as f:
        f.write(usd_content)
    
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_STORED) as zf:
        zf.write(os.path.join(tmp, "model.usda"), "model.usda")
        if texture_path:
            zf.write(texture_path, texture_name)
    
    shutil.rmtree(tmp)
    return os.path.getsize(output_path)


# === Red Box Test (solid red, no texture) ===
print("=== Red Box ===")
red_usd = USD_TEMPLATE.format(
    hw=HW, hd=HD,
    diffuse="(1, 0, 0)",
    emissive="(0.9, 0.1, 0.1)",
)
sz = make_usdz(red_usd, output_path=os.path.join(USDZ_DIR, "test-red.usdz"))
print(f"  test-red.usdz: {sz} bytes")


# === Terrain Layouts (with texture) ===
print("\n=== Terrain ===")
for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'):
        continue
    base = fname.replace('.png', '')
    png_path = os.path.join(BOARD_DIR, fname)
    
    # Convert PNG → JPEG
    jpg_path = f"/tmp/usdz_{base}.jpg"
    subprocess.run([
        "sips", "-s", "format", "jpeg", "-s", "formatOptions", "85",
        png_path, "--out", jpg_path
    ], check=True, capture_output=True)
    
    terrain_usd = USD_TEMPLATE.format(
        hw=HW, hd=HD,
        diffuse="(1, 1, 1)",
        emissive="(0.7, 0.7, 0.7)",  # high emissive for AR
    )
    
    out = os.path.join(USDZ_DIR, f"{base}.usdz")
    sz = make_usdz(terrain_usd, texture_path=jpg_path, output_path=out)
    os.remove(jpg_path)
    print(f"  {base}.usdz: {sz/1024:.0f} KB")

print(f"\nDone! {len([f for f in os.listdir(USDZ_DIR) if f.endswith('.usdz')])} USDZ files")
