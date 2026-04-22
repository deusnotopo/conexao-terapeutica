import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

try:
    import fitz  # type: ignore
except Exception:  # noqa: BLE001
    fitz = None

try:
    import pandas as pd  # type: ignore
except Exception:  # noqa: BLE001
    pd = None

try:
    from PIL import Image  # type: ignore
except Exception:  # noqa: BLE001
    Image = None

try:
    import pypdf  # type: ignore
except Exception:  # noqa: BLE001
    pypdf = None

try:
    import pytesseract  # type: ignore
except Exception:  # noqa: BLE001
    pytesseract = None


@dataclass
class IngestedDocument:
    file_name: str
    doc_type: str
    source_type: str
    extracted_text: str
    tables: List[List[str]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


def classify_document(file_name: str, text: str) -> str:
    normalized = f"{file_name} {text}".lower()
    if "retificacao" in normalized:
        return "retificacao"
    if "termo de referencia" in normalized:
        return "termo_referencia"
    if "edital" in normalized:
        return "edital_principal"
    if "planilha" in normalized or "lote" in normalized:
        return "planilha"
    if "minuta" in normalized or "contrato" in normalized:
        return "minuta_contrato"
    return "anexo_generico"


def extract_tables(text: str) -> List[List[str]]:
    tables: List[List[str]] = []
    for line in text.splitlines():
        if ";" in line:
            cells = [cell.strip() for cell in line.split(";") if cell.strip()]
            if len(cells) >= 2:
                tables.append(cells)
    return tables


def _extract_pdf_with_pypdf(path: Path) -> str:
    if pypdf is None:
        return ""
    reader = pypdf.PdfReader(str(path))
    return "\n".join((page.extract_text() or "") for page in reader.pages).strip()


def _extract_pdf_with_fitz(path: Path) -> str:
    if fitz is None:
        return ""
    doc = fitz.open(str(path))
    chunks = []
    for page in doc:
        chunks.append(page.get_text("text") or "")
    doc.close()
    return "\n".join(chunks).strip()


def _extract_pdf_with_ocr(path: Path) -> str:
    if fitz is None or pytesseract is None or Image is None:
        return ""
    doc = fitz.open(str(path))
    chunks = []
    for page in doc:
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = pytesseract.image_to_string(image, lang="por+eng")
        if text.strip():
            chunks.append(text.strip())
    doc.close()
    return "\n".join(chunks).strip()


def _extract_spreadsheet_text(path: Path) -> str:
    if pd is None:
        return ""
    if path.suffix.lower() == ".csv":
        dataframe = pd.read_csv(path)
        return dataframe.to_csv(index=False)

    workbook = pd.read_excel(path, sheet_name=None)
    chunks = []
    for sheet_name, dataframe in workbook.items():
        chunks.append(f"[sheet:{sheet_name}]")
        chunks.append(dataframe.to_csv(index=False))
    return "\n".join(chunks).strip()


def ingest_text_content(file_name: str, content: str, source_type: str = "inline") -> IngestedDocument:
    warnings: List[str] = []
    extracted_text = content.strip()

    if source_type == "pdf_scan":
        warnings.append("OCR pendente: conteúdo recebido de fonte escaneada")
    if not extracted_text:
        warnings.append("Documento sem texto extraído")

    return IngestedDocument(
        file_name=file_name,
        doc_type=classify_document(file_name, extracted_text),
        source_type=source_type,
        extracted_text=extracted_text,
        tables=extract_tables(extracted_text),
        warnings=warnings,
    )


def ingest_file(file_path: str) -> IngestedDocument:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md", ".html"}:
        content = path.read_text(encoding="utf-8")
        return ingest_text_content(path.name, content, source_type=suffix.replace(".", ""))

    if suffix == ".pdf":
        extracted_text = ""
        warnings = []
        if pypdf is not None:
            try:
                extracted_text = _extract_pdf_with_pypdf(path)
            except Exception as exc:  # noqa: BLE001
                warnings.append(f"Falha no parser PDF real: {exc}")

        if not extracted_text and fitz is not None:
            try:
                extracted_text = _extract_pdf_with_fitz(path)
            except Exception as exc:  # noqa: BLE001
                warnings.append(f"Falha no fallback fitz: {exc}")

        if not extracted_text:
            if pytesseract is not None and fitz is not None and Image is not None:
                try:
                    extracted_text = _extract_pdf_with_ocr(path)
                except Exception as exc:  # noqa: BLE001
                    warnings.append(f"Falha no OCR real: {exc}")
            else:
                warnings.append("OCR real indisponível: tesseract/binário ou libs ausentes")

        if not extracted_text:
            warnings.append("PDF sem texto extraído")
        return IngestedDocument(
            file_name=path.name,
            doc_type=classify_document(path.name, extracted_text or path.stem),
            source_type="pdf",
            extracted_text=extracted_text,
            tables=extract_tables(extracted_text),
            warnings=warnings,
        )

    if suffix in {".csv", ".xlsx", ".xls"}:
        extracted_text = _extract_spreadsheet_text(path)
        warnings = []
        if not extracted_text:
            warnings.append("Falha ao extrair planilha/anexo complexo")
        return IngestedDocument(
            file_name=path.name,
            doc_type=classify_document(path.name, extracted_text or path.stem),
            source_type=suffix.replace(".", ""),
            extracted_text=extracted_text,
            tables=extract_tables(extracted_text),
            warnings=warnings,
        )

    return IngestedDocument(
        file_name=path.name,
        doc_type="desconhecido",
        source_type=suffix.replace(".", "") or "arquivo",
        extracted_text="",
        tables=[],
        warnings=["Tipo de arquivo ainda não suportado"],
    )


def merge_document_text(documents: List[IngestedDocument]) -> str:
    chunks = []
    for document in documents:
        header = f"[{document.doc_type}:{document.file_name}]"
        chunks.append(f"{header}\n{document.extracted_text}".strip())
    return "\n\n".join(chunk for chunk in chunks if chunk.strip())