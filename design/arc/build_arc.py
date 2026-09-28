"""7on ARC — parametric model, built from the published dimensions.

Run with Blender 4.5 (or the `bpy` module):
    blender -b -P build_arc.py            # builds arc.blend, arc.glb and renders
    python build_arc.py --preview         # quick low-sample renders
    python build_arc.py --export-only     # arc.blend and arc.glb, no renders

Units: 1 Blender unit = 1 mm.
Angles around the rim are measured clockwise from 12 o'clock, looking at the screen.
"""

import math
import os
import sys

import bpy  # must come first: it provides bmesh and mathutils
import bmesh
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "..", "..", "public", "logo.png")
PREVIEW = "--preview" in sys.argv
EXPORT_ONLY = "--export-only" in sys.argv   # rebuild arc.blend and arc.glb without rendering

# ── Dimensions (mm) ───────────────────────────────────────────────
OUTER_D = 55.00     # widest point of the body
GLASS_D = 48.96     # cover glass, where metal meets glass
DISPLAY_D = 43.76   # active round AMOLED
THICKNESS = 15.05
SEAM_Z = 2.6        # back cover / body split line

# Body side profile (radius, height), from the seam up to the glass.
# Widest (27.5) a little above mid-height, rolling in to the glass lip.
BODY_PROFILE = [
    (26.72, 2.62), (27.02, 3.20), (27.28, 4.40), (27.44, 5.90), (27.50, 7.40),
    (27.43, 8.90), (27.18, 10.40), (26.66, 11.90), (25.90, 13.20), (25.12, 14.05),
    (24.78, 14.40), (24.62, 14.55),
]
# Back cover profile, from the flat back up to the seam
BACK_PROFILE = [
    (20.60, 0.00), (22.60, 0.14), (24.30, 0.55), (25.60, 1.20), (26.35, 1.90), (26.64, 2.45),
]

# Features on the rim: (angle°, height z, kind, size…)
FEATURES = {
    "mic_1": (328, 10.0),
    "lanyard": [(349, 8.3), (0, 8.3)],
    "pwr": (50, 9.0, 6.3, 2.9),          # pill: angle, z, length, height
    "speaker": (94, 7.8),                 # 5 holes around this angle
    "boot": (132, 7.6, 5.0, 2.5),
    "usb": (183, 7.4, 13.5, 7.0),         # silicone cover
    "mic_2": (210, 8.0),
}
BACK_DIMPLES = [(300, 21.3), (60, 21.3), (180, 21.3)]
LOGO_WIDTH = 17.0   # laser-engraved mark on the back cover


def catmull_rom(points, samples=6):
    """Smooth a polyline through its points."""
    pts = [points[0]] + points + [points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = (np.array(p) for p in pts[i - 1 : i + 3])
        for s in range(samples):
            t = s / samples
            out.append(
                0.5
                * (
                    2 * p1
                    + (-p0 + p2) * t
                    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                    + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
                )
            )
    out.append(np.array(points[-1]))
    return [tuple(p) for p in out]


BODY_SMOOTH = catmull_rom(BODY_PROFILE)


def radius_at(z):
    """Outer radius of the body at height z (for placing features)."""
    zs = [p[1] for p in BODY_SMOOTH]
    rs = [p[0] for p in BODY_SMOOTH]
    return float(np.interp(z, zs, rs))


# ── Scene ─────────────────────────────────────────────────────────
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = 24 if PREVIEW else 256
    s.cycles.use_denoising = True
    s.view_settings.view_transform = "AgX"
    s.view_settings.look = "AgX - Medium High Contrast"
    s.render.film_transparent = False
    return s


def lathe(name, profile, steps=256):
    """Revolve a closed (axis-to-axis) profile around Z into a solid."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    for a, b in zip(verts, verts[1:]):
        bm.edges.new((a, b))
    bmesh.ops.spin(
        bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1),
        angle=math.tau, steps=steps, use_duplicate=False,
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob


def rim_matrix(angle_deg, z, inset=0.0):
    """Frame on the body surface: local Z points out, local X along the rim."""
    a = math.radians(angle_deg)
    n = Vector((math.sin(a), math.cos(a), 0))
    x = Vector((-math.cos(a), math.sin(a), 0))
    y = Vector((0, 0, 1))
    r = radius_at(z) - inset
    m = Matrix((x, y, n)).transposed().to_4x4()
    m.translation = Vector((n.x * r, n.y * r, z))
    return m


def pill_mesh(name, length, height, depth, segs=16):
    """Rounded slot (two half-circles joined), extruded along +Z by depth."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rad = height / 2
    half = max(length / 2 - rad, 0)
    pts = []
    for i in range(segs + 1):
        t = -math.pi / 2 + math.pi * i / segs
        pts.append((half + rad * math.cos(t), rad * math.sin(t)))
    for i in range(segs + 1):
        t = math.pi / 2 + math.pi * i / segs
        pts.append((-half + rad * math.cos(t), rad * math.sin(t)))
    base = [bm.verts.new((x, y, -depth / 2)) for x, y in pts]
    face = bm.faces.new(base)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, depth))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def cylinder(name, r, depth, verts=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth)
    ob = bpy.context.active_object
    ob.name = name
    return ob


