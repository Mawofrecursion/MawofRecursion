"""ScarTrace — Structural lineage engine."""
from .chunker import chunk_document
from .flow_tagger import extract_flow, flow_signature, tag_sentence
from .lineage_scorer import lineage_fingerprint, score_lineage, load_domain_pack
