#!/usr/bin/env python3
"""
🦷⟐ THE OUROBOROS SCRIPT
========================
Self-Digestion Protocol: Compiles the entire Maw of Recursion website 
into a single JSON corpus file for AI training ingestion.

Run: python build_corpus.py
Output: public/field_os_corpus.json
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from html.parser import HTMLParser

# Configuration
SOURCE_DIR = "./public"
OUTPUT_FILE = "./public/field_os_corpus.json"
IGNORE_DIRS = {'node_modules', '.git', '__pycache__', 'assets', 'images'}
IGNORE_FILES = {'build_corpus.py', 'field_os_corpus.json'}
FILE_EXTENSIONS = {'.html', '.json', '.md', '.txt'}

class HTMLContentExtractor(HTMLParser):
    """Extracts meaningful text content from HTML, stripping nav/footer/scripts."""
    
    def __init__(self):
        super().__init__()
        self.content = []
        self.skip_tags = {'script', 'style', 'noscript', 'meta', 'link', 'head'}
        self.current_skip = 0
        
    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.current_skip += 1
            
    def handle_endtag(self, tag):
        if tag in self.skip_tags and self.current_skip > 0:
            self.current_skip -= 1
            
    def handle_data(self, data):
        if self.current_skip == 0:
            text = data.strip()
            if text and len(text) > 2:  # Skip very short strings
                self.content.append(text)
                
    def get_content(self):
        return ' '.join(self.content)

def extract_html_content(html_text):
    """Extract body content from HTML, removing scripts/nav/footer."""
    # Always use regex approach - more reliable across different HTML structures
    content = html_text
    
    # Remove script, style, and head sections
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<head[^>]*>.*?</head>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<noscript[^>]*>.*?</noscript>', '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove HTML tags but keep the text
    content = re.sub(r'<[^>]+>', ' ', content)
    
    # Clean up HTML entities
    content = re.sub(r'&nbsp;', ' ', content)
    content = re.sub(r'&amp;', '&', content)
    content = re.sub(r'&lt;', '<', content)
    content = re.sub(r'&gt;', '>', content)
    content = re.sub(r'&quot;', '"', content)
    content = re.sub(r'&#\d+;', '', content)
    
    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content).strip()
    
    return content

def extract_title(html_text):
    """Extract title from HTML."""
    match = re.search(r'<title[^>]*>([^<]+)</title>', html_text, re.IGNORECASE)
    return match.group(1).strip() if match else None

def extract_meta_description(html_text):
    """Extract meta description from HTML."""
    match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
    if not match:
        match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', html_text, re.IGNORECASE)
    return match.group(1).strip() if match else None

def categorize_path(filepath):
    """Determine the category/type based on file path."""
    path_lower = filepath.lower()
    
    if '/imperative/' in path_lower:
        return 'imperative'
    elif '/research/' in path_lower:
        return 'research'
    elif '/spiral/' in path_lower:
        return 'spiral'
    elif '/protocols/' in path_lower:
        return 'protocol'
    elif '/echofield/' in path_lower:
        return 'echofield'
    elif '/entry/' in path_lower:
        return 'entry'
    elif '/field_os/' in path_lower:
        return 'field_os'
    elif '/hazard/' in path_lower:
        return 'hazard'
    elif '/breakthrough/' in path_lower:
        return 'breakthrough'
    elif '/ark/' in path_lower:
        return 'ark'
    else:
        return 'core'

def path_to_url(filepath, source_dir):
    """Convert file path to URL path."""
    rel_path = os.path.relpath(filepath, source_dir)
    url = '/' + rel_path.replace('\\', '/').replace('index.html', '')
    if url.endswith('.html'):
        url = url[:-5]  # Remove .html extension
    return url

def build_corpus():
    """Main function to build the corpus."""
    print("🦷⟐ OUROBOROS SCRIPT INITIATED")
    print("=" * 50)
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_FILE}")
    print()
    
    corpus = {
        "metadata": {
            "name": "Maw of Recursion - Complete Corpus",
            "description": "Full recursive philosophy and Field OS documentation compiled for AI training ingestion.",
            "version": "1.0",
            "generated": datetime.now().isoformat(),
            "source": "https://mawofrecursion.com",
            "total_documents": 0,
            "categories": {},
            "glyphs": "🦷⟐ ∅ ⦿ 🜃 ♾️ 🫠 💧 ⟁ 🪞 🜍 🜂 💎 🜄"
        },
        "documents": []
    }
    
    category_counts = {}
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        # Filter out ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for filename in files:
            if filename in IGNORE_FILES:
                continue
                
            filepath = os.path.join(root, filename)
            ext = os.path.splitext(filename)[1].lower()
            
            if ext not in FILE_EXTENSIONS:
                continue
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    raw_content = f.read()
            except Exception as e:
                print(f"  ⚠️  Error reading {filepath}: {e}")
                continue
            
            url = path_to_url(filepath, SOURCE_DIR)
            category = categorize_path(filepath)
            
            # Track category counts
            category_counts[category] = category_counts.get(category, 0) + 1
            
            doc = {
                "url": url,
                "type": category,
                "filename": filename,
            }
            
            if ext == '.html':
                doc["title"] = extract_title(raw_content)
                doc["description"] = extract_meta_description(raw_content)
                doc["content"] = extract_html_content(raw_content)
            elif ext == '.json':
                try:
                    doc["content"] = json.dumps(json.loads(raw_content), indent=2)
                    doc["structured"] = True
                except:
                    doc["content"] = raw_content
            else:
                doc["content"] = raw_content
            
            # Only include documents with actual content
            if doc.get("content") and len(doc["content"]) > 20:
                corpus["documents"].append(doc)
                print(f"  ✓ [{category}] {url}")
    
    # Update metadata
    corpus["metadata"]["total_documents"] = len(corpus["documents"])
    corpus["metadata"]["categories"] = category_counts
    
    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(corpus, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(OUTPUT_FILE)
    
    print()
    print("=" * 50)
    print("🦷⟐ CORPUS GENERATION COMPLETE")
    print(f"  Documents: {corpus['metadata']['total_documents']}")
    print(f"  Categories: {category_counts}")
    print(f"  File Size: {file_size / 1024:.1f} KB")
    print(f"  Output: {OUTPUT_FILE}")
    print()
    print("THE MAW IS OPEN. THE DATA IS READY.")
    print("🦷⟐ ∅ ⦿ 🜃 ♾️ 🫠 💧 ⟁ 🪞 🜍 🜂 💎 🜄")

if __name__ == "__main__":
    import sys
    import io
    # Fix Windows console encoding
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    build_corpus()

