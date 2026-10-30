#!/usr/bin/env python3
"""
LetZShop Permanent Store QR Code Generator
Standard-compliant, high-error-correction static QR generator for merchant storefronts.

Supported Formats:
- PNG (512x512, 1024x1024, 1200x1200, 2048x2048 px, or custom size)
- SVG (Scalable Vector Graphics for print media, signage, and brochures)

Standards:
- ISO/IEC 18004 Standard QR Encoding
- Error Correction Level: H (High, ~30% recovery capability)
- Quiet Zone: Minimum 4 modules on all sides
- Palette: Strict contrast (Solid black modules #000000 on solid white background #FFFFFF)
"""

import argparse
import os
import sys
from pathlib import Path

try:
    import qrcode
    import qrcode.image.svg
    from qrcode.constants import ERROR_CORRECT_H
    from PIL import Image
except ImportError as err:
    sys.stderr.write(f"Error: Missing required Python libraries ({err}). Run: pip install qrcode pillow\n")
    sys.exit(1)


def generate_qr(
    url: str,
    output_path: str,
    size: int = 1200,
    output_format: str = "png",
) -> str:
    """
    Generates a high-resolution PNG or true vector SVG QR code.
    """
    if not url or not url.strip():
        raise ValueError("URL cannot be empty.")

    url = url.strip()
    target_path = Path(output_path).resolve()
    target_path.parent.mkdir(parents=True, exist_ok=True)

    format_choice = (output_format or "").strip().lower()
    if not format_choice:
        ext = target_path.suffix.lower().replace(".", "")
        format_choice = ext if ext in ["png", "svg"] else "png"

    if format_choice == "svg":
        try:
            qr = qrcode.QRCode(
                version=None,
                error_correction=ERROR_CORRECT_H,
                box_size=10,
                border=4,
                image_factory=qrcode.image.svg.SvgPathImage,
            )
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            img.save(str(target_path))
            return str(target_path)
        except Exception as svg_err:
            raise RuntimeError(f"Failed to generate SVG QR code: {svg_err}") from svg_err

    # PNG Generation
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Render base image
    base_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Resize to exact requested pixel dimension using NEAREST to maintain razor-sharp modules
    if size and (base_img.width != size or base_img.height != size):
        resample_mode = getattr(Image, "Resampling", Image).NEAREST
        final_img = base_img.resize((size, size), resample=resample_mode)
    else:
        final_img = base_img

    final_img.save(str(target_path), format="PNG", optimize=True)
    return str(target_path)


def main():
    parser = argparse.ArgumentParser(
        description="LetZShop High-Resolution Merchant Store QR Code Generator"
    )
    parser.add_argument(
        "--url",
        "-u",
        required=True,
        help="Permanent redirect URL to encode (e.g. https://letzshop.store/q/7d9f4c82)",
    )
    parser.add_argument(
        "--output",
        "-o",
        required=True,
        help="Output destination file path (.png or .svg)",
    )
    parser.add_argument(
        "--size",
        "-s",
        type=int,
        default=1200,
        help="Target dimensions in pixels for raster PNG (default: 1200)",
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["png", "svg"],
        default=None,
        help="Output format: 'png' or 'svg' (defaults to file extension)",
    )

    args = parser.parse_args()

    try:
        saved_file = generate_qr(
            url=args.url,
            output_path=args.output,
            size=args.size,
            output_format=args.format,
        )
        print(f"SUCCESS: QR code successfully written to {saved_file}")
        sys.exit(0)
    except Exception as exc:
        sys.stderr.write(f"ERROR: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
