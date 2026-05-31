/* AI Voice Assistant & Speech Synthesis for ShadowShield AI */

class ShieldAudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.sirenInterval = null;
    this.scanOsc = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
    } catch (e) {
      console.warn("Web Audio API is not supported or blocked:", e);
    }
  }

  playTone(freq, duration, type = 'sine', volume = 0.1) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Error playing tone:", e);
    }
  }

  playClick() {
    this.playTone(1800, 0.08, 'sine', 0.05);
  }

  playSuccess() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(523.25, 0.2, 'sine', 0.08); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.08), 80); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine', 0.08), 160); // G5
  }

  playError() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(180, 0.2, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(150, 0.25, 'sawtooth', 0.15), 150);
  }

  startSiren() {
    if (!this.enabled || !this.ctx || this.sirenInterval) return;
    this.sirenInterval = setInterval(() => {
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.4);
        osc.frequency.linearRampToValueAtTime(600, now + 0.8);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.8);
      } catch (e) {
        console.warn("Siren synthesis failed:", e);
      }
    }, 800);
  }

  stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  startScanHum() {
    if (!this.enabled || !this.ctx || this.scanOsc) return;
    try {
      const now = this.ctx.currentTime;
      this.scanOsc = this.ctx.createOscillator();
      this.scanGain = this.ctx.createGain();
      
      this.scanOsc.type = 'triangle';
      this.scanOsc.frequency.setValueAtTime(120, now);
      
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 15;
      
      lfo.connect(lfoGain);
      lfoGain.connect(this.scanOsc.frequency);
      
      this.scanGain.gain.setValueAtTime(0.08, now);
      
      this.scanOsc.connect(this.scanGain);
      this.scanGain.connect(this.ctx.destination);
      
      lfo.start();
      this.scanOsc.start();
      this.scanOscLfo = lfo;
    } catch (e) {
      console.warn("Scan hum play failed:", e);
    }
  }

  stopScanHum() {
    if (this.scanOsc) {
      try {
        this.scanOsc.stop();
        this.scanOsc.disconnect();
        this.scanGain.disconnect();
        if (this.scanOscLfo) {
          this.scanOscLfo.stop();
          this.scanOscLfo.disconnect();
        }
      } catch (e) {}
      this.scanOsc = null;
      this.scanGain = null;
      this.scanOscLfo = null;
    }
  }
}
window.ShieldAudio = new ShieldAudioSynth();

class ShieldVoiceAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.enabled = true;
    
    this.initVoice();
    this.setupListeners();
  }

  initVoice() {
    if (!this.synth) {
      console.warn("Speech Synthesis is not supported in this browser.");
      return;
    }

    const setBestVoice = () => {
      try {
        const voices = this.synth.getVoices();
        if (!voices || voices.length === 0) return;
        
        // Select the best clean, premium digital/assistant voice
        this.voice = voices.find(v => 
          v.name.includes("Google US English") || 
          v.name.includes("Microsoft Zira") || 
          v.name.includes("Hazel") ||
          v.name.includes("Natural") || 
          v.lang === "en-US" || 
          v.lang === "en-GB"
        ) || voices[0];
      } catch (err) {
        console.warn("Error retrieving synthesis voices:", err);
      }
    };

    try {
      setBestVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = setBestVoice;
      }
    } catch (err) {
      console.warn("Error binding voice change events:", err);
    }
  }

  speak(text) {
    if (!this.enabled || !this.synth) return;
    
    try {
      // Wake up synthesis engine in Chromium
      if (this.synth.paused) {
        this.synth.resume();
      }
      
      // Stop any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Prevent Chromium Garbage Collection bug which silences the speech engine
      if (!window._activeUtterances) {
        window._activeUtterances = [];
      }
      window._activeUtterances.push(utterance);

      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      // Adjust pitch, rate, and volume to sound highly futuristic, digital and clear
      utterance.pitch = 0.98;
      utterance.rate = 1.12; // Hyper high-tech assistant speech rate
      utterance.volume = 1.0; // Ensure full audibility

      const equalizer = document.getElementById('voice-equalizer');
      const orb = document.getElementById('jarvis-voice-orb-container');
      
      utterance.onstart = () => {
        if (equalizer) equalizer.classList.add('speaking');
        if (orb) orb.classList.add('speaking');
      };

      utterance.onend = () => {
        // Clean up from active reference list
        window._activeUtterances = window._activeUtterances.filter(u => u !== utterance);
        if (equalizer) equalizer.classList.remove('speaking');
        if (orb) orb.classList.remove('speaking');
      };

      utterance.onerror = () => {
        window._activeUtterances = window._activeUtterances.filter(u => u !== utterance);
        if (equalizer) equalizer.classList.remove('speaking');
        if (orb) orb.classList.remove('speaking');
      };

      // Force resume right before trigger speak
      this.synth.resume();
      this.synth.speak(utterance);
    } catch (err) {
      console.warn("Speech Synthesis speak error (likely user activation policy):", err);
      const equalizer = document.getElementById('voice-equalizer');
      const orb = document.getElementById('jarvis-voice-orb-container');
      if (equalizer) equalizer.classList.remove('speaking');
      if (orb) orb.classList.remove('speaking');
    }
  }

  setupListeners() {
    // Hooks from events
    window.ShieldEvents.on('voiceSpeak', (text) => {
      this.speak(text);
    });
    window.ShieldEvents.on('viewChanged', (view) => {
      // Play click sound on navigation
      if (window.ShieldAudio) window.ShieldAudio.playClick();

      const role = window.ShieldState ? window.ShieldState.userRole : 'citizen';
      
      // If citizen tries to access administrative pages
      if (role === 'citizen' && ['monitor', 'threat', 'admin', 'tactical', 'analytics'].includes(view)) {
        const lockedAnnouncements = {
          monitor: "Access denied. High-security command feeds are blocked for civil clearance levels.",
          threat: "Access intercept. AI object classification terminal requires active authority keys.",
          admin: "Security block. Government administrative console restricted to active command staff.",
          tactical: "Security block. Tactical emergency controls locked out for citizen status.",
          analytics: "Access intercept. Smart city data logs restricted to security operators."
        };
        this.speak(lockedAnnouncements[view]);
        return;
      }
      
      const announcements = {
        home: "Returning to city overview grid. All core shields synchronized.",
        monitor: "Entering neural command center. Surveillance cameras online. Anonymization matrix active.",
        threat: "Accessing artificial intelligence threat classification terminal.",
        privacy: "Opening decentralized citizen anonymity portal and trust metric log.",
        audit: "Retrieving decentralized audit ledger. Synchronizing blockchain blocks.",
        admin: "Welcome back, Administrator. Full command deck and emergency controls online.",
        tactical: "Entering emergency tactical deck. Active target coordinates locked. AI response checklist initiated.",
        analytics: "Accessing AI predictive analytics grid and tactical drone deployment hub."
      };
      
      const text = announcements[view];
      if (text) {
        this.speak(text);
      }
    });

    window.ShieldEvents.on('intrusionAlert', (data) => {
      if (window.ShieldAudio) window.ShieldAudio.playError();
      this.speak(`Warning. Suspicious intrusion signature detected on ${data.cam}. Initiating sector check.`);
    });

    window.ShieldEvents.on('alertTriggered', (data) => {
      if (window.ShieldAudio) {
        window.ShieldAudio.playError();
        window.ShieldAudio.startSiren();
      }
      this.speak("Warning. Critical Threat Detected. Emergency Tactical Mode Activated. Deploying Sector Seven Response Protocol.");
    });

    window.ShieldEvents.on('lockdownToggled', (enabled) => {
      if (enabled) {
        if (window.ShieldAudio) window.ShieldAudio.startSiren();
        this.speak("Emergency Protocol Engaged: All local shields locked down. Global civilian anonymization forced active.");
      } else {
        if (window.ShieldAudio) {
          window.ShieldAudio.stopSiren();
          window.ShieldAudio.playSuccess();
        }
        this.speak("Security Override: Emergency lockdown deactivated. Restoring normal municipal security levels.");
      }
    });

    window.ShieldEvents.on('warrantOverrideToggled', (active) => {
      if (active) {
        if (window.ShieldAudio) window.ShieldAudio.playSuccess();
        this.speak("Warrant bypass authorized. Decrypting privacy shields on camera one. Access logged on chain.");
      } else {
        if (window.ShieldAudio) window.ShieldAudio.playError();
        this.speak("Bypass window elapsed. Anonymity shields fully restored on camera one.");
      }
    });  }

  toggleVoice(enabled) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.voiceAssistant = new ShieldVoiceAssistant();

  // Voice Query button hooks
  const askAiBtn = document.getElementById('ask-shield-ai-btn');
  if (askAiBtn) {
    askAiBtn.addEventListener('click', () => {
      window.voiceAssistant.speak(generateSystemRecommendation());
    });
  }

  // JARVIS Voice Orb click hook
  const jarvisOrb = document.getElementById('jarvis-voice-orb-container');
  if (jarvisOrb) {
    jarvisOrb.addEventListener('click', () => {
      if (window.ShieldAudio) window.ShieldAudio.playClick();
      window.voiceAssistant.speak(generateSystemRecommendation());
    });
  }
});

function generateSystemRecommendation() {
  const isLockdown = window.ShieldState.lockdownEnabled;
  const privacyScore = window.citizenPortal ? window.citizenPortal.privacyScore : 98;
  const threats = window.ShieldState.systemStatus === 'THREAT_ALERT';

  if (isLockdown) {
    return "Emergency lockdown is active. All bypass authorization routes are locked out. Recommendation: Monitor validator nodes blockchain secure log and verify system diagnostics parameters.";
  }
  
  if (threats) {
    return "Critical threat alert in metro station corridor. Bounding locks locked. Recommendation: Deploy drone units and dispatch security response squad immediately.";
  }

  if (privacyScore >= 80) {
    return `System security is stable. Citizen privacy matrix is operating at ${privacyScore} percent trust. Zero trust feeds are secure. No critical actions required.`;
  } else {
    return `Warning. Citizen trust score has decreased to ${privacyScore} percent. Recommend enforcing warrant protocol check inside your privacy settings configuration.`;
  }
}
