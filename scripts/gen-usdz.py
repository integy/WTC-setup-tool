#!/usr/bin/env python3
"""Generate USDZ using Pixar USD Python API."""
import os, subprocess, zipfile
from pxr import Usd, UsdGeom, UsdShade, Sdf, Gf

USDZ_DIR = "/Users/eric/projects/wtc-setup-tools/public/usdz"
BOARD_DIR = "/Users/eric/projects/wtc-setup-tools/public/layouts"
os.makedirs(USDZ_DIR, exist_ok=True)
HW, HD = 76.2, 55.88

def make_red_cube(path):
    stage = Usd.Stage.CreateNew(path + ".usda")
    UsdGeom.SetStageMetersPerUnit(stage, 0.01)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    cube = UsdGeom.Cube.Define(stage, "/box")
    cube.CreateSizeAttr(20)
    cube.CreateDisplayColorAttr([(1.0, 0.0, 0.0)])
    stage.GetRootLayer().Save()
    _zip_usdz(path)
    return os.path.getsize(path)

def make_terrain(path, tex_path):
    stage = Usd.Stage.CreateNew(path + ".usda")
    UsdGeom.SetStageMetersPerUnit(stage, 0.01)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    
    # Mesh
    mesh = UsdGeom.Mesh.Define(stage, "/board/plane")
    mesh.CreateFaceVertexCountsAttr([4])
    mesh.CreateFaceVertexIndicesAttr([0, 1, 2, 3])
    mesh.CreatePointsAttr([(-HW, 0, -HD), (HW, 0, -HD), (HW, 0, HD), (-HW, 0, HD)])
    mesh.CreateDoubleSidedAttr(True)
    
    # UVs
    pv = UsdGeom.PrimvarsAPI(mesh)
    st = pv.CreatePrimvar("st", Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.faceVarying)
    st.Set([(0, 0), (1, 0), (1, 1), (0, 1)])
    
    # Material
    mat = UsdShade.Material.Define(stage, "/Looks/mat")
    
    # UsdPreviewSurface shader
    surf = UsdShade.Shader.Define(stage, "/Looks/mat/surface")
    surf.CreateIdAttr("UsdPreviewSurface")
    surf.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(0.0)
    surf.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(1.0)
    
    # UV reader
    uv = UsdShade.Shader.Define(stage, "/Looks/mat/st_reader")
    uv.CreateIdAttr("UsdPrimvarReader_float2")
    uv.CreateInput("varname", Sdf.ValueTypeNames.Token).Set("st")
    
    # Texture
    tex = UsdShade.Shader.Define(stage, "/Looks/mat/texture")
    tex.CreateIdAttr("UsdUVTexture")
    tex.CreateInput("file", Sdf.ValueTypeNames.Asset).Set("@texture.jpg@")
    tex.CreateInput("st", Sdf.ValueTypeNames.Float2).ConnectToSource(uv.ConnectableAPI(), "result")
    
    # Connect texture → surface diffuseColor
    surf.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).ConnectToSource(tex.ConnectableAPI(), "rgb")
    
    # Finalize material
    mat.CreateSurfaceOutput().ConnectToSource(surf.ConnectableAPI(), "surface")
    UsdShade.MaterialBindingAPI(mesh.GetPrim()).Bind(mat)
    
    stage.GetRootLayer().Save()
    _zip_usdz(path, tex_path)
    return os.path.getsize(path)

def _zip_usdz(path, tex_path=None):
    usda = path + ".usda"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_STORED) as zf:
        zf.write(usda, "model.usda")
        if tex_path:
            zf.write(tex_path, "texture.jpg")
    os.remove(usda)

# Generate
print("=== Red Cube ===")
sz = make_red_cube(f"{USDZ_DIR}/test-red.usdz")
print(f"  test-red.usdz: {sz} bytes")

print("\n=== Terrain ===")
for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'): continue
    base = fname.replace('.png', '')
    jpg = f"/tmp/usdapi_{base}.jpg"
    subprocess.run(["sips","-s","format","jpeg","-s","formatOptions","85",
        f"{BOARD_DIR}/{fname}","--out",jpg], check=True, capture_output=True)
    sz = make_terrain(f"{USDZ_DIR}/{base}.usdz", jpg)
    os.remove(jpg)
    print(f"  {base}.usdz: {sz/1024:.0f} KB")

print("\nDone!")
