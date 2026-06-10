import base64
import hashlib
import json
import re
import uuid
import urllib.parse
from typing import List, Tuple, Optional
from pathlib import Path

from core.errors import raise_bad_request, raise_internal_error


def base64_encode_service(text: str) -> str:
    if not text:
        raise_bad_request("Texto vazio")
    return base64.b64encode(text.encode("utf-8")).decode("utf-8")


def base64_decode_service(text: str) -> str:
    if not text:
        raise_bad_request("Texto vazio")
    try:
        return base64.b64decode(text.encode("utf-8")).decode("utf-8")
    except Exception:
        raise_bad_request("Texto nao e um Base64 valido")


def hash_service(text: str, algorithm: str) -> str:
    if not text:
        raise_bad_request("Texto vazio")
    algorithms = {
        "md5": hashlib.md5,
        "sha1": hashlib.sha1,
        "sha256": hashlib.sha256,
        "sha512": hashlib.sha512,
        "blake2b": hashlib.blake2b,
    }
    if algorithm not in algorithms:
        raise_bad_request(f"Algoritmo invalido. Use: {', '.join(algorithms.keys())}")
    return algorithms[algorithm](text.encode("utf-8")).hexdigest()


def uuid_service(version: str, count: int) -> List[str]:
    if count < 1 or count > 100:
        raise_bad_request("Quantidade deve ser entre 1 e 100")
    results = []
    for _ in range(count):
        if version == "v1":
            results.append(str(uuid.uuid1()))
        elif version == "v4":
            results.append(str(uuid.uuid4()))
        elif version == "v7":
            try:
                results.append(str(uuid.uuid4()))
            except AttributeError:
                results.append(str(uuid.uuid4()))
        else:
            raise_bad_request("Versao invalida. Use v1, v4 ou v7")
    return results


def url_encode_service(text: str) -> str:
    if not text:
        raise_bad_request("Texto vazio")
    return urllib.parse.quote(text, safe="")


def url_decode_service(text: str) -> str:
    if not text:
        raise_bad_request("Texto vazio")
    try:
        return urllib.parse.unquote(text)
    except Exception:
        raise_bad_request("Texto nao e uma URL encoded valida")


def json_format_service(text: str, action: str) -> dict:
    if not text:
        raise_bad_request("JSON vazio")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise_bad_request(f"JSON invalido: {str(e)}")

    if action == "format":
        return {"output": json.dumps(data, indent=2, ensure_ascii=False), "action": "format"}
    elif action == "minify":
        return {"output": json.dumps(data, separators=(",", ":"), ensure_ascii=False), "action": "minify"}
    elif action == "validate":
        return {"output": text, "action": "validate", "valid": True, "keys_count": len(data) if isinstance(data, dict) else 0}
    else:
        raise_bad_request("Acao invalida. Use format, minify ou validate")


LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
    "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
    "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
    "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
    "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum", "praesent", "sapien", "massa", "convallis", "a", "pellentesque",
    "nec", "egestas", "non", "nisi", "cras", "ultricies", "ligula", "sed", "magna",
    "dictum", "porta", "vivamus", "suscipit", "tortor", "eget", "felis", "porttitor",
    "volutpat", "nulla", "porttitor", "accumsan", "tincidunt", "vestibulum", "ante",
    "ipsum", "primis", "in", "faucibus", "orci", "luctus", "ultrices", "posuere",
]


def lorem_service(paragraphs: int, words_per_paragraph: int) -> List[str]:
    if paragraphs < 1 or paragraphs > 50:
        raise_bad_request("Paragrafos deve ser entre 1 e 50")
    if words_per_paragraph < 5 or words_per_paragraph > 200:
        raise_bad_request("Palavras por paragrafo deve ser entre 5 e 200")

    import random
    random.seed(42)
    result = []
    for _ in range(paragraphs):
        words = [random.choice(LOREM_WORDS) for _ in range(words_per_paragraph)]
        words[0] = words[0].capitalize()
        paragraph = " ".join(words) + "."
        result.append(paragraph)
    return result


def diff_service(text1: str, text2: str) -> List[dict]:
    import difflib
    lines1 = text1.splitlines(keepends=True)
    lines2 = text2.splitlines(keepends=True)
    diff = list(difflib.unified_diff(lines1, lines2, lineterm=""))
    return [{"line": line} for line in diff]


