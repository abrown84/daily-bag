"""
Product Hunt Launch Graphic for Daily Bag
Design Philosophy: Ludic Momentum
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Canvas dimensions (Twitter optimal)
WIDTH = 1600
HEIGHT = 900

# Color palette - Ludic Momentum
DARK_BG = (15, 17, 23)  # Deep confident dark
DARK_SECONDARY = (24, 27, 38)  # Subtle layer
GOLD_ACCENT = (255, 183, 77)  # Achievement gold
ORANGE_MOMENTUM = (255, 138, 76)  # Momentum orange
WHITE = (255, 255, 255)
WHITE_MUTED = (180, 185, 195)
PH_ORANGE = (255, 111, 66)  # Product Hunt brand

# Font paths
FONT_DIR = "C:/Users/alexb/.claude/skills/canvas-design/canvas-fonts"

def create_graphic():
    # Create canvas
    img = Image.new('RGB', (WIDTH, HEIGHT), DARK_BG)
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_title = ImageFont.truetype(f"{FONT_DIR}/BigShoulders-Bold.ttf", 120)
        font_tagline = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 36)
        font_subtitle = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 48)
        font_small = ImageFont.truetype(f"{FONT_DIR}/GeistMono-Regular.ttf", 24)
        font_points = ImageFont.truetype(f"{FONT_DIR}/BigShoulders-Bold.ttf", 64)
    except Exception as e:
        print(f"Font error: {e}")
        font_title = ImageFont.load_default()
        font_tagline = font_title
        font_subtitle = font_title
        font_small = font_title
        font_points = font_title

    # === BACKGROUND ELEMENTS ===

    # Ascending chevrons (left side) - progress indicators
    chevron_x = 80
    for i in range(6):
        y_pos = 700 - (i * 100)
        opacity = 40 + (i * 25)
        color = (GOLD_ACCENT[0], GOLD_ACCENT[1], GOLD_ACCENT[2])

        # Draw chevron shape
        points = [
            (chevron_x, y_pos),
            (chevron_x + 40, y_pos - 30),
            (chevron_x + 80, y_pos),
            (chevron_x + 80, y_pos + 15),
            (chevron_x + 40, y_pos - 15),
            (chevron_x, y_pos + 15),
        ]

        # Create semi-transparent chevron
        chevron_img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
        chevron_draw = ImageDraw.Draw(chevron_img)
        chevron_draw.polygon(points, fill=(*color, opacity))
        img.paste(Image.blend(Image.new('RGB', (WIDTH, HEIGHT), DARK_BG),
                             chevron_img.convert('RGB'), opacity/255), (0, 0))

    # Draw stacked rectangles (right side) - leaderboard abstraction
    for i in range(5):
        bar_width = 180 - (i * 25)
        bar_height = 20
        x_pos = WIDTH - 200
        y_pos = 250 + (i * 45)

        # Gradient effect through color variation
        r = int(GOLD_ACCENT[0] - (i * 15))
        g = int(GOLD_ACCENT[1] - (i * 20))
        b = int(GOLD_ACCENT[2] + (i * 5))

        draw.rounded_rectangle(
            [x_pos, y_pos, x_pos + bar_width, y_pos + bar_height],
            radius=4,
            fill=(r, g, b)
        )

    # Floating achievement dots
    dots = [(200, 200), (250, 280), (180, 350), (1400, 650), (1450, 720), (1380, 780)]
    for x, y in dots:
        draw.ellipse([x-6, y-6, x+6, y+6], fill=ORANGE_MOMENTUM)

    # Progress bar element (bottom)
    progress_y = HEIGHT - 80
    progress_width = 400
    progress_x = (WIDTH - progress_width) // 2

    # Background bar
    draw.rounded_rectangle(
        [progress_x, progress_y, progress_x + progress_width, progress_y + 12],
        radius=6,
        fill=DARK_SECONDARY
    )
    # Filled progress (80%)
    draw.rounded_rectangle(
        [progress_x, progress_y, progress_x + int(progress_width * 0.8), progress_y + 12],
        radius=6,
        fill=GOLD_ACCENT
    )

    # === MAIN CONTENT ===

    # Product Hunt badge (top center)
    ph_badge_y = 60
    badge_text = "LIVE ON PRODUCT HUNT"
    bbox = draw.textbbox((0, 0), badge_text, font=font_small)
    badge_width = bbox[2] - bbox[0] + 40
    badge_x = (WIDTH - badge_width) // 2

    # Badge background
    draw.rounded_rectangle(
        [badge_x, ph_badge_y, badge_x + badge_width, ph_badge_y + 44],
        radius=22,
        fill=PH_ORANGE
    )
    draw.text(
        (badge_x + 20, ph_badge_y + 10),
        badge_text,
        font=font_small,
        fill=WHITE
    )

    # App name - DAILY BAG
    title_text = "DAILY BAG"
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_x = (WIDTH - (bbox[2] - bbox[0])) // 2
    draw.text((title_x, 200), title_text, font=font_title, fill=WHITE)

    # Tagline
    tagline = "Chores become games. Points become cash."
    bbox = draw.textbbox((0, 0), tagline, font=font_tagline)
    tagline_x = (WIDTH - (bbox[2] - bbox[0])) // 2
    draw.text((tagline_x, 340), tagline, font=font_tagline, fill=WHITE_MUTED)

    # Feature pills
    features = ["POINTS", "LEVELS", "LEADERBOARDS", "REAL REWARDS"]
    pill_y = 440
    total_width = sum([draw.textbbox((0, 0), f, font=font_small)[2] + 50 for f in features]) + (len(features) - 1) * 20
    start_x = (WIDTH - total_width) // 2

    current_x = start_x
    for feature in features:
        bbox = draw.textbbox((0, 0), feature, font=font_small)
        pill_width = bbox[2] - bbox[0] + 50

        draw.rounded_rectangle(
            [current_x, pill_y, current_x + pill_width, pill_y + 50],
            radius=25,
            outline=GOLD_ACCENT,
            width=2
        )
        draw.text(
            (current_x + 25, pill_y + 13),
            feature,
            font=font_small,
            fill=GOLD_ACCENT
        )
        current_x += pill_width + 20

    # Call to action
    cta_text = "Support us today"
    bbox = draw.textbbox((0, 0), cta_text, font=font_subtitle)
    cta_x = (WIDTH - (bbox[2] - bbox[0])) // 2
    draw.text((cta_x, 560), cta_text, font=font_subtitle, fill=WHITE)

    # Arrow pointing down
    arrow_x = WIDTH // 2
    arrow_y = 650
    draw.polygon([
        (arrow_x - 20, arrow_y),
        (arrow_x + 20, arrow_y),
        (arrow_x, arrow_y + 25)
    ], fill=GOLD_ACCENT)

    # Points display (decorative, bottom corners)
    draw.text((60, HEIGHT - 130), "+500", font=font_points, fill=(GOLD_ACCENT[0], GOLD_ACCENT[1], GOLD_ACCENT[2], 80))
    draw.text((WIDTH - 200, HEIGHT - 130), "LVL UP", font=font_small, fill=ORANGE_MOMENTUM)

    # Save
    output_path = "C:/Users/alexb/Desktop/Programming/Apps/Chore-Checklist/marketing/dailybag-producthunt-launch.png"
    img.save(output_path, "PNG", quality=95)
    print(f"Saved to: {output_path}")
    return output_path

if __name__ == "__main__":
    create_graphic()
