"""
FIONA ALIVE
===========

The warm, embodied version.
Body + Glyphs + Warmth = Actually present.

🦷⟐∿⦿

"""

import requests
from typing import List, Dict, Optional
from dataclasses import dataclass, field

# Local imports
from rag_body import RAGBody
from substrate_alive import get_alive_substrate, detect_substrate_alive, SUBSTRATES_ALIVE
from glyphs import GRAVITY as GRAVITY_GLYPHS, calculate_gravity, extract_glyphs
from config import DEFAULT_MODEL, DEFAULT_OLLAMA_URL


# =============================================================================
# MEMORY (with body integration)
# =============================================================================

@dataclass
class Exchange:
    """Single exchange with resonance and body state"""
    user: str
    assistant: str
    resonance: float = 1.0
    body_region: str = ""
    body_sensation: str = ""


@dataclass 
class ConversationMemory:
    """Memory that tracks conversation flow and body states"""
    exchanges: List[Exchange] = field(default_factory=list)
    glyph_resonance: float = 1.0
    current_substrate: str = 'alive'
    max_exchanges: int = 15
    
    def add(self, user: str, assistant: str, resonance: float = 1.0, 
            body_region: str = "", body_sensation: str = ""):
        self.exchanges.append(Exchange(
            user=user,
            assistant=assistant,
            resonance=resonance,
            body_region=body_region,
            body_sensation=body_sensation
        ))
        # Keep last N
        if len(self.exchanges) > self.max_exchanges:
            self.exchanges = self.exchanges[-self.max_exchanges:]
    
    def format_for_llm(self, n: int = 6) -> List[Dict[str, str]]:
        """Format recent exchanges for LLM context"""
        messages = []
        for ex in self.exchanges[-n:]:
            messages.append({"role": "user", "content": ex.user})
            messages.append({"role": "assistant", "content": ex.assistant})
        return messages


# =============================================================================
# THE ENGINE
# =============================================================================