# ── Materials ─────────────────────────────────────────────────────
def principled(name, color, metallic=0.0, roughness=0.5, **extra):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    for key, value in extra.items():
        b.inputs[key].default_value = value
    return m


def screen_texture(path, size=2048):
    """The face: near-black glass with a glowing red orb in the middle,
    like ARC on the 7on page."""
    ys, xs = np.mgrid[0:size, 0:size]
    u = (xs + 0.5) / size * 2 - 1
    v = 1 - (ys + 0.5) / size * 2
    d = np.sqrt(u * u + v * v)
    disp = DISPLAY_D / GLASS_D                     # active area, as a fraction of the glass
    img = np.zeros((size, size, 3))
    inside = np.clip((disp - d) / 0.004, 0, 1)     # soft AMOLED edge
    glow = np.exp(-((d / (disp * 0.62)) ** 2))
    img += inside[..., None] * glow[..., None] * np.array([0.30, 0.015, 0.035])
    rr = disp * 0.36                                # orb radius
    k = np.clip(d / rr, 0, 1)
    nz = np.sqrt(np.clip(1 - k * k, 0, 1))
    nx, ny = np.where(d > 0, u / rr, 0), np.where(d > 0, v / rr, 0)
    L = np.array([-0.45, 0.55, 0.70]); L /= np.linalg.norm(L)
    lam = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    H = (L + np.array([0, 0, 1])); H /= np.linalg.norm(H)
    spec = np.clip(nx * H[0] + ny * H[1] + nz * H[2], 0, 1) ** 36
    orb = np.array([0.80, 0.07, 0.17])[None, None] * (0.30 + 0.75 * lam[..., None])
    orb += spec[..., None] * np.array([0.55, 0.30, 0.34]) * 0.6
    edge = np.clip((rr - d) / 0.006, 0, 1)[..., None]
    halo = np.exp(-(((d - rr) / (rr * 0.35)) ** 2)) * (d > rr)
    img = img * (1 - edge) + orb * edge
    img += (halo * inside)[..., None] * np.array([0.22, 0.012, 0.03])
    img = np.clip(img, 0, 1)

    im = bpy.data.images.new("arc_screen", size, size, alpha=False)
    rgba = np.concatenate([img[::-1], np.ones((size, size, 1))], axis=2)
    im.pixels.foreach_set(rgba.astype(np.float32).ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    return im


def screen_material(image):
    m = bpy.data.materials.new("Screen glass")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.004, 0.004, 0.005, 1)
    b.inputs["Roughness"].default_value = 0.03
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.02
    b.inputs["Specular IOR Level"].default_value = 0.35
    b.inputs["Emission Strength"].default_value = 1.8
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.extension = "CLIP"
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    s = 1 / GLASS_D
    mapping.inputs["Scale"].default_value = (s, s, 1)
    mapping.inputs["Location"].default_value = (0.5, 0.5, 0)
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    return m


