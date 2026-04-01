"""
chunker.py — Section-aware document chunking for ScarTrace

Splits documents into structural chunks by:
1. Heading blocks (markdown/HTML headings) when they exist
2. Paragraph breaks (double newlines)
3. Rolling windows with overlap as fallback

Each chunk carries its section path, character offsets, and chunk ID.

Zero dependencies beyond stdlib.
"""

import hashlib
import re
from typing import List, Dict, Any, Optional


# heading patterns
HEADING_PATTERNS = [
    re.compile(r'^#{1,6}\s+(.+)$', re.MULTILINE),          # markdown
    re.compile(r'^(.+)\n[=]{3,}$', re.MULTILINE),           # setext h1
    re.compile(r'^(.+)\n[-]{3,}$', re.MULTILINE),           # setext h2
    re.compile(r'<h[1-6][^>]*>(.+?)</h[1-6]>', re.IGNORECASE),  # HTML
]

# target chunk size in words
MIN_CHUNK_WORDS = 80
MAX_CHUNK_WORDS = 250
OVERLAP_RATIO = 0.25


def _word_count(text: str) -> int:
    return len(re.findall(r'\w+', text))


def _chunk_id(doc_id: str, char_start: int) -> str:
    raw = f"{doc_id}:{char_start}"
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def _find_headings(text: str) -> List[Dict]:
    """Find all headings with their character positions."""
    headings = []
    for pattern in HEADING_PATTERNS:
        for match in pattern.finditer(text):
            headings.append({
                "title": match.group(1).strip(),
                "start": match.start(),
                "end": match.end(),
            })
    headings.sort(key=lambda h: h["start"])
    return headings


def _split_by_headings(text: str, headings: List[Dict]) -> List[Dict]:
    """Split text into sections by heading positions."""
    if not headings:
        return [{"title": None, "text": text, "start": 0}]

    sections = []
    for i, h in enumerate(headings):
        section_start = h["end"]
        section_end = headings[i + 1]["start"] if i + 1 < len(headings) else len(text)
        section_text = text[section_start:section_end].strip()
        if section_text:
            sections.append({
                "title": h["title"],
                "text": section_text,
                "start": section_start,
            })

    # capture text before first heading
    if headings[0]["start"] > 0:
        pre_text = text[:headings[0]["start"]].strip()
        if pre_text and _word_count(pre_text) >= MIN_CHUNK_WORDS // 2:
            sections.insert(0, {"title": None, "text": pre_text, "start": 0})

    return sections


def _split_by_paragraphs(text: str, base_offset: int = 0) -> List[Dict]:
    """Split text into paragraph-level chunks."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    offset = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            offset += 2
            continue

        # find actual position in original text
        idx = text.find(para, offset)
        if idx == -1:
            idx = offset

        chunks.append({
            "text": para,
            "start": base_offset + idx,
            "end": base_offset + idx + len(para),
        })
        offset = idx + len(para)

    return chunks


def _merge_small_chunks(chunks: List[Dict], min_words: int = MIN_CHUNK_WORDS) -> List[Dict]:
    """Merge adjacent chunks that are too small."""
    if not chunks:
        return []

    merged = [chunks[0]]
    for chunk in chunks[1:]:
        if _word_count(merged[-1]["text"]) < min_words:
            merged[-1]["text"] += "\n\n" + chunk["text"]
            merged[-1]["end"] = chunk["end"]
        else:
            merged.append(chunk)

    # merge last chunk if too small
    if len(merged) > 1 and _word_count(merged[-1]["text"]) < min_words // 2:
        merged[-2]["text"] += "\n\n" + merged[-1]["text"]
        merged[-2]["end"] = merged[-1]["end"]
        merged.pop()

    return merged


def _rolling_window(text: str, base_offset: int = 0,
                    max_words: int = MAX_CHUNK_WORDS,
                    overlap: float = OVERLAP_RATIO) -> List[Dict]:
    """Fallback: split by rolling word windows with overlap."""
    words = text.split()
    if len(words) <= max_words:
        return [{"text": text, "start": base_offset, "end": base_offset + len(text)}]

    step = int(max_words * (1 - overlap))
    chunks = []
    for i in range(0, len(words), step):
        window = words[i:i + max_words]
        chunk_text = " ".join(window)
        # approximate character offsets
        char_start = base_offset + text.find(window[0], sum(len(w) + 1 for w in words[:i]))
        chunks.append({
            "text": chunk_text,
            "start": max(base_offset, char_start),
            "end": base_offset + min(len(text), char_start + len(chunk_text)),
        })
        if i + max_words >= len(words):
            break

    return chunks


def chunk_document(
    text: str,
    doc_id: str = "doc",
    section_path: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Chunk a document into structural units for ScarTrace comparison.

    Strategy:
    1. Find headings → split into sections
    2. Within each section, split by paragraphs
    3. Merge small paragraphs until they hit MIN_CHUNK_WORDS
    4. Split oversized chunks with rolling windows

    Returns list of chunk dicts with:
        doc_id, chunk_id, section_path, section_title,
        char_start, char_end, text, word_count
    """
    if section_path is None:
        section_path = []

    headings = _find_headings(text)
    sections = _split_by_headings(text, headings)

    all_chunks = []

    for section in sections:
        sec_title = section["title"]
        sec_path = section_path + ([sec_title] if sec_title else [])

        # split section into paragraphs
        para_chunks = _split_by_paragraphs(section["text"], section["start"])

        # merge small paragraphs
        merged = _merge_small_chunks(para_chunks)

        # split oversized chunks with rolling windows
        final_chunks = []
        for chunk in merged:
            wc = _word_count(chunk["text"])
            if wc > MAX_CHUNK_WORDS * 1.5:
                windows = _rolling_window(chunk["text"], chunk["start"])
                final_chunks.extend(windows)
            else:
                final_chunks.append(chunk)

        # build output
        for chunk in final_chunks:
            cid = _chunk_id(doc_id, chunk["start"])
            all_chunks.append({
                "doc_id": doc_id,
                "chunk_id": cid,
                "section_path": sec_path,
                "section_title": sec_title,
                "char_start": chunk["start"],
                "char_end": chunk["end"],
                "text": chunk["text"],
                "word_count": _word_count(chunk["text"]),
            })

    return all_chunks


if __name__ == "__main__":
    import sys, json
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            text = f.read()
        doc_id = sys.argv[2] if len(sys.argv) > 2 else "doc"
    else:
        text = sys.stdin.read()
        doc_id = "stdin"

    chunks = chunk_document(text, doc_id)
    print(json.dumps(chunks, indent=2, ensure_ascii=False))