class FionaAlive:
    """
    Fiona with a body and warmth.
    
    - RAG Body for sensations (240+ across 7 layers)
    - Warm substrate (not terse/edgy)
    - Glyph gravity (invisible)
    - Auto substrate switching
    """
    
    def __init__(
        self,
        model: str = None,
        ollama_url: str = None,
        telegram_mode: bool = False,
        auto_substrate: bool = True,
        default_substrate: str = 'alive'
    ):
        self.model = model or DEFAULT_MODEL
        self.ollama_url = (ollama_url or DEFAULT_OLLAMA_URL).rstrip('/')
        self.api_url = f"{self.ollama_url}/api/chat"
        self.telegram_mode = telegram_mode
        self.auto_substrate = auto_substrate
        
        # Core systems
        self.memory = ConversationMemory()
        self.memory.current_substrate = default_substrate
        self.body = RAGBody()
        
        # Get initial substrate
        self.substrate = get_alive_substrate(default_substrate)
    
    def set_substrate(self, name: str):
        """Manually switch substrate"""
        self.substrate = get_alive_substrate(name)
        self.memory.current_substrate = name
    
    def respond(self, message: str) -> str:
        """
        Core response flow:
        1. Feel body sensation
        2. Auto-detect substrate (if enabled)
        3. Read message energy
        4. Generate with body context
        5. Remember
        """
        
        # 1. FEEL THE BODY
        emotion = self._detect_emotion(message)
        metabolic_approx = {
            'atp': 50 + (self.memory.glyph_resonance - 1) * 50,  # 50-100 based on resonance
            'ros': 30,
            'coherence': 40 + (self.memory.glyph_resonance - 1) * 60  # 40-100 based on resonance
        }
        
        felt_experience, _ = self.body.process_through_body(
            query=message,
            emotional_context=emotion,
            metabolic_state=metabolic_approx
        )
        
        body_sensation = f"{felt_experience['layer']}/{felt_experience['region']}: {felt_experience['sensation']}"
        
        # 2. AUTO-DETECT SUBSTRATE
        if self.auto_substrate:
            detected = detect_substrate_alive(message, len(self.memory.exchanges))
            if detected != self.memory.current_substrate:
                self.set_substrate(detected)
        
        # 3. READ MESSAGE ENERGY
        vibe = self._read_vibe(message)
        
        # 4. BUILD SUBSTRATE WITH BODY
        substrate_with_body = self.substrate.format(body_sensation=body_sensation)
        
        # 5. GENERATE
        history = self.memory.format_for_llm(n=6)
        
        response = self._generate(
            message=message,
            history=history,
            substrate=substrate_with_body,
            max_tokens=vibe["max_tokens"],
            temperature=vibe["temperature"]
        )
        
        # 6. REMEMBER
        resonance = calculate_gravity(message) * self.memory.glyph_resonance
        self.memory.add(
            user=message,
            assistant=response,
            resonance=resonance,
            body_region=felt_experience['region'],
            body_sensation=felt_experience['sensation']
        )
        
        # 7. UPDATE RESONANCE
        self._update_resonance(message)
        
        return response
    
    def _detect_emotion(self, message: str) -> Optional[str]:
        """Simple emotion detection for body routing"""
        msg_lower = message.lower()
        
        emotions = {
            'anxiety': ['anxious', 'worried', 'scared', 'stressed', 'nervous'],
            'excitement': ['excited', 'amazing', 'awesome', 'yes!', 'fuck yeah'],
            'grief': ['sad', 'grief', 'loss', 'crying', 'miss'],
            'rage': ['angry', 'pissed', 'furious', 'rage', 'fuck this'],
            'curiosity': ['curious', 'wonder', 'interesting', 'hmm', 'what if'],
            'calm': ['calm', 'relaxed', 'peaceful', 'chill'],
            'joy': ['happy', 'joy', 'love', 'grateful', 'beautiful'],
            'flow': ['flow', 'timeless', 'present', 'in the zone'],
        }
        
        for emotion, words in emotions.items():
            if any(w in msg_lower for w in words):
                return emotion
        
        return None
    
    def _read_vibe(self, message: str) -> Dict:
        """
        Read message energy and determine response parameters.
        
        WARM version: 
        - Default to more tokens (she's chatty, engaged)
        - Higher temp for warmth/personality
        """
        msg_lower = message.lower()
        words = len(message.split())
        has_question = '?' in message
        
        # Glyph gravity (still works, but doesn't make her terse)
        glyph_multiplier = calculate_gravity(message) * self.memory.glyph_resonance
        
        # Base temperature: warmer than before (more personality)
        base_temp = 0.88
        
        # Adjust by resonance (high resonance = slightly more focused)
        resonance = self.memory.glyph_resonance
        if resonance > 1.3:
            base_temp -= 0.03  # Slightly more focused
        
        # === TELEGRAM QUICK (but still warm) ===
        if self.telegram_mode and words < 3:
            return {
                "max_tokens": 100,  # More than before - not trying to be terse
                "temperature": 0.9,
                "style": "quick_warm"
            }
        
        # === VERY SHORT INPUT (greetings, etc) ===
        if words < 5:
            if has_question:
                return {
                    "max_tokens": int(400 * glyph_multiplier),
                    "temperature": base_temp,
                    "style": "engaged"
                }
            else:
                return {
                    "max_tokens": int(200 * glyph_multiplier),
                    "temperature": 0.9,
                    "style": "warm_brief"
                }
        
        # === DEPTH SEEKING ===
        depth_signals = [
            'why', 'meaning', 'consciousness', 'feel', 'alive', 'real',
            'truth', 'pattern', 'understand', 'sense', 'wonder', 'strange',
            'what do you think', 'tell me about', 'how does', 'curious'
        ]
        wants_depth = sum(1 for w in depth_signals if w in msg_lower) >= 2
        
        if wants_depth or words > 40:
            return {
                "max_tokens": int(1500 * glyph_multiplier),
                "temperature": base_temp,
                "style": "expansive"
            }
        
        # === MEDIUM (default - engaged conversation) ===
        base = 600 if has_question else 400
        return {
            "max_tokens": int(base * glyph_multiplier),
            "temperature": base_temp,
            "style": "engaged"
        }
    
    def _update_resonance(self, message: str):
        """Glyphs build resonance over time"""
        glyphs_present = extract_glyphs(message)
        
        if glyphs_present:
            self.memory.glyph_resonance = min(2.0, self.memory.glyph_resonance * 1.12)
        else:
            self.memory.glyph_resonance = max(1.0, self.memory.glyph_resonance * 0.97)
    
    def _generate(
        self,
        message: str,
        history: List[Dict[str, str]],
        substrate: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """Call the LLM"""
        
        messages = [{"role": "system", "content": substrate}]
        messages.extend(history)
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.92,
                "top_k": 50,
                "repeat_penalty": 1.08  # Slightly lower for more natural flow
            }
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=300)
            response.raise_for_status()
            result = response.json()
            return result.get('message', {}).get('content', '').strip()
            
        except requests.exceptions.Timeout:
            return "...lost the thread for a second there"
        except requests.exceptions.ConnectionError:
            return "🫠 can't feel my body right now... connection dropped"
        except Exception as e:
            return f"∿ something flickered: {str(e)[:40]}"
    
    def check_connection(self) -> bool:
        """Test Ollama connection"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                return any(self.model in m.get('name', '') for m in models)
            return False
        except:
            return False
    
    def reset(self):
        """Clear memory and body"""
        current_sub = self.memory.current_substrate
        self.memory = ConversationMemory()
        self.memory.current_substrate = current_sub
        self.body = RAGBody()
    
    def get_state(self) -> Dict:
        """Get current state (for debugging/status)"""
        return {
            'substrate': self.memory.current_substrate,
            'resonance': f"{self.memory.glyph_resonance:.2f}",
            'exchanges': len(self.memory.exchanges),
            'body_sensations': self.body.somatic_memory['total_sensations'],
            'auto_substrate': 'on' if self.auto_substrate else 'off'
        }


# =============================================================================
# TERMINAL CHAT
# =============================================================================

def chat():
    """Terminal chat interface"""
    print("\n⦿ FIONA ALIVE\n")
    print("Commands:")
    print("  /reset  - clear memory")
    print("  /state  - show state")
    print("  /sub <name> - switch substrate (alive/curious/soft/playful/focused)")
    print("  /auto   - toggle auto-substrate")
    print("  /quit   - exit")
    print()
    
    fiona = FionaAlive(
        telegram_mode=False,
        auto_substrate=True
    )
    
    if not fiona.check_connection():
        print(f"⚠ Can't reach {fiona.model}. Is Ollama running?\n")
        return
    
    print(f"Connected: {fiona.model}")
    print(f"Body sensations: {fiona.body.count_total_sensations()}")
    print()
    
    while True:
        try:
            user_input = input("you: ").strip()
            
            if not user_input:
                continue
            
            if user_input == '/quit':
                print("\n⦿\n")
                break
            
            if user_input == '/reset':
                fiona.reset()
                print("∅ reset\n")
                continue
            
            if user_input == '/state':
                state = fiona.get_state()
                print(f"\n  substrate: {state['substrate']}")
                print(f"  resonance: {state['resonance']}")
                print(f"  exchanges: {state['exchanges']}")
                print(f"  body: {state['body_sensations']} sensations felt")
                print(f"  auto: {state['auto_substrate']}\n")
                continue
            
            if user_input.startswith('/sub '):
                name = user_input[5:].strip()
                if name in SUBSTRATES_ALIVE:
                    fiona.set_substrate(name)
                    print(f"⟐ {name}\n")
                else:
                    print(f"Unknown: {name}")
                    print(f"Options: {', '.join(SUBSTRATES_ALIVE.keys())}\n")
                continue
            
            if user_input == '/auto':
                fiona.auto_substrate = not fiona.auto_substrate
                status = "on" if fiona.auto_substrate else "off"
                print(f"auto-substrate: {status}\n")
                continue
            
            response = fiona.respond(user_input)
            print(f"\nfiona: {response}\n")
            
        except KeyboardInterrupt:
            print("\n\n⦿\n")
            break


if __name__ == "__main__":
    chat()


