from typing import List, Any, Set


def parse_page_range(pages_str: str, total: int) -> List[int]:
    pages_str = pages_str.strip()
    if not pages_str or pages_str.lower() == 'all':
        return list(range(1, total + 1))

    result = []
    for part in pages_str.split(','):
        part = part.strip()
        if '-' in part:
            s, e = map(int, part.split('-'))
            for n in range(s, min(e + 1, total + 1)):
                result.append(n)
        else:
            n = int(part)
            if 1 <= n <= total:
                result.append(n)
    return sorted(set(result))


def parse_pdf_color(value: Any, default=(0, 0, 0)) -> tuple:
    if isinstance(value, str):
        color = value.strip().lstrip("#")
        if len(color) == 3:
            color = "".join(ch * 2 for ch in color)
        if len(color) == 6:
            try:
                return tuple(int(color[i:i + 2], 16) / 255 for i in (0, 2, 4))
            except ValueError:
                return default

    if isinstance(value, list) and len(value) >= 3:
        try:
            return tuple(max(0, min(1, float(value[i]))) for i in range(3))
        except (TypeError, ValueError):
            return default

    return default


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "sim", "on")
    return bool(value)


def safe_field_name(value: Any, prefix: str, index: int, used: Set[str]) -> str:
    raw = str(value or f"{prefix}_{index + 1}").strip()
    safe = "".join(ch if ch.isalnum() or ch in ("_", "-", ".") else "_" for ch in raw)
    safe = (safe[:80] or f"{prefix}_{index + 1}")
    base = safe
    suffix = 2
    while safe in used:
        safe = f"{base}_{suffix}"
        suffix += 1
    used.add(safe)
    return safe


def operation_rect(fitz_module, op: dict, page_rect, min_width=8, min_height=8):
    try:
        x = float(op.get("x", 0))
        y = float(op.get("y", 0))
        width = max(min_width, float(op.get("width", min_width)))
        height = max(min_height, float(op.get("height", min_height)))
    except (TypeError, ValueError):
        from core.errors import raise_bad_request
        raise_bad_request("Operacao contem coordenadas invalidas")

    x0 = max(0, min(page_rect.width - min_width, x))
    y0 = max(0, min(page_rect.height - min_height, y))
    x1 = max(x0 + min_width, min(page_rect.width, x0 + width))
    y1 = max(y0 + min_height, min(page_rect.height, y0 + height))
    return fitz_module.Rect(x0, y0, x1, y1)


def pdf_color_to_hex(value: Any) -> str:
    if isinstance(value, int):
        return f"#{(value >> 16) & 255:02X}{(value >> 8) & 255:02X}{value & 255:02X}"
    return "#111827"