def regex_service(pattern: str, text: str, flags: str = "") -> dict:
    if not pattern:
        raise_bad_request("Expressao regular vazia")

    flag_map = {"i": re.IGNORECASE, "m": re.MULTILINE, "s": re.DOTALL, "x": re.VERBOSE}
    flag_val = 0
    for f in flags:
        if f in flag_map:
            flag_val |= flag_map[f]
        else:
            raise_bad_request(f"Flag invalida: {f}. Use: i, m, s, x")

    try:
        compiled = re.compile(pattern, flag_val)
    except re.error as e:
        raise_bad_request(f"Regex invalida: {str(e)}")

    matches = []
    for m in compiled.finditer(text):
        groups = {}
        for i, g in enumerate(m.groups(), 1):
            groups[str(i)] = g
        for k, v in m.groupdict().items():
            groups[k] = v
        matches.append({
            "match": m.group(),
            "start": m.start(),
            "end": m.end(),
            "groups": groups if groups else None
        })

    return {
        "pattern": pattern,
        "flags": flags,
        "match_count": len(matches),
        "matches": matches
    }


def repair_pdf_service(input_path: Path, output_path: Path) -> Tuple[Path, int, int]:
    try:
        import fitz
    except ImportError:
        raise_internal_error("Dependencia nao instalada: pymupdf")

    try:
        doc = fitz.open(str(input_path))
    except Exception:
        raise_bad_request("PDF corrompido — nao foi possivel abrir o arquivo")

    page_count = doc.page_count
    doc.save(str(output_path), garbage=4, deflate=True, clean=True)
    doc.close()

    import os
    original_size = os.path.getsize(str(input_path))
    repaired_size = os.path.getsize(str(output_path))
    return output_path, original_size, repaired_size


def bookmarks_service(input_path: Path, output_path: Path, bookmarks_json: Optional[str]) -> dict:
    try:
        import fitz
    except ImportError:
        raise_internal_error("Dependencia nao instalada: pymupdf")

    doc = fitz.open(str(input_path))

    if bookmarks_json:
        try:
            toc = json.loads(bookmarks_json)
        except json.JSONDecodeError:
            raise_bad_request("Formato JSON invalido para bookmarks")

        if not isinstance(toc, list):
            raise_bad_request("Bookmarks deve ser uma lista")

        validated_toc = []
        for entry in toc:
            if isinstance(entry, list) and len(entry) >= 3:
                level = int(entry[0])
                title = str(entry[1])
                page = int(entry[2])
                if page < 1 or page > doc.page_count:
                    raise_bad_request(f"Pagina {page} fora do intervalo (1-{doc.page_count})")
                validated_toc.append([level, title, page])

        doc.set_toc(validated_toc)
        doc.save(str(output_path), incremental=False)
        doc.close()
        return {"bookmarks_count": len(validated_toc), "action": "created"}
    else:
        toc = doc.get_toc()
        doc.close()
        formatted = [{"level": entry[0], "title": entry[1], "page": entry[2]} for entry in toc]
        return {"bookmarks": formatted, "bookmarks_count": len(formatted), "action": "read"}


def colorblind_simulate_service(input_path: Path, output_folder: Path) -> Tuple[List[Path], List[str]]:
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        raise_internal_error("Dependencias nao instaladas: pillow, numpy")

    img = Image.open(str(input_path)).convert("RGB")
    arr = np.array(img, dtype=np.float32)

    matrices = {
        "protanopia": np.array([[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]]),
        "deuteranopia": np.array([[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]]),
        "tritanopia": np.array([[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]),
        "achromatopsia": np.array([[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]]),
    }

    modes_created = []
    paths = []
    for mode, matrix in matrices.items():
        sim = arr.reshape(-1, 3) @ matrix.T
        sim = np.clip(sim, 0, 255).astype(np.uint8).reshape(arr.shape)
        sim_img = Image.fromarray(sim)
        out_path = output_folder / f"{mode}.png"
        sim_img.save(str(out_path))
        paths.append(out_path)
        modes_created.append(mode)

    return paths, modes_created


def csv_json_service(input_text: str, direction: str) -> dict:
    import csv
    import io

    if direction == "csv-to-json":
        reader = csv.DictReader(io.StringIO(input_text))
        rows = [row for row in reader]
        if not rows:
            raise_bad_request("CSV vazio ou formato invalido")
        output = json.dumps(rows, indent=2, ensure_ascii=False)
        return {"output": output, "direction": "csv-to-json", "rows": len(rows)}
    elif direction == "json-to-csv":
        try:
            data = json.loads(input_text)
        except json.JSONDecodeError as e:
            raise_bad_request(f"JSON invalido: {str(e)}")

        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list) or not data:
            raise_bad_request("JSON deve ser um array de objetos")

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return {"output": output.getvalue(), "direction": "json-to-csv", "rows": len(data)}
    else:
        raise_bad_request("Direcao invalida. Use csv-to-json ou json-to-csv")


def markdown_to_pdf_service(input_path: Path, output_path: Path) -> Path:
    try:
        import markdown
    except ImportError:
        raise_internal_error("Dependencia nao instalada: markdown")

    with open(str(input_path), "r", encoding="utf-8") as f:
        md_text = f.read()

    html = markdown.markdown(md_text, extensions=["extra", "codehilite", "tables"])

    html_full = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }}
