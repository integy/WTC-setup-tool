#!/usr/bin/env python3
"""Generate GLB (binary glTF) files for each WTC terrain layout.
GLB can be loaded by model-viewer which handles AR on iOS."""

import json, struct, os, shutil, subprocess
from pathlib import Path

BOARD_DIR = "public/layouts"
GLB_DIR = "public/glb"
TMP = "/tmp/glb_gen"

os.makedirs(GLB_DIR, exist_ok=True)

# Board in meters: 60" x 44" = 1.524m x 1.1176m
HW = 1.524 / 2  # 0.762
HD = 1.1176 / 2  # 0.5588


def make_glb(image_bytes: bytes, mime: str, img_w: int, img_h: int) -> bytes:
    """Create a minimal GLB: textured quad on the XZ plane."""
    
    vertices = [
        # pos (x,y,z)          uv (u,v)
        -HW, 0.01, -HD,         0, 0,
         HW, 0.01, -HD,         1, 0,
         HW, 0.01,  HD,         1, 1,
        -HW, 0.01,  HD,         0, 1,
    ]
    indices = [0, 1, 2, 0, 2, 3]

    # Pad image to 4-byte alignment
    img_padded = image_bytes
    while len(img_padded) % 4 != 0:
        img_padded += b'\x00'

    # --- Build GLB binary ---
    
    # Buffer: vertices (4*5*4=80) + indices (6*2=12) = 92 -> pad to 96
    verts_bytes = struct.pack('<20f', *vertices)
    idxs_bytes = struct.pack('<6H', *indices)
    buffer_data = verts_bytes + idxs_bytes
    # Pad to 4
    while len(buffer_data) % 4 != 0:
        buffer_data += b'\x00'

    # GLB header
    def pad(s):
        while len(s) % 4 != 0:
            s += b' '
        return s

    # Build JSON chunk
    gltf = {
        "asset": {"version": "2.0", "generator": "wtc-setup-tools"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "rotation": [-0.7071, 0, 0, 0.7071]}],  # rotate -90° around X to lay flat
        "meshes": [{
            "primitives": [{
                "attributes": {
                    "POSITION": 0,
                    "TEXCOORD_0": 1
                },
                "indices": 2,
                "material": 0
            }]
        }],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": 4, "type": "VEC3", "max": [HW, 0.01, HD], "min": [-HW, 0.01, -HD]},
            {"bufferView": 1, "componentType": 5126, "count": 4, "type": "VEC2"},
            {"bufferView": 2, "componentType": 5123, "count": 6, "type": "SCALAR"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 80, "target": 34962},
            {"buffer": 0, "byteOffset": 80, "byteLength": 32, "target": 34962},
            {"buffer": 0, "byteOffset": 112, "byteLength": 12, "target": 34963},
        ],
        "buffers": [{"byteLength": len(buffer_data)}],
        "images": [{"bufferView": 3, "mimeType": mime}],
        "textures": [{"source": 0}],
        "materials": [{
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0,
                "roughnessFactor": 1
            },
            "doubleSided": True,
            "alphaMode": "OPAQUE"
        }],
        "bufferViews|image": {"buffer": 0, "byteOffset": len(buffer_data), "byteLength": len(img_padded)},
    }

    # Move image bufferView to main list
    img_bv = gltf.pop("bufferViews|image")
    gltf["bufferViews"].append(img_bv)

    json_str = json.dumps(gltf)
    json_bytes = pad(json_str.encode())

    # Assemble GLB
    total = 12 + 8 + len(json_bytes) + 8 + len(buffer_data) + 8 + len(img_padded)
    glb = b''
    glb += struct.pack('<I', 0x46546C67)  # magic
    glb += struct.pack('<I', 2)  # version
    glb += struct.pack('<I', total)  # total length

    # JSON chunk
    glb += struct.pack('<I', len(json_bytes))
    glb += b'JSON'
    glb += json_bytes

    # BIN chunk
    bin_data = buffer_data + img_padded
    glb += struct.pack('<I', len(bin_data))
    glb += b'BIN\x00'
    glb += bin_data

    return glb


for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'):
        continue

    base = fname.replace('.png', '')
    png_path = os.path.join(BOARD_DIR, fname)
    glb_path = os.path.join(GLB_DIR, f"{base}.glb")

    # Convert PNG to JPEG for smaller GLB
    os.makedirs(TMP, exist_ok=True)
    jpg_path = os.path.join(TMP, "texture.jpg")
    subprocess.run([
        "sips", "-s", "format", "jpeg", "-s", "formatOptions", "80",
        png_path, "--out", jpg_path
    ], check=True, capture_output=True)

    with open(jpg_path, 'rb') as f:
        jpg_bytes = f.read()

    # Quick size detection
    subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", jpg_path],
                   capture_output=True)

    glb = make_glb(jpg_bytes, "image/jpeg", 1653, 2833)
    with open(glb_path, 'wb') as f:
        f.write(glb)

    shutil.rmtree(TMP)
    print(f"OK: {base}.glb ({len(glb)/1024:.0f} KB)")

print(f"\nDone! {len(os.listdir(GLB_DIR))} GLB files")
