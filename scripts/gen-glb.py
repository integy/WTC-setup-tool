#!/usr/bin/env python3
"""Generate GLB files: red box test + terrain layouts"""
import struct, json, os, sys
from PIL import Image
from io import BytesIO

GLB_DIR = '/Users/eric/projects/wtc-setup-tools/public/glb'
BOARD_DIR = '/Users/eric/projects/wtc-setup-tools/public/layouts'
os.makedirs(GLB_DIR, exist_ok=True)

# Board: 60" x 44" = 1.524m x 1.1176m
HW, HD = 1.524/2, 1.1176/2

def create_glb(texture_bytes, mime, glb_path):
    pad = (4 - len(texture_bytes) % 4) % 4
    tex_padded = texture_bytes + b'\x00' * pad
    
    verts = struct.pack('<20f',
        -HW, 0.05, -HD, 0.0, 0.0,
         HW, 0.05, -HD, 1.0, 0.0,
         HW, 0.05,  HD, 1.0, 1.0,
        -HW, 0.05,  HD, 0.0, 1.0,
    )
    idx = struct.pack('<6H', 0, 1, 2, 0, 2, 3)
    bin_data = verts + idx + tex_padded
    
    gltf = {
        "asset": {"version": "2.0", "generator": "wtc-setup-v2"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "TEXCOORD_0": 1}, "indices": 2, "material": 0}]}],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": 4, "type": "VEC3", "max": [HW, 0.05, HD], "min": [-HW, 0.05, -HD]},
            {"bufferView": 1, "componentType": 5126, "count": 4, "type": "VEC2"},
            {"bufferView": 2, "componentType": 5123, "count": 6, "type": "SCALAR"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 80, "target": 34962},
            {"buffer": 0, "byteOffset": 80, "byteLength": 32, "target": 34962},
            {"buffer": 0, "byteOffset": 112, "byteLength": 12, "target": 34963},
            {"buffer": 0, "byteOffset": 124, "byteLength": len(tex_padded)},
        ],
        "buffers": [{"byteLength": 124 + len(tex_padded)}],
        "images": [{"bufferView": 3, "mimeType": mime}],
        "textures": [{"source": 0, "sampler": 0}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "materials": [{
            "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0, "roughnessFactor": 1.0},
            "emissiveFactor": [0.6, 0.6, 0.6],
            "doubleSided": True,
            "alphaMode": "OPAQUE",
            "extensions": {"KHR_materials_unlit": {}},
        }],
        "extensionsUsed": ["KHR_materials_unlit"],
    }
    
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode()
    json_pad = (4 - len(json_bytes) % 4) % 4
    json_chunk = json_bytes + b' ' * json_pad
    
    total_len = 12 + 8 + len(json_chunk) + 8 + len(bin_data)
    header = struct.pack('<III', 0x46546C67, 2, total_len)
    j_hdr = struct.pack('<II', len(json_chunk), 0x4E4F534A)
    b_hdr = struct.pack('<II', len(bin_data), 0x004E4942)
    
    with open(glb_path, 'wb') as f:
        f.write(header + j_hdr + json_chunk + b_hdr + bin_data)
    return total_len

# Red box test
print("=== Red Box ===")
red = Image.new('RGB', (512, 512), (200, 0, 0))
for x in range(512):
    for y in range(512):
        if x < 8 or x > 503 or y < 8 or y > 503:
            red.putpixel((x, y), (255, 255, 255))
buf = BytesIO()
red.save(buf, format='JPEG', quality=85)
sz = create_glb(buf.getvalue(), 'image/jpeg', os.path.join(GLB_DIR, '_test_red_box.glb'))
print(f"OK: {sz/1024:.0f} KB")

# Terrain layouts
print("\n=== Terrain ===")
count = 0
for fname in sorted(os.listdir(BOARD_DIR)):
    if not fname.endswith('.png'): continue
    base = fname.replace('.png', '')
    img = Image.open(os.path.join(BOARD_DIR, fname)).convert('RGB')
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=85)
    sz = create_glb(buf.getvalue(), 'image/jpeg', os.path.join(GLB_DIR, f'{base}.glb'))
    count += 1
    print(f"  {base}: {sz/1024:.0f} KB")

print(f"\nDone: {count} terrain + 1 test GLB")
