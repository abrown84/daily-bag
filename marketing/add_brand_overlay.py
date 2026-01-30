"""
Add brand-consistent overlays to Daily Bag marketing images.
Brand colors: Amber #F59E0B, Deep Orange #EA580C, Dark Navy #141B2D
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import os

# Paths
SCRIPT_DIR = Path(__file__).parent
BRAND_ASSETS = SCRIPT_DIR.parent / "src" / "brand_assets"
FONTS_DIR = Path(r"C:\Users\alexb\.claude\skills\canvas-design\canvas-fonts")

# Brand colors
AMBER = (245, 158, 11)  # #F59E0B
DEEP_ORANGE = (234, 88, 12)  # #EA580C
DARK_NAVY = (20, 27, 45)  # #141B2D
WHITE = (255, 255, 255)

def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    """Load font from canvas-fonts directory."""
    font_paths = [
        FONTS_DIR / name,
        FONTS_DIR / f"{name}.ttf",
        FONTS_DIR / f"{name}.otf",
    ]
    for path in font_paths:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    # Fallback to Arial
    try:
        return ImageFont.truetype("arial.ttf", size)
    except:
        return ImageFont.load_default()

def add_gradient_bar(img: Image.Image, height: int = 120, opacity: float = 0.85) -> Image.Image:
    """Add semi-transparent gradient bar at bottom."""
    result = img.copy().convert("RGBA")
    width, img_height = result.size

    # Create gradient overlay
    gradient = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(gradient)

    for y in range(height):
        # Gradient from transparent to dark navy
        alpha = int((y / height) * 255 * opacity)
        draw.line([(0, y), (width, y)], fill=(*DARK_NAVY, alpha))

    # Paste gradient at bottom
    result.paste(gradient, (0, img_height - height), gradient)
    return result

def add_text_with_shadow(draw: ImageDraw.Draw, pos: tuple, text: str,
                         font: ImageFont.FreeTypeFont, fill: tuple,
                         shadow_offset: int = 3, shadow_color: tuple = (0, 0, 0, 180)):
    """Draw text with drop shadow."""
    x, y = pos
    # Shadow
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    # Main text
    draw.text(pos, text, font=font, fill=fill)

def create_leaderboard_overlay(input_path: str, output_path: str):
    """Create branded leaderboard marketing image."""
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Add gradient bar at bottom
    img = add_gradient_bar(img, height=140, opacity=0.9)

    draw = ImageDraw.Draw(img)

    # Load fonts
    title_font = load_font("BigShoulders-Bold", 56)
    subtitle_font = load_font("Outfit-Regular", 26)

    # Main headline
    headline = "COMPETE WITH YOUR FAMILY"
    # Get text bbox for centering
    bbox = draw.textbbox((0, 0), headline, font=title_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 110

    add_text_with_shadow(draw, (x, y), headline, title_font, WHITE)

    # Subtitle with amber accent
    subtitle = "Household leaderboards  •  Real rewards"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 50

    add_text_with_shadow(draw, (x, y), subtitle, subtitle_font, AMBER, shadow_offset=2)

    # Add logo in top-left corner
    logo_path = SCRIPT_DIR.parent / "src" / "assets" / "daily-bag-icon-transparent.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        # Resize to fit nicely
        logo = logo.resize((72, 72), Image.Resampling.LANCZOS)
        # Paste directly - transparent background works well
        img.paste(logo, (16, 12), logo)

    # Save
    img = img.convert("RGB")
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")

def create_achievement_overlay(input_path: str, output_path: str):
    """Create branded achievement marketing image."""
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    img = add_gradient_bar(img, height=140, opacity=0.9)
    draw = ImageDraw.Draw(img)

    title_font = load_font("BigShoulders-Bold", 56)
    subtitle_font = load_font("Outfit-Regular", 26)

    headline = "LEVEL UP YOUR LIFE"
    bbox = draw.textbbox((0, 0), headline, font=title_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 110

    add_text_with_shadow(draw, (x, y), headline, title_font, WHITE)

    subtitle = "Earn XP  •  Unlock achievements  •  Celebrate wins"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 50

    add_text_with_shadow(draw, (x, y), subtitle, subtitle_font, AMBER, shadow_offset=2)

    # Logo
    logo_path = SCRIPT_DIR.parent / "src" / "assets" / "daily-bag-icon-transparent.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA").resize((72, 72), Image.Resampling.LANCZOS)
        img.paste(logo, (16, 12), logo)

    img = img.convert("RGB")
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")

def create_rewards_overlay(input_path: str, output_path: str):
    """Create branded rewards marketing image."""
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    img = add_gradient_bar(img, height=140, opacity=0.9)
    draw = ImageDraw.Draw(img)

    title_font = load_font("BigShoulders-Bold", 56)
    subtitle_font = load_font("Outfit-Regular", 26)

    headline = "TURN CHORES INTO CASH"
    bbox = draw.textbbox((0, 0), headline, font=title_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 110

    add_text_with_shadow(draw, (x, y), headline, title_font, WHITE)

    subtitle = "100 points = $1  •  Real money redemptions"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 50

    add_text_with_shadow(draw, (x, y), subtitle, subtitle_font, AMBER, shadow_offset=2)

    logo_path = SCRIPT_DIR.parent / "src" / "assets" / "daily-bag-icon-transparent.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA").resize((72, 72), Image.Resampling.LANCZOS)
        img.paste(logo, (16, 12), logo)

    img = img.convert("RGB")
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")

def create_family_overlay(input_path: str, output_path: str):
    """Create branded family lifestyle marketing image."""
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    img = add_gradient_bar(img, height=140, opacity=0.9)
    draw = ImageDraw.Draw(img)

    title_font = load_font("BigShoulders-Bold", 56)
    subtitle_font = load_font("Outfit-Regular", 26)

    headline = "CHORES MADE FUN"
    bbox = draw.textbbox((0, 0), headline, font=title_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 110

    add_text_with_shadow(draw, (x, y), headline, title_font, WHITE)

    subtitle = "Gamified tasks for the whole family"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = height - 50

    add_text_with_shadow(draw, (x, y), subtitle, subtitle_font, AMBER, shadow_offset=2)

    logo_path = SCRIPT_DIR.parent / "src" / "assets" / "daily-bag-icon-transparent.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA").resize((72, 72), Image.Resampling.LANCZOS)
        img.paste(logo, (16, 12), logo)

    img = img.convert("RGB")
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    marketing_dir = SCRIPT_DIR

    # Process leaderboard
    create_leaderboard_overlay(
        str(marketing_dir / "dailybag_leaderboard_00002_.png"),
        str(marketing_dir / "dailybag_leaderboard_branded.png")
    )

    # Process achievement
    create_achievement_overlay(
        str(marketing_dir / "dailybag_achievement_00001_.png"),
        str(marketing_dir / "dailybag_achievement_branded.png")
    )

    # Process rewards
    create_rewards_overlay(
        str(marketing_dir / "dailybag_rewards_00001_.png"),
        str(marketing_dir / "dailybag_rewards_branded.png")
    )

    # Process family
    create_family_overlay(
        str(marketing_dir / "dailybag_family_00001_.png"),
        str(marketing_dir / "dailybag_family_branded.png")
    )

    print("\nAll branded images created!")
