#!/usr/bin/env python3
"""Generate og-image.png for kshama-portfolio — matches the live site's palette
(see :root in styles.css) so the link-preview card looks like an extension of
the site, not a bolted-on graphic. Run: python3 scripts/gen_og_image.py
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

W, H = 1200, 630
BG = (10, 5, 16)          # --bg
BG2 = (20, 8, 30)         # --bg-2
ACCENT = (255, 61, 166)   # --accent
ACCENT2 = (255, 102, 196) # --accent-2
ACCENT3 = (192, 38, 211)  # --accent-3
FG = (245, 240, 245)      # --fg
FG_DIM = (179, 166, 189)  # --fg-dim
FG_MUTE = (117, 103, 138) # --fg-mute

MENLO = "/System/Library/Fonts/Menlo.ttc"
HELV = "/System/Library/Fonts/Helvetica.ttc"


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


def blob(canvas, cx, cy, r, color, alpha, blur):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(layer)


def main():
    img = Image.new("RGBA", (W, H), BG + (255,))

    # Diagonal base gradient bg -> bg-2.
    grad = Image.new("RGBA", (W, H))
    for y in range(H):
        t = y / H
        r = int(BG[0] + (BG2[0] - BG[0]) * t)
        g = int(BG[1] + (BG2[1] - BG[1]) * t)
        b = int(BG[2] + (BG2[2] - BG[2]) * t)
        ImageDraw.Draw(grad).line([(0, y), (W, y)], fill=(r, g, b, 255))
    img.alpha_composite(grad)

    # Soft accent blobs, echoing .blob-magenta / .blob-purple / .blob-rose.
    blob(img, W * 0.82, H * 0.18, 260, ACCENT, 70, 90)
    blob(img, W * 0.95, H * 0.75, 220, ACCENT3, 60, 100)
    blob(img, W * 0.15, H * 1.05, 240, ACCENT2, 45, 110)

    # Subtle grain.
    noise = Image.effect_noise((W, H), 14).convert("L")
    grain = Image.merge("RGBA", (noise, noise, noise, noise.point(lambda p: int(p * 0.05))))
    img.alpha_composite(grain)

    d = ImageDraw.Draw(img)
    margin = 84

    # Diamond logo (rotated square), matching the nav mark.
    cx, cy, s = margin + 16, margin - 4, 13
    diamond = Image.new("RGBA", (s * 4, s * 4), (0, 0, 0, 0))
    dd = ImageDraw.Draw(diamond)
    dd.polygon([(s * 2, 0), (s * 4, s * 2), (s * 2, s * 4), (0, s * 2)], fill=ACCENT + (255,))
    img.alpha_composite(diamond, (cx - s * 2, cy - s * 2))
    d.text((margin + 40, margin - 16), "KSHAMA BHATT", font=font(MENLO, 22), fill=FG_DIM)

    # Name — the headline.
    d.text((margin, 150), "Kshama Bhatt", font=font(HELV, 88, index=1), fill=FG)  # bold face index

    # Tagline.
    d.text(
        (margin, 256),
        "Site Reliability Engineer  ·  AI Infrastructure",
        font=font(MENLO, 30),
        fill=ACCENT2,
    )

    # Supporting line.
    d.text(
        (margin, 308),
        "MSE, Computer & Information Science — University of Pennsylvania, Fall 2026",
        font=font(HELV, 24),
        fill=FG_DIM,
    )

    # Stat pills, mirroring .proj-badges chips.
    stats = ["−30% downtime", "−40% MTTR", "2nd · IBM Bobathon 2026", "WIST Speaker"]
    pf = font(MENLO, 21)
    x = margin
    y = 388
    for s_ in stats:
        tw = d.textlength(s_, font=pf)
        pad_x, pad_y = 18, 11
        box = [x, y, x + tw + pad_x * 2, y + 21 + pad_y * 2]
        d.rounded_rectangle(box, radius=8, outline=ACCENT + (140,), width=1, fill=(20, 8, 30, 160))
        d.text((x + pad_x, y + pad_y - 2), s_, font=pf, fill=FG)
        x = box[2] + 14

    # Footer URL, bottom-right.
    url = "kshama7.github.io/kshama-portfolio"
    uf = font(MENLO, 22)
    tw = d.textlength(url, font=uf)
    d.text((W - margin - tw, H - margin - 4), url, font=uf, fill=FG_MUTE)

    out = os.path.join(os.path.dirname(__file__), "..", "og-image.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"wrote {os.path.abspath(out)}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