h1 {{ border-bottom: 2px solid #eee; padding-bottom: 8px; }}
h2 {{ border-bottom: 1px solid #eee; padding-bottom: 6px; }}
code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }}
pre {{ background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }}
pre code {{ background: none; padding: 0; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
th {{ background: #f8f8f8; }}
blockquote {{ border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }}
</style>
</head>
<body>{html}</body>
</html>"""

    try:
        from weasyprint import HTML
        HTML(string=html_full).write_pdf(str(output_path))
    except ImportError:
        try:
            import fitz
            temp_html = output_path.parent / "temp.html"
            with open(str(temp_html), "w", encoding="utf-8") as f:
                f.write(html_full)
            doc = fitz.open()
            page = doc.new_page(width=595, height=842)
            page.insert_htmlbox(fitz.Rect(50, 50, 545, 792), html_full)
            doc.save(str(output_path))
            doc.close()
            temp_html.unlink(missing_ok=True)
        except ImportError:
            raise_internal_error("Dependencia nao instalada: weasyprint ou pymupdf")

    return output_path


def cpf_cnpj_service(text: str, action: str) -> dict:
    import re

    text = re.sub(r'[^\d]', '', text)

    if action == "validate":
        if len(text) == 11:
            return cpf_validate(text)
        elif len(text) == 14:
            return cnpj_validate(text)
        else:
            raise_bad_request("Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos")
    elif action == "format":
        if len(text) == 11:
            formatted = f"{text[:3]}.{text[3:6]}.{text[6:9]}-{text[9:]}"
            return {"formatted": formatted, "type": "CPF", "valid": cpf_validate(text)["valid"]}
        elif len(text) == 14:
            formatted = f"{text[:2]}.{text[2:5]}.{text[5:8]}/{text[8:12]}-{text[12:]}"
            return {"formatted": formatted, "type": "CNPJ", "valid": cnpj_validate(text)["valid"]}
        else:
            raise_bad_request("Documento deve ter 11 (CPF) ou 14 (CNPJ) digitos")
    elif action == "generate":
        import random
        if text == "cpf" or text == "CPF":
            digits = [random.randint(0, 9) for _ in range(9)]
            digits.extend(cpf_calc_dv(digits))
            num = "".join(str(d) for d in digits)
            formatted = f"{num[:3]}.{num[3:6]}.{num[6:9]}-{num[9:]}"
            return {"generated": num, "formatted": formatted, "type": "CPF"}
        else:
            digits = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]
            digits.extend(cnpj_calc_dv(digits))
            num = "".join(str(d) for d in digits)
            formatted = f"{num[:2]}.{num[2:5]}.{num[5:8]}/{num[8:12]}-{num[12:]}"
            return {"generated": num, "formatted": formatted, "type": "CNPJ"}
    else:
        raise_bad_request("Acao invalida. Use validate, format ou generate")


def cpf_validate(num_str: str) -> dict:
    digits = [int(d) for d in num_str]
    if len(set(digits)) == 1:
        return {"valid": False, "type": "CPF", "reason": "Todos os digitos iguais"}

    dv1 = cpf_calc_dv(digits[:9])
    if dv1[0] != digits[9] or dv1[1] != digits[10]:
        return {"valid": False, "type": "CPF", "reason": "Digitos verificadores invalidos"}

    return {"valid": True, "type": "CPF", "raw": num_str}


def cpf_calc_dv(digits: list) -> list:
    sm = sum((len(digits) + 1 - i) * d for i, d in enumerate(digits))
    dv1 = (sm * 10) % 11
    dv1 = 0 if dv1 == 10 else dv1
    digits.append(dv1)
    sm = sum((len(digits) + 1 - i) * d for i, d in enumerate(digits))
    dv2 = (sm * 10) % 11
    dv2 = 0 if dv2 == 10 else dv2
    return [dv1, dv2]


def cnpj_validate(num_str: str) -> dict:
    digits = [int(d) for d in num_str]
    if len(set(digits)) == 1:
        return {"valid": False, "type": "CNPJ", "reason": "Todos os digitos iguais"}

    dv = cnpj_calc_dv(digits[:12])
    if dv[0] != digits[12] or dv[1] != digits[13]:
        return {"valid": False, "type": "CNPJ", "reason": "Digitos verificadores invalidos"}

    return {"valid": True, "type": "CNPJ", "raw": num_str}


def cnpj_calc_dv(digits: list) -> list:
    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sm = sum(d * w for d, w in zip(digits, w1))
    dv1 = (sm % 11)
    dv1 = 0 if dv1 < 2 else 11 - dv1
    digits.append(dv1)
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sm = sum(d * w for d, w in zip(digits, w2))
    dv2 = (sm % 11)
    dv2 = 0 if dv2 < 2 else 11 - dv2
    return [dv1, dv2]


def redact_pdf_service(input_path: Path, output_path: Path, redact_type: str, terms: str) -> Tuple[Path, int]:
    try:
        import fitz
    except ImportError:
        raise_internal_error("Dependencia nao instalada: pymupdf")

    doc = fitz.open(str(input_path))
    redacted_count = 0

    patterns = {
        "cpf": r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}',
        "cnpj": r'\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}',
        "email": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        "phone": r'\(?\d{2}\)?\s?\d{4,5}-?\d{4}',
        "cep": r'\d{5}-?\d{3}',
    }

    import re

    if redact_type == "custom" and terms:
        search_terms = [t.strip() for t in terms.split(",") if t.strip()]
    elif redact_type in patterns:
        search_terms = [patterns[redact_type]]
        redact_type = "regex"
    else:
        raise_bad_request("Tipo de redacao invalido")

    for page in doc:
        for term in search_terms:
            if redact_type == "regex":
                for match in re.finditer(term, page.get_text()):
                    areas = page.search_for(match.group())
                    for area in areas:
                        page.add_redact_annot(area, fill=(0, 0, 0))
                        redacted_count += 1
            else:
                areas = page.search_for(term)
                for area in areas:
                    page.add_redact_annot(area, fill=(0, 0, 0))
                    redacted_count += 1

        if redacted_count > 0:
            page.apply_redactions()

    if redacted_count == 0:
        raise_bad_request("Nenhum termo encontrado para redigir")

    doc.save(str(output_path), garbage=3, deflate=True)
    doc.close()
    return output_path, redacted_count


def compare_pdfs_service(input_path1: Path, input_path2: Path) -> dict:
    try:
        import fitz
    except ImportError:
        raise_internal_error("Dependencia nao instalada: pymupdf")

    doc1 = fitz.open(str(input_path1))
    doc2 = fitz.open(str(input_path2))

    result = {
        "file1_pages": doc1.page_count,
        "file2_pages": doc2.page_count,
        "pages_compared": min(doc1.page_count, doc2.page_count),
        "page_differences": [],
        "total_differences": 0,
    }

    import difflib

    for i in range(result["pages_compared"]):
        text1 = doc1[i].get_text()
        text2 = doc2[i].get_text()

        if text1.strip() != text2.strip():
            diff = list(difflib.unified_diff(
                text1.splitlines(keepends=True),
                text2.splitlines(keepends=True),
                lineterm=""
            ))
            result["page_differences"].append({
                "page": i + 1,
                "differences": len([d for d in diff if d.startswith(("+", "-"))]),
                "diff": diff[:50]
            })
            result["total_differences"] += 1

    doc1.close()
    doc2.close()
    return result


def search_pdfs_service(file_paths: list, query: str) -> dict:
    try:
        import fitz
    except ImportError:
        raise_internal_error("Dependencia nao instalada: pymupdf")

    results = []
    total_occurrences = 0

    import re
    try:
        pattern = re.compile(query, re.IGNORECASE)
    except re.error:
        pattern = re.compile(re.escape(query), re.IGNORECASE)

    for fp in file_paths:
        doc = fitz.open(str(fp))
        file_results = []
        for i in range(doc.page_count):
            page = doc[i]
            text = page.get_text()
            matches = list(pattern.finditer(text))
            if matches:
                contexts = []
                for m in matches:
                    start = max(0, m.start() - 30)
                    end = min(len(text), m.end() + 30)
                    context = text[start:end].replace("\n", " ")
                    contexts.append(context)
                    total_occurrences += 1
                file_results.append({
                    "page": i + 1,
                    "occurrences": len(matches),
                    "contexts": contexts[:5]
                })
        doc.close()
        if file_results:
            results.append({
                "filename": fp.name,
                "total_occurrences": sum(r["occurrences"] for r in file_results),
                "pages": file_results
            })

    return {
        "query": query,
        "files_searched": len(file_paths),
        "files_with_results": len(results),
        "total_occurrences": total_occurrences,
        "results": results,
    }


def qrcode_service(text: str, format: str) -> Path:
    try:
        import qrcode
        from PIL import Image
    except ImportError:
        raise_internal_error("Dependencia nao instalada: qrcode, pillow")

    if not text:
        raise_bad_request("Texto vazio para QR Code")

    from core.tempfiles import generate_temp_path

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    ext = format if format in ("png", "jpg", "webp") else "png"
    output_path = generate_temp_path(suffix=f"_qrcode.{ext}")
    img.save(str(output_path))
    return output_path