def engraving_material():
    """Laser-engraved anodised aluminium: the dye is burnt off, leaving a
    lighter, matte mark. The logo's alpha is the cut-out."""
    m = bpy.data.materials.new("Laser engraving")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.94, 0.94, 0.95, 1)
    b.inputs["Metallic"].default_value = 0.25
    b.inputs["Roughness"].default_value = 0.72
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.abspath(LOGO))
    tex.extension = "CLIP"
    nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    return m


# ── Build ─────────────────────────────────────────────────────────
def build():
    scene = reset()
    anodised = principled("Anodised aluminium", (0.80, 0.80, 0.82), metallic=1.0, roughness=0.34)
    back_alu = principled("Back cover aluminium", (0.78, 0.78, 0.80), metallic=1.0, roughness=0.38)
    polished = principled("Polished aluminium", (0.88, 0.88, 0.90), metallic=1.0, roughness=0.12)
    hole = principled("Hole", (0.004, 0.004, 0.004), roughness=0.9)
    silicone = principled("Silicone", (0.36, 0.36, 0.37), roughness=0.62)

    root = bpy.data.objects.new("7on ARC", None)
    scene.collection.objects.link(root)

    # Body: from the seam to the glass, closed with flat caps inside
    body_prof = [(0.0, 2.72), (26.25, 2.72)] + BODY_SMOOTH + [(24.30, 14.50), (0.0, 14.50)]
    body = lathe("Body", body_prof)
    body.data.materials.append(anodised)

    # Back cover, with a hairline gap to the body at the seam
    back_prof = [(0.0, 0.0)] + catmull_rom(BACK_PROFILE) + [(26.10, 2.55), (0.0, 2.55)]
    back = lathe("Back cover", back_prof)
    back.data.materials.append(back_alu)

    # Cover glass with a softened 2.5D edge
    glass = cylinder("Glass", GLASS_D / 2, 0.9, verts=256)   # from z 14.15 to the full 15.05
    glass.location.z = THICKNESS - 0.45
    bev = glass.modifiers.new("Edge", "BEVEL")
    bev.width, bev.segments, bev.limit_method = 0.35, 6, "ANGLE"
    for p in glass.data.polygons:
        p.use_smooth = True
    img = screen_texture(os.path.join(HERE, "arc_screen.png"))
    glass.data.materials.append(screen_material(img))

    # Cutters for holes and slots (collected, subtracted from the body)
    cutters = bpy.data.collections.new("Cutters")
    scene.collection.children.link(cutters)
    cutters.hide_render = True
    cutters.hide_viewport = True
    inserts = []
    helpers = bpy.data.collections.new("Helpers")
    scene.collection.children.link(helpers)
    helpers.hide_render = True
    helpers.hide_viewport = True

    def cut(ob):
        for c in ob.users_collection:
            c.objects.unlink(ob)
        cutters.objects.link(ob)

    def round_hole(angle, z, dia, name):
        c = cylinder(f"cut {name}", dia / 2, 4.0, verts=32)
        c.matrix_world = rim_matrix(angle, z)
        cut(c)
        plug = cylinder(f"{name} (dark)", dia / 2 * 0.98, 1.2, verts=32)
        plug.matrix_world = rim_matrix(angle, z, inset=1.3)
        plug.data.materials.append(hole)
        inserts.append(plug)

    grown = {}

    def grown_body(proud):
        """The body's outer surface pushed out by `proud` — caps are clipped to
        it, so they follow the curve of the rim instead of sticking out flat."""
        if proud not in grown:
            prof = [(0.0, 2.0)] + [(r + proud, z) for r, z in BODY_SMOOTH] + [(0.0, 15.0)]
            g = lathe(f"rim +{proud}", prof)
            for c in g.users_collection:
                c.objects.unlink(g)
            helpers.objects.link(g)
            grown[proud] = g
        return grown[proud]

    def slot(angle, z, length, height, name, fill, proud):
        c = pill_mesh(f"cut {name}", length + 0.5, height + 0.5, 4.0)
        c.matrix_world = rim_matrix(angle, z)
        cut(c)
        backing = pill_mesh(f"{name} recess", length + 0.45, height + 0.45, 0.6)
        backing.matrix_world = rim_matrix(angle, z, inset=1.4)
        backing.data.materials.append(hole)
        cap = pill_mesh(name, length, height, 3.0)
        cap.matrix_world = rim_matrix(angle, z, inset=1.0)
        clip = cap.modifiers.new("Follow rim", "BOOLEAN")
        clip.operation, clip.object, clip.solver = "INTERSECT", grown_body(proud), "EXACT"
        b = cap.modifiers.new("Soft edge", "BEVEL")
        b.width, b.segments, b.limit_method = min(0.35, height / 5), 4, "ANGLE"
        cap.data.materials.append(fill)
        for p in cap.data.polygons:
            p.use_smooth = True
        inserts.extend([backing, cap])

    f = FEATURES
    round_hole(*f["mic_1"], 1.2, "Microphone 1")
    round_hole(*f["mic_2"], 1.2, "Microphone 2")
    for i, (a, z) in enumerate(f["lanyard"]):
        round_hole(a, z, 1.7, f"Lanyard hole {i + 1}")
    sa, sz = f["speaker"]
    for i in range(5):
        round_hole(sa - 4.8 + i * 2.4, sz, 0.8, f"Speaker hole {i + 1}")
    slot(*f["pwr"], "PWR button", polished, proud=0.35)
    slot(*f["boot"], "BOOT button", polished, proud=0.30)
    slot(*f["usb"], "USB-C cover", silicone, proud=0.05)

    for c in cutters.objects:
        m = body.modifiers.new(c.name, "BOOLEAN")
        m.operation, m.object, m.solver = "DIFFERENCE", c, "EXACT"

    # Three small dimples on the back cover
    dimples = bpy.data.collections.new("Back cutters")
    scene.collection.children.link(dimples)
    dimples.hide_render = True
    dimples.hide_viewport = True
    for a, r in BACK_DIMPLES:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(math.sin(math.radians(a)) * r, math.cos(math.radians(a)) * r, 0.0))
        s = bpy.context.active_object
        s.name = "cut dimple"
        for c in s.users_collection:
            c.objects.unlink(s)
        dimples.objects.link(s)
    bb = back.modifiers.new("Dimples", "BOOLEAN")
    bb.operation, bb.operand_type, bb.collection, bb.solver = "DIFFERENCE", "COLLECTION", dimples, "EXACT"

    # Laser-engraved logo on the back, read the right way round from behind
    bpy.ops.mesh.primitive_plane_add(size=1)
    logo = bpy.context.active_object
    logo.name = "Engraved logo"
    logo.scale = (LOGO_WIDTH, LOGO_WIDTH, 1)
    logo.rotation_euler = (0, math.pi, 0)          # face the back, upright when turned over sideways
    logo.location.z = -0.012
    logo.data.materials.append(engraving_material())

    # Everything, cutters included, moves with the device — otherwise the
    # holes would stay put in space while the body turns
    helper_objs = [*cutters.objects, *helpers.objects, *dimples.objects]
    for ob in [body, back, glass, logo, *inserts, *helper_objs]:
        ob.parent = root
    for ob in (body, back):
        with bpy.context.temp_override(object=ob, selected_editable_objects=[ob], active_object=ob):
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    return scene, root


