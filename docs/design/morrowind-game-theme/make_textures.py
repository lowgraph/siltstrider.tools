"""Generate the Morrowind UI frame textures as SVG 9-slice sources.

Every frame follows the game's lighting rule, sampled from a TES3 screenshot: on each
edge the lighter pixels sit on the top-left side. Top and left edges list their lines
outer -> inner; bottom and right edges list theirs outer -> inner too.
A line with a spread gets fractal-noise grain (the "parchment" speckle); spread 0 is flat.
"""
import sys

N = 48  # source size in px; the slice width is the number of rings


def rgb(h):
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]


def grain_filter(fid, colour, spread, seed):
    # fractalNoise R sits around 0.35-0.65: map R=0.5 to the colour and +-0.15 to +-spread.
    rows = []
    for c in rgb(colour):
        slope = spread / 0.15
        rows.append(f"{slope:.3f} 0 0 0 {c - 0.5 * slope:.3f}")
    values = "  ".join(rows) + "  0 0 0 0 1"
    return (f'<filter id="{fid}" filterUnits="userSpaceOnUse" x="0" y="0" width="{N}" height="{N}" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{seed}" stitchTiles="stitch" result="noise"></feTurbulence>'
            f'<feColorMatrix in="noise" type="matrix" values="{values}" result="tint"></feColorMatrix>'
            f'<feComposite in="tint" in2="SourceAlpha" operator="in"></feComposite></filter>')


def ring(k, tl, br, filters, seed):
    a, b = k, N - k
    top_left = f"{a},{a} {b},{a} {b - 1},{a + 1} {a + 1},{a + 1} {a + 1},{b - 1} {a},{b}"
    bottom_right = f"{b},{a} {b},{b} {a},{b} {a + 1},{b - 1} {b - 1},{b - 1} {b - 1},{a + 1}"
    out = []
    for points, (colour, spread), side in ((top_left, tl, "tl"), (bottom_right, br, "br")):
        if spread:
            fid = f"g{k}{side}"
            filters.append(grain_filter(fid, colour, spread, seed + k * 7 + (3 if side == "br" else 0)))
            out.append(f'<polygon points="{points}" fill="#000000" filter="url(#{fid})"></polygon>')
        else:
            out.append(f'<polygon points="{points}" fill="{colour}"></polygon>')
    return out


def svg(rings, seed):
    filters, shapes = [], []
    for k, (tl, br) in enumerate(rings):
        shapes += ring(k, tl, br, filters, seed)
    defs = f"<defs>{''.join(filters)}</defs>" if filters else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{N}" height="{N}" viewBox="0 0 {N} {N}" shape-rendering="crispEdges">'
            f"{defs}{''.join(shapes)}</svg>\n")


# Window frame (6 px slice): four flat lines, then two black lines so it can replace the
# 6 px mw-border.png without changing any border width.
WINDOW = [
    (("#bea47b", 0), ("#2c2013", 0)),
    (("#9f7f45", 0), ("#7b5f33", 0)),
    (("#6e562b", 0), ("#967d49", 0)),
    (("#120b07", 0), ("#c2a470", 0)),
    (("#000000", 0), ("#000000", 0)),
    (("#000000", 0), ("#000000", 0)),
]
# Panel / groove (2 px slice): an engraved line, light above-left of dark, speckled.
PANEL = [
    (("#b2a882", 0.15), ("#46331f", 0.06)),
    (("#46331f", 0.06), ("#b2a882", 0.15)),
]
# Button / bevel (4 px slice): raised; top-left ramps light -> dark inward, bottom-right
# is three dark lines with a light line inside.
BUTTON = [
    (("#cbbf99", 0.10), ("#121009", 0.02)),
    (("#85724a", 0.08), ("#28200f", 0.03)),
    (("#6d6246", 0.07), ("#33220f", 0.03)),
    (("#1e1710", 0.03), ("#a59874", 0.09)),
]

out = sys.argv[1]
for name, rings, seed in (("mw-window.svg", WINDOW, 1), ("mw-panel-grain.svg", PANEL, 11), ("mw-button-grain.svg", BUTTON, 3)):
    with open(f"{out}/{name}", "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg(rings, seed))
    print(name, len(svg(rings, seed)), "bytes")
