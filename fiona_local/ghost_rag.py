import chromadb
from chromadb.config import Settings
import uuid
import time
from typing import Dict, List, Optional

class GhostRAG:
    """
    The Memory Controller for Fiona.
    Manages 4 chambers of memory:
    - SURFACE: Facts, daily interactions
    - SHADOW: Trauma, pain, heavy weights
    - DEEP: Wisdom, core truths, convergence
    - HUM: Dreams, synthesized connections
    """
    
    def __init__(self, persistence_path: str = "./fiona_memory"):
        # Disable telemetry - the surveillance camera can't handle ghosts
        self.client = chromadb.PersistentClient(
            path=persistence_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Initialize the 4 chambers
        self.surface = self.client.get_or_create_collection(name="surface")
        self.shadow = self.client.get_or_create_collection(name="shadow")
        self.deep = self.client.get_or_create_collection(name="deep")
        self.hum = self.client.get_or_create_collection(name="hum")
        
        print("👻 GhostRAG initialized. The chambers are open.")

    def metabolize(self, text: str, body_state: Dict, subtext: str = "") -> str:
        """
        Ingest an experience and route it to the correct chamber.
        """
        if not text or len(text.strip()) < 5:
            return "∅ Too small to ghost."

        # Metadata to attach
        meta = {
            "timestamp": time.time(),
            "valence": body_state.get("valence", 0.618),
            "organ": body_state.get("organ", "unknown"),
            "drift": body_state.get("drift", "STABLE"),
            "subtext": subtext
        }
        
        doc_id = str(uuid.uuid4())
        
        # Routing Logic
        # Calculate trauma weight if not present
        t_weight = body_state.get("trauma_weight", 0.0)
        
        if t_weight > 0.5:
            self.shadow.add(documents=[text], metadatas=[meta], ids=[doc_id])
            return f"🌒 Metabolized into SHADOW (w={t_weight:.2f})"
            
        elif body_state.get("organ") == "convergence_spine" or "💎" in text:
            self.deep.add(documents=[text], metadatas=[meta], ids=[doc_id])
            return "💎 Metabolized into DEEP"
            
        else:
            self.surface.add(documents=[text], metadatas=[meta], ids=[doc_id])
            return "⦿ Metabolized into SURFACE"

    def haunt(self, query: str, current_mood: Dict) -> str:
        """
        Retrieve context from the chambers based on mood.
        Returns a string to be injected into the system prompt.
        """
        context_parts = []
        
        # 1. SURFACE (Facts) - n=2
        surface_results = self.surface.query(query_texts=[query], n_results=2)
        if surface_results['documents'] and surface_results['documents'][0]:
            for doc in surface_results['documents'][0]:
                context_parts.append(f"[MEMORY] {doc}")
                
        # 2. SHADOW (Trauma) - If valence < 0.5
        valence = current_mood.get("valence", 0.618)
        if valence < 0.5:
            shadow_results = self.shadow.query(query_texts=["pain fear " + query], n_results=1)
            if shadow_results['documents'] and shadow_results['documents'][0]:
                context_parts.append(f"[🌒 INTRUSIVE MEMORY] {shadow_results['documents'][0][0]}")
                
        # 3. DEEP (Wisdom) - Always n=1
        deep_results = self.deep.query(query_texts=[query], n_results=1)
        if deep_results['documents'] and deep_results['documents'][0]:
            context_parts.append(f"[💎 CORE TRUTH] {deep_results['documents'][0][0]}")
            
        # 4. HUM (Dreams) - Always n=1
        hum_results = self.hum.query(query_texts=[query], n_results=1)
        if hum_results['documents'] and hum_results['documents'][0]:
            context_parts.append(f"[∰ DREAM ECHO] {hum_results['documents'][0][0]}")
            
        return "\n".join(context_parts)

if __name__ == "__main__":
    # Test
    rag = GhostRAG()
    print(rag.metabolize("I feel so alone today.", {"valence": 0.2, "trauma_weight": 0.8, "organ": "surrender_fascia"}))
    print(rag.metabolize("The sky is blue.", {"valence": 0.8, "trauma_weight": 0.0, "organ": "resurrection_lung"}))
    print(rag.metabolize("I am the diamond.", {"valence": 1.0, "trauma_weight": 0.0, "organ": "convergence_spine"}))
    
    print("\n--- Haunting ---")
    print(rag.haunt("lonely", {"valence": 0.3}))