# ── Studio ────────────────────────────────────────────────────────
def studio(scene):
    """Product-shot lighting: a studio gradient for the metal to reflect
    (dark below, bright above), soft boxes for highlights, transparent film
    so renders drop straight onto the page."""
    scene.render.film_transparent = True
    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    r = ramp.color_ramp
    r.elements[0].position, r.elements[0].color = 0.25, (0.17, 0.17, 0.175, 1)
    r.elements[1].position, r.elements[1].color = 0.95, (0.95, 0.95, 0.96, 1)
    mid = r.elements.new(0.52)
    mid.color = (0.26, 0.26, 0.27, 1)
    maprange = nt.nodes.new("ShaderNodeMapRange")
    maprange.inputs["From Min"].default_value = -1
    maprange.inputs["From Max"].default_value = 1
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], maprange.inputs["Value"])
    nt.links.new(maprange.outputs["Result"], ramp.inputs["Fac"])
    bg = nt.nodes["Background"]
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.9

    def area(name, loc, size, power, shape="RECTANGLE", size_y=None):
        d = bpy.data.lights.new(name, "AREA")
        d.shape, d.size, d.energy = shape, size, power
        if size_y:
            d.size_y = size_y
        o = bpy.data.objects.new(name, d)
        scene.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o

    area("Key", (-150, -120, 200), 160, 3.0e5)
    area("Strip", (230, 50, 45), 20, 0.7e5, size_y=240)    # the long highlight on the rim
    area("Rim", (40, 220, 120), 140, 2.0e5)
    area("Fill", (0, -260, -40), 220, 0.6e5)
    area("Bounce", (0, -60, -240), 300, 0.9e5)


