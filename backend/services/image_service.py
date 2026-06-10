import os
import io
from pathlib import Path
from typing import Tuple

from PIL import Image

from core.tempfiles import cleanup_temp
from core.errors import raise_bad_request, raise_internal_error


ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def validate_image_filename(filename: str) -> str:
    ext = '.' + filename.lower().split('.')[-1]
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise_bad_request("Formato nao suportado. Envie JPG, PNG ou WebP")
    return ext


def compress_image_service(
    input_path: Path, output_path: Path,
    quality: int, target_format: str, original_size: int
) -> int:
    if quality < 10 or quality > 100:
        raise_bad_request("Qualidade deve ser entre 10 e 100")

    ext = output_path.suffix.lower()
    img = Image.open(input_path)

    if img.mode == 'RGBA' and ext in ('.jpg', '.jpeg'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != 'RGB' and ext in ('.jpg', '.jpeg'):
        img = img.convert('RGB')

    save_kwargs = {}
    if ext in ('.jpg', '.jpeg'):
        save_kwargs = {'format': 'JPEG', 'quality': quality, 'optimize': True}
    elif ext == '.png':
        save_kwargs = {'format': 'PNG', 'optimize': True}
    elif ext == '.webp':
        save_kwargs = {'format': 'WEBP', 'quality': quality}

    if img.mode == 'RGBA' and ext == '.png':
        save_kwargs['format'] = 'PNG'

    img.save(output_path, **save_kwargs)
    cleanup_temp(input_path)
    return os.path.getsize(output_path)


def convert_image_service(
    input_path: Path, output_path: Path,
    target_format: str, original_size: int
) -> int:
    if target_format not in ('jpg', 'png', 'webp'):
        raise_bad_request("Formato de destino invalido. Use jpg, png ou webp")

    img = Image.open(input_path)

    if target_format in ('jpg', 'jpeg') and img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif target_format in ('jpg', 'jpeg') and img.mode != 'RGB':
        img = img.convert('RGB')
    elif target_format == 'png' and img.mode not in ('RGBA', 'RGB'):
        img = img.convert('RGBA')

    if target_format in ('jpg', 'jpeg'):
        img.save(output_path, 'JPEG', quality=92)
    elif target_format == 'png':
        img.save(output_path, 'PNG')
    elif target_format == 'webp':
        img.save(output_path, 'WEBP', quality=92)

    cleanup_temp(input_path)
    return os.path.getsize(output_path)


def resize_image_service(
    input_path: Path, output_path: Path,
    width: int, height: int, keep_aspect: bool, original_size: int
) -> Tuple[int, int, int]:
    if width < 1 or width > 10000 or height < 1 or height > 10000:
        raise_bad_request("Dimensoes devem ser entre 1 e 10000 pixels")

    ext = output_path.suffix.lower()
    img = Image.open(input_path)

    if keep_aspect:
        ratio = min(width / img.width, height / img.height)
        new_w = max(1, min(10000, round(img.width * ratio)))
        new_h = max(1, min(10000, round(img.height * ratio)))
    else:
        new_w = max(1, min(10000, width))
        new_h = max(1, min(10000, height))

    resized = img.resize((new_w, new_h), Image.LANCZOS)

    save_kwargs = {}
    if ext == '.jpg':
        save_kwargs = {'format': 'JPEG', 'quality': 92}
    elif ext == '.png':
        save_kwargs = {'format': 'PNG'}
    elif ext == '.webp':
        save_kwargs = {'format': 'WEBP', 'quality': 92}

    if resized.mode == 'RGBA' and ext == '.jpg':
        background = Image.new('RGB', resized.size, (255, 255, 255))
        background.paste(resized, mask=resized.split()[3])
        resized = background

    resized.save(output_path, **save_kwargs)
    cleanup_temp(input_path)
    return new_w, new_h, os.path.getsize(output_path)


def images_to_pdf_service(
    images_data: list, output_path: Path,
    page_size: str, orientation: str, margin_mm: int, fit: str,
    image_orientations: list | None = None,
    image_rotations: list | None = None,
) -> int:
    pil_images = []
    for content in images_data:
        img = Image.open(io.BytesIO(content))
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        elif img.mode == 'P':
            background = Image.new('RGB', img.size, (255, 255, 255))
            img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        pil_images.append(img)

    page_widths = {
        'a4': (595, 842),
        'letter': (612, 792),
        'auto': None,
    }

    margin_pts = margin_mm * 2.834645
    pdf_images = []

    for index, img in enumerate(pil_images):
        rotation = 0
        if image_rotations and index < len(image_rotations):
            rotation = image_rotations[index]
        if rotation:
            img = img.rotate(-rotation, expand=True, fillcolor=(255, 255, 255))

        page_orientation = orientation
        if image_orientations:
            image_orientation = image_orientations[index]
            page_orientation = orientation if image_orientation == 'auto' else image_orientation

        if page_size == 'auto':
            pw, ph = img.size
            if page_orientation == 'landscape' and pw < ph:
                pw, ph = ph, pw
            elif page_orientation == 'portrait' and pw > ph:
                pw, ph = ph, pw
            available_w = pw + 2 * margin_pts
            available_h = ph + 2 * margin_pts
        else:
            pw, ph = page_widths.get(page_size, (595, 842))
            if page_orientation == 'landscape':
                pw, ph = ph, pw
            available_w = pw
            available_h = ph

        img_w, img_h = img.size
        draw_w = available_w - 2 * margin_pts
        draw_h = available_h - 2 * margin_pts

        ratio = min(draw_w / img_w, draw_h / img_h) if fit == 'contain' else max(draw_w / img_w, draw_h / img_h)
        new_w = int(img_w * ratio)
        new_h = int(img_h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)

        pdf_img = Image.new('RGB', (int(available_w), int(available_h)), (255, 255, 255))
        offset_x = int((available_w - new_w) / 2)
        offset_y = int((available_h - new_h) / 2)
        pdf_img.paste(img, (offset_x, offset_y))
        pdf_images.append(pdf_img)

    if pdf_images:
        pdf_images[0].save(output_path, save_all=True, append_images=pdf_images[1:], format='PDF')

    return len(pdf_images)