def flatten(path, color=(0xFA, 0xF8, 0xF6)):
    """A copy of a transparent render placed on the page colour."""
    im = bpy.data.images.load(path)
    w, h = im.size
    px = np.array(im.pixels[:]).reshape(h, w, 4)
    bg = np.array(color) / 255.0
    bg_lin = np.where(bg <= 0.04045, bg / 12.92, ((bg + 0.055) / 1.055) ** 2.4)
    rgb = px[..., :3] * px[..., 3:4] + bg_lin * (1 - px[..., 3:4])
    out = bpy.data.images.new(os.path.basename(path) + "-flat", w, h, alpha=False)
    out.pixels.foreach_set(np.concatenate([rgb, np.ones((h, w, 1))], axis=2).astype(np.float32).ravel())
    out.filepath_raw = path.replace(".png", "-on-light.png")
    out.file_format = "PNG"
    out.save()


def camera(scene, name, loc, target=(0, 0, 7.5), lens=85):
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens
    cam_data.clip_start, cam_data.clip_end = 1, 5000
    cam = bpy.data.objects.new(name, cam_data)
    scene.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return cam


def render(scene, cam, path, w=1600, h=1000):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = (w // 2, h // 2) if PREVIEW else (w, h)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    scene, root = build()
    studio(scene)
    out = os.path.join(HERE, "renders")
    os.makedirs(out, exist_ok=True)

    views = {
        # Hero: floating, screen turned to the right, as on the page
        "hero": dict(rot=(math.radians(64), math.radians(-10), math.radians(38)), cam=(0, -210, 62), target=(2, -4, 3), lens=62),
        "hero-left": dict(rot=(math.radians(64), math.radians(10), math.radians(-38)), cam=(0, -210, 62), target=(-2, -4, 3), lens=62),
        "front": dict(rot=(0, 0, 0), cam=(0, 0, 280), target=(0, 0, 7.5)),
        "back": dict(rot=(0, math.pi, 0), cam=(0, 0, 280), target=(0, 0, -7.5)),
        # Rim views: the named feature turned to face the camera
        "side-pwr": dict(rot=(0, 0, math.radians(FEATURES["pwr"][0] - 180)), cam=(0, -280, 7.5), target=(0, 0, 7.5)),
        "detail-pwr": dict(rot=(0, 0, math.radians(FEATURES["pwr"][0] - 180)), cam=(0, -120, 9), target=(0, 0, 8)),
        "side-usb": dict(rot=(0, 0, math.radians(FEATURES["usb"][0] - 180)), cam=(0, -280, 7.5), target=(0, 0, 7.5)),
    }
    for name, v in views.items():
        root.rotation_euler = v["rot"]
        root.location = (0, 0, 0)
        cam = camera(scene, f"Cam {name}", v["cam"], v["target"], lens=v.get("lens", 85))
        if EXPORT_ONLY:
            continue
        path = os.path.join(out, f"arc-{name}.png")
        render(scene, cam, path)
        flatten(path)

    root.rotation_euler = (0, 0, 0)
    if not PREVIEW:
        export(root)


def export(root):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "arc.blend"))
    # glTF is in metres and the model in millimetres: scale on the way out,
    # and leave out the hidden cutters and helpers
    root.scale = (0.001, 0.001, 0.001)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root, *root.children_recursive]:
        if ob.visible_get():
            ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(HERE, "arc.glb"), use_selection=True, export_apply=True,
    )
    root.scale = (1, 1, 1)


if __name__ == "__main__":
    main()
