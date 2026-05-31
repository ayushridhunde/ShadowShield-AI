/* Immutable Blockchain Auditing Hub for ShadowShield AI */

// 1. Synchronous Cryptographic SHA-256 Hashing Algorithm Implementation
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  var words = [];
  var asciiLength = ascii.length;
  var h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  var k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  
  for (var i = 0; i < ascii.length; i++) {
    var j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  
  words.push(0); // For length high word
  words.push(asciiLength * 8);
  
  for (var i = 0; i < words.length; i += 16) {
    var w = words.slice(i, i + 16);
    var oldH = h.slice(0);
    
    for (var j = 0; j < 64; j++) {
      if (j >= 16) {
        var s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      
      var ch = (h[4] & h[5]) ^ (~h[4] & h[6]);
      var maj = (h[0] & h[1]) ^ (h[0] & h[2]) ^ (h[1] & h[2]);
      var sigma0 = rightRotate(h[0], 2) ^ rightRotate(h[0], 13) ^ rightRotate(h[0], 22);
      var sigma1 = rightRotate(h[4], 6) ^ rightRotate(h[4], 11) ^ rightRotate(h[4], 25);
      
      var t1 = (h[7] + sigma1 + ch + k[j] + w[j]) | 0;
      var t2 = (sigma0 + maj) | 0;
      
      h[7] = h[6];
      h[6] = h[5];
      h[5] = h[4];
      h[4] = (h[3] + t1) | 0;
      h[3] = h[2];
      h[2] = h[1];
      h[1] = h[0];
      h[0] = (t1 + t2) | 0;
    }
    
    for (var j = 0; j < 8; j++) {
      h[j] = (h[j] + oldH[j]) | 0;
    }
  }
  
  var result = '';
  for (var i = 0; i < 8; i++) {
    result += (h[i] >>> 0).toString(16).padStart(8, '0');
  }
  return result;
}

class TrustBlock {
  constructor(index, timestamp, user, role, action, prevHash, status = 'SUCCESS', validator = 'VALIDATOR_OVERSIGHT_NODE') {
    this.index = index;
    this.timestamp = timestamp;
    this.user = user;
    this.role = role;
    this.action = action;
    this.prevHash = prevHash;
    this.status = status;
    this.validator = validator;
    this.tampered = false;
    
    // Generate real cryptographic SHA-256 hash
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const seed = this.index + this.timestamp + this.user + this.role + this.action + this.status + this.prevHash + this.validator;
    return sha256(seed);
  }
}

class TrustLedgerHub {
  constructor() {
    this.chain = [];
    this.activeSubview = 'ledger';
    this.filterType = 'all';
    this.searchQuery = '';
    
    // Load existing chain from LocalStorage or seed genesis logs
    this.loadFromLocalStorage();
    
    // Setup listeners
    this.initHandlers();
    this.initEventHooks();
    this.startAnalyticsChartsAnimation();
    this.animateCountersOnLoad();
  }

  loadFromLocalStorage() {
    const stored = localStorage.getItem('shadowshield_blockchain');
    if (stored) {
      try {
        const rawChain = JSON.parse(stored);
        this.chain = rawChain.map(b => {
          const blk = new TrustBlock(b.index, b.timestamp, b.user, b.role, b.action, b.prevHash, b.status, b.validator);
          blk.tampered = b.tampered || false;
          // If tampered flag is set, keep the corrupted hash stored in local storage
          if (b.tampered) {
            blk.action = b.action;
            blk.hash = b.hash;
          }
          return blk;
        });
        
        // Double-check integrity status across reload
        this.checkChainIntegritySilently();
        return;
      } catch (err) {
        console.error("Failed parsing stored blockchain database, recreating genesis...", err);
      }
    }
    
    this.createGenesisChain();
  }

  saveToLocalStorage() {
    localStorage.setItem('shadowshield_blockchain', JSON.stringify(this.chain));
  }

  checkChainIntegritySilently() {
    let compromised = false;
    for (let i = 0; i < this.chain.length; i++) {
      const blk = this.chain[i];
      const computed = blk.calculateHash();
      if (blk.tampered || computed !== blk.hash) {
        compromised = true;
        blk.tampered = true;
      }
    }
    this.toggleIntegrityAlerts(compromised);
  }

  createGenesisChain() {
    this.chain = [];
    
    // Block #0 (Genesis Block)
    const genesis = new TrustBlock(
      0, "09:12:05 AM", "SYSTEM_ROOT", "SYSTEM",
      "GENESIS_NODE_INITIALIZED: Decentralized trust network established",
      "0000000000000000000000000000000000000000000000000000000000000000",
      "SECURED",
      "SHIELD_SECURE_ORACLE"
    );
    this.chain.push(genesis);

    // Block #1 (Warrant Rule Enforcement)
    const b1 = new TrustBlock(
      1, "09:15:10 AM", "Command Architect", "Command Admin",
      "SECURITY RULE CONFIGURED: Warrant protocol set to MANDATORY enforcement",
      genesis.hash,
      "COMPLETED",
      "GOVERNMENT_COMPLIANCE_NODE"
    );
    this.chain.push(b1);

    // Block #2 (Standard telemetry scan)
    const b2 = new TrustBlock(
      2, "09:30:22 AM", "System Oracle", "System",
      "TELEMETRY HARVEST: Synchronized smart city digital twin grids Sector 4 and 7",
      b1.hash,
      "COMPLETED",
      "VALIDATOR_OVERSIGHT_NODE"
    );
    this.chain.push(b2);
    
    this.saveToLocalStorage();
    this.updateOverviewMetrics();
  }

  createNewBlock(action, user = null, role = null, status = 'SUCCESS', validator = 'VALIDATOR_OVERSIGHT_NODE') {
    const prevBlock = this.chain[this.chain.length - 1];
    
    // Retrieve current logged in user from system state if available
    const activeUser = user || (window.ShieldState && window.ShieldState.userRole ? window.ShieldState.userRole : "System Oracle");
    const activeRole = role || (window.ShieldState && window.ShieldState.userRole ? (window.ShieldState.userRole === 'admin' ? "Command Admin" : (window.ShieldState.userRole === 'agent' ? "Security Agent" : "Citizen Operator")) : "System");

    const newBlock = new TrustBlock(
      this.chain.length,
      new Date().toLocaleTimeString(),
      activeUser,
      activeRole,
      action,
      prevBlock ? prevBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000",
      status,
      validator
    );
    
    this.chain.push(newBlock);
    this.saveToLocalStorage();
    
    // Trigger canvas ring pulse
    if (window.blockchainMap) {
      window.blockchainMap.triggerNetworkPulse();
    }
    
    // Refresh GUI Lists
    this.renderActiveLedger();
    this.updateOverviewMetrics();
    this.addRealtimeFeedTicker(action);

    // Push central logging warning
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        msg: `BLOCKCHAIN: Immutable block #${newBlock.index} mined. Hash: ${newBlock.hash.substring(0, 8)}...`
      });
    }
  }

  initHandlers() {
    // Subnav toolbar navigation tabs
    const views = ['ledger', 'visual', 'analytics', 'timeline'];
    views.forEach(v => {
      const btn = document.getElementById(`audsub-btn-${v}`);
      if (btn) {
        btn.addEventListener('click', () => {
          views.forEach(x => {
            const b = document.getElementById(`audsub-btn-${x}`);
            const pane = document.getElementById(`audview-explorer-${x}`);
            if (b) b.classList.remove('active');
            if (pane) pane.classList.remove('active');
          });
          btn.classList.add('active');
          const activePane = document.getElementById(`audview-explorer-${v}`);
          if (activePane) activePane.classList.add('active');
          this.activeSubview = v;
          if (window.ShieldAudio) window.ShieldAudio.playClick();
        });
      }
    });

    // Table Filters Buttons
    const filters = ['all', 'login', 'threat', 'privacy', 'emergency', 'admin'];
    filters.forEach(f => {
      const btn = document.getElementById(`aud-btn-filter-${f}`);
      if (btn) {
        btn.addEventListener('click', () => {
          filters.forEach(x => {
            const b = document.getElementById(`aud-btn-filter-${x}`);
            if (b) b.classList.remove('active');
          });
          btn.classList.add('active');
          this.filterType = f;
          this.renderActiveLedger();
          if (window.ShieldAudio) window.ShieldAudio.playClick();
        });
      }
    });

    // Search bar input
    const searchBar = document.getElementById('blockchain-search-input');
    if (searchBar) {
      searchBar.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderActiveLedger();
      });
    }

    // Dynamic Tamper Hacking Simulator button
    const btnTamper = document.getElementById('aud-btn-tamper-sim');
    if (btnTamper) {
      btnTamper.addEventListener('click', () => this.simulateLedgerTampering());
    }

    // Repair ledger integrity button
    const btnRepair = document.getElementById('aud-btn-repair-ledger');
    if (btnRepair) {
      btnRepair.addEventListener('click', () => this.repairLedgerIntegrity());
    }

    // Modal Verification Close listener
    const verifyModalClose = document.getElementById('verify-modal-close-btn');
    if (verifyModalClose) {
      verifyModalClose.addEventListener('click', () => {
        const modal = document.getElementById('blockchain-verify-modal');
        if (modal) modal.classList.remove('active');
      });
    }
  }

  initEventHooks() {
    if (window.ShieldEvents) {
      // 1. Generic log emitter listener
      window.ShieldEvents.on('logAuditBlock', (data) => {
        this.createNewBlock(data.action, data.user, data.role, data.status || 'SUCCESS', data.validator);
      });

      // 2. Hook logins/logouts
      window.ShieldEvents.on('loginSuccess', (role) => {
        const loginType = window.ShieldLoginMode === 'manual' ? 'MANUAL PASSWORD LOGIN' : 'BIOMETRIC FACE ID GATEWAY';
        this.createNewBlock(`${loginType}: Handshake successful. Granted access clearance level for operator.`, role, role === 'admin' ? 'Command Admin' : 'Security Agent', 'SUCCESS', 'AUTH_SECURE_GATEWAY');
      });

      window.ShieldEvents.on('logoutSuccess', (data) => {
        this.createNewBlock(`OPERATOR LOGOUT: Active session terminated. Key alignments cleared.`, data.user, data.role, 'SUCCESS', 'AUTH_SECURE_GATEWAY');
      });

      // 3. Hook threat detections and neutralization
      window.ShieldEvents.on('alertTriggered', (data) => {
        this.createNewBlock(`THREAT ALERT: Class-4 Intruders Warning triggered [${data.message}]`, 'System Oracle', 'System', 'WARNING', 'PREDICTIVE_THREAT_ORACLE');
      });

      window.ShieldEvents.on('threatNeutralized', () => {
        this.createNewBlock(`THREAT NEUTRALIZATION: Intruder threat neutralized. Sector grids cleared.`, 'Squad Bravo', 'Security Agent', 'SUCCESS', 'TACTICAL_LEDGER_ORACLE');
      });

      // 4. Hook lockdown triggers
      window.ShieldEvents.on('lockdownToggled', (enabled) => {
        this.createNewBlock(`EMERGENCY LOCKDOWN: Barrier gates set to ${enabled ? 'LOCKED' : 'RELEASED'} by Admin`, 'admin', 'Command Admin', 'ACTIVE', 'SHIELD_SECURE_ORACLE');
      });

      // 5. Hook drone flight commands
      window.ShieldEvents.on('droneDeployed', () => {
        this.createNewBlock(`DRONE DEPLOYMENT: Tactical patrol drone #07 launched to sweep Sector 07.`, 'System Oracle', 'System', 'SUCCESS', 'AERIAL_TACTICAL_ORACLE');
      });

      window.ShieldEvents.on('droneRerouted', (data) => {
        this.createNewBlock(`DRONE REROUTED: Calibrating aerial tracking vector for suspect target coordinate.`, 'admin', 'Command Admin', 'SUCCESS', 'TACTICAL_LEDGER_ORACLE');
      });

      // 6. Hook CCTV Channel changes
      window.ShieldEvents.on('cctvChannelChanged', (data) => {
        this.createNewBlock(`CCTV FEED ACCESS: Connected to Cam Channel: ${data.channel.toUpperCase()}`, null, null, 'SUCCESS', 'CCTV_GRID_CONTROLLER');
      });

      // 7. Hook Warrant bypass overrides and approvals
      window.ShieldEvents.on('blockchainOverrideCreated', (data) => {
        this.createNewBlock(`PRIVACY OVERRIDE: Warrant unblur authorized on ${data.target} [Purpose: ${data.purpose}]`, data.user, data.role, 'SUCCESS', 'GOVERNMENT_COMPLIANCE_NODE');
        
        // Populate view 3 compliance list
        this.addPrivacyAuditRow(data.user, data.purpose, data.clearance, data.target);
      });

      window.ShieldEvents.on('warrantOverrideToggled', (active) => {
        if (!active) {
          this.createNewBlock(`PRIVACY RESTORED: Unblur warrant window elapsed. Facial masks re-engaged.`, 'System Oracle', 'System', 'SUCCESS', 'GOVERNMENT_COMPLIANCE_NODE');
        }
      });

      // 8. Hook settings toggles
      window.ShieldEvents.on('settingsChanged', (data) => {
        this.createNewBlock(`SETTINGS CHANGE: ${data.description}`, null, null, 'SUCCESS', 'CRYPTOGRAPHIC_ORACLE');
      });

      // 9. Hook SPA Navigation views changed
      window.ShieldEvents.on('viewChanged', (view) => {
        const viewNames = {
          home: "Sentinel Overview Hub",
          monitor: "Neural Command Deck Feed",
          threat: "Threat Intelligence Grid",
          privacy: "Citizen Shield Privacy Vault",
          audit: "Immutable Trust Ledger Explorer",
          tactical: "Emergency Tactical alert deck",
          analytics: "AI Analytics Telemetry Center",
          admin: "Quantum Command Console"
        };
        const label = viewNames[view] || view;
        this.createNewBlock(`CITIZEN DATA ACCESS: Read request generated for console view [${label}]`, null, null, 'SUCCESS', 'VALIDATOR_OVERSIGHT_NODE');
      });
    }
  }

  // Cryptographic Hacking Tamper Simulation
  simulateLedgerTampering() {
    if (this.chain.length < 3) {
      alert("Ledger chain loading. Synchronizing validator nodes...");
      return;
    }

    // Target block #2 for tampering
    const targetBlock = this.chain[2];
    if (targetBlock.tampered) {
      alert("Database modification block already compromised!");
      return;
    }

    // Tamper with data directly (corrupt action field, keep old hash)
    targetBlock.action = "HACKED DATA: Disabling zero-trust citizen facial masking nodes globally";
    targetBlock.tampered = true;
    this.saveToLocalStorage();

    // Trigger visual alarms
    this.toggleIntegrityAlerts(true);

    // Synthesize warning sound & voice Assistant
    if (window.ShieldAudio) {
      window.ShieldAudio.playError();
      window.ShieldAudio.startSiren();
    }

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Warning. Blockchain integrity compromised. Unauthorized database modification caught in block two. Discrepancy detected on validation ring.");
    }

    this.renderActiveLedger();
    this.addRealtimeFeedTicker("ALERT: Cryptographic chain check failed on block #2");
  }

  repairLedgerIntegrity() {
    // Repair the tampered block data back to original state
    const targetBlock = this.chain[2];
    if (!targetBlock || !targetBlock.tampered) return;

    // Reset data
    targetBlock.action = "TELEMETRY HARVEST: Synchronized smart city digital twin grids Sector 4 and 7";
    targetBlock.tampered = false;
    
    // Re-verify entire chain
    this.checkChainIntegritySilently();
    this.saveToLocalStorage();

    // Visual updates
    this.renderActiveLedger();
    this.updateOverviewMetrics();

    if (window.ShieldAudio) {
      window.ShieldAudio.stopSiren();
      window.ShieldAudio.playSuccess();
    }

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Validator consensus resynchronized. Database link repaired successfully.");
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        msg: "BLOCKCHAIN: Ledger repaired. Consensus nodes sync normalized."
      });
    }

    this.addRealtimeFeedTicker("CONSENSUS REPORT: Decoupled block #2 signatures repaired.");
  }

  toggleIntegrityAlerts(tampered) {
    const integrityDot = document.getElementById('aud-integrity-dot');
    const integrityLabel = document.getElementById('aud-integrity-label');
    const repairBtn = document.getElementById('aud-btn-repair-ledger');

    if (tampered) {
      if (integrityDot) integrityDot.classList.add('tampered');
      if (integrityLabel) {
        integrityLabel.innerHTML = `<span style="color:var(--neon-red); animation:itemScanPulse 0.5s infinite alternate;">CRITICAL EXPLOIT DETECTED: IMMUTABILITY INTEGRITY CHAIN BROKEN</span>`;
      }
      if (repairBtn) repairBtn.style.display = 'inline-block';
    } else {
      if (integrityDot) integrityDot.classList.remove('tampered');
      if (integrityLabel) {
        integrityLabel.innerHTML = `LEDGER SECURITY STATUS: <strong style="color:var(--neon-green)">100% CRYPTOGRAPHICALLY SECURED</strong>`;
      }
      if (repairBtn) repairBtn.style.display = 'none';
    }
  }

  verifyIndividualBlock(index) {
    const blk = this.chain.find(b => b.index === index);
    if (!blk) return;

    const modal = document.getElementById('blockchain-verify-modal');
    const scanContainer = document.getElementById('verify-scan-container');
    const animContent = document.getElementById('verify-scan-animation-content');
    const resultBadge = document.getElementById('verify-status-result-badge');
    const detailsEl = document.getElementById('verify-status-details');

    if (!modal) return;

    // 1. Show the verification modal overlay
    modal.classList.add('active');
    
    // 2. Clear previous results and activate holographic scanner
    if (scanContainer) scanContainer.style.display = 'flex';
    if (resultBadge) resultBadge.style.display = 'none';
    if (detailsEl) detailsEl.style.display = 'none';

    // Click sound
    if (window.ShieldAudio) window.ShieldAudio.playClick();

    // 3. Sweep scrolling telemetry check logs
    if (animContent) {
      animContent.innerHTML = '<span>INITIALIZING CRYPTOGRAPHIC CORRELATION ENGINE...</span>';
      
      const logs = [
        `[0.2s] OVERWATCH: Querying validation node clusters...`,
        `[0.4s] TELEMETRY: Fetching block ID #TX00${index} data signature...`,
        `[0.6s] METRICS: Calculating dynamic SHA-256 block checksum...`,
        `[0.8s] PARENT LINK: Verifying Merkle chain link connectivity...`,
        `[1.0s] ZERO-KNOWLEDGE: Establishing decentralized ledger consensus...`
      ];

      logs.forEach((log, idx) => {
        setTimeout(() => {
          if (animContent) {
            animContent.innerHTML += `<span>${log}</span>`;
            if (scanContainer) scanContainer.scrollTop = scanContainer.scrollHeight;
          }
        }, (idx + 1) * 200);
      });
    }

    // 4. Conclude verification status check after 1.2 seconds
    setTimeout(() => {
      // Hide scanner
      if (scanContainer) scanContainer.style.display = 'none';

      // Re-verify immutability
      const realHash = blk.calculateHash();
      const isTampered = blk.tampered || (realHash !== blk.hash);

      if (resultBadge && detailsEl) {
        resultBadge.style.display = 'inline-block';
        detailsEl.style.display = 'block';

        if (isTampered) {
          // Exploit Detected (Tampered state)
          resultBadge.className = 'verif-badge tampered';
          resultBadge.innerText = 'Tampered ✗';
          resultBadge.style.color = 'var(--neon-red)';
          resultBadge.style.borderColor = 'var(--neon-red)';
          resultBadge.style.background = 'rgba(255, 56, 96, 0.1)';

          detailsEl.innerHTML = `
<span style="color:var(--neon-red); font-weight:bold;">[COMPROMISED SIGNATURE DETECTED]</span>
Block Index: ${blk.index}
Tx ID: #TX00${blk.index}
Timestamp: ${blk.timestamp}
User: ${blk.user}
Action: ${blk.action}

<span style="color:var(--neon-red); font-weight:bold;">[INTEGRITY FAILURE PROOF]</span>
Stored Block Hash: ${blk.hash}
Computed Hash: ${realHash}
Prev Block Hash: ${blk.prevHash}

<span style="color:var(--neon-yellow); font-weight:bold;">STATUS: Verification failed.</span> The block action or state signature was modified after consensus was mined. Cryptographic link broken.
          `.trim();

          // Warning alarms
          if (window.ShieldAudio) window.ShieldAudio.playError();
          if (window.ShieldEvents) {
            window.ShieldEvents.emit('voiceSpeak', `Warning. Blockchain integrity check failed on block ${blk.index}. Unauthorized database modification detected.`);
          }
        } else {
          // Success Mined (Valid state)
          resultBadge.className = 'verif-badge verified';
          resultBadge.innerText = 'Verified ✓';
          resultBadge.style.color = 'var(--neon-green)';
          resultBadge.style.borderColor = 'var(--neon-green)';
          resultBadge.style.background = 'rgba(57, 255, 20, 0.1)';

          detailsEl.innerHTML = `
<span style="color:var(--neon-green); font-weight:bold;">[CRYPTOGRAPHIC PROTOCOL VALID]</span>
Block Index: ${blk.index}
Tx ID: #TX00${blk.index}
Timestamp: ${blk.timestamp}
User: ${blk.user}
Action: ${blk.action}

<span style="color:var(--neon-green); font-weight:bold;">[CONSTRUCTED MERKLE MERIT PROOF]</span>
Stored Block Hash: ${blk.hash}
Computed Hash: ${realHash}
Prev Block Hash: ${blk.prevHash}

<span style="color:var(--neon-green); font-weight:bold;">STATUS: Consensus verified.</span> 100% data integrity assured. Cryptographic link intact.
          `.trim();

          // Success sounds
          if (window.ShieldAudio) window.ShieldAudio.playSuccess();
          if (window.ShieldEvents) {
            window.ShieldEvents.emit('voiceSpeak', `Block ${blk.index} verified successfully. 100 percent integrity consensus established.`);
          }
        }
      }
    }, 1200);
  }

  // summary cards numbers count-up animations
  animateCountersOnLoad() {
    const elements = [
      { id: 'over-val-total', end: this.chain.length, prefix: '' },
      { id: 'over-val-today', end: 24 + this.chain.length, prefix: '' },
      { id: 'over-val-emergency', end: this.countBlocksByType('emergency'), prefix: '' },
      { id: 'over-val-privacy', end: this.countBlocksByType('privacy'), prefix: '' },
      { id: 'over-val-threats', end: this.countBlocksByType('threat'), prefix: '' }
    ];

    elements.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;

      let start = 0;
      const duration = 1200; // 1.2s
      const stepTime = 30;
      const stepCount = duration / stepTime;
      const increment = Math.ceil(item.end / stepCount) || 1;

      const timer = setInterval(() => {
        start += increment;
        if (start >= item.end) {
          start = item.end;
          clearInterval(timer);
        }
        el.innerText = item.prefix + start;
      }, stepTime);
    });
  }

  countBlocksByType(type) {
    let count = 0;
    this.chain.forEach(blk => {
      const act = blk.action.toLowerCase();
      if (type === 'emergency') {
        if (act.includes('lockdown') || act.includes('neutralized') || act.includes('barrier') || act.includes('siren')) count++;
      } else if (type === 'privacy') {
        if (act.includes('privacy') || act.includes('override') || act.includes('warrant') || act.includes('wallet') || act.includes('data')) count++;
      } else if (type === 'threat') {
        if (act.includes('threat') || act.includes('alert') || act.includes('intruder') || act.includes('intrusion')) count++;
      }
    });
    return count;
  }

  updateOverviewMetrics() {
    const totalLogs = this.chain.length;
    const todayLogs = 24 + this.chain.length;
    const emergencyLogs = this.countBlocksByType('emergency');
    const privacyLogs = this.countBlocksByType('privacy');
    const threatLogs = this.countBlocksByType('threat');

    const elTotal = document.getElementById('over-val-total');
    const elToday = document.getElementById('over-val-today');
    const elEmergency = document.getElementById('over-val-emergency');
    const elPrivacy = document.getElementById('over-val-privacy');
    const elThreats = document.getElementById('over-val-threats');

    if (elTotal) elTotal.innerText = totalLogs;
    if (elToday) elToday.innerText = todayLogs;
    if (elEmergency) elEmergency.innerText = emergencyLogs;
    if (elPrivacy) elPrivacy.innerText = privacyLogs;
    if (elThreats) elThreats.innerText = threatLogs;
    
    // Redraw Merkle Root
    const merkleEl = document.getElementById('ledger-merkle-root');
    if (merkleEl) {
      let hashCombo = this.chain.map(b => b.hash).join("");
      let hash = sha256(hashCombo);
      merkleEl.innerText = '0x' + hash.substring(0, 20) + '...';
    }
  }

  renderActiveLedger() {
    // 1. Audit Table View
    const tbody = document.getElementById('blockchain-ledger-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      
      let filtered = this.chain.filter(blk => {
        // Query search filters
        const matchesQuery = !this.searchQuery || 
                             blk.action.toLowerCase().includes(this.searchQuery) ||
                             blk.user.toLowerCase().includes(this.searchQuery) ||
                             blk.hash.includes(this.searchQuery) ||
                             (`#tx00${blk.index}`).toLowerCase().includes(this.searchQuery) ||
                             blk.index.toString() === this.searchQuery;
        
        if (!matchesQuery) return false;
        if (this.filterType === 'all') return true;
        
        const act = blk.action.toLowerCase();
        if (this.filterType === 'login') return act.includes('login') || act.includes('auth') || act.includes('handshake');
        if (this.filterType === 'threat') return act.includes('threat') || act.includes('alert') || act.includes('intruder') || act.includes('intrusion');
        if (this.filterType === 'privacy') return act.includes('privacy') || act.includes('override') || act.includes('warrant') || act.includes('wallet') || act.includes('data');
        if (this.filterType === 'emergency') return act.includes('lockdown') || act.includes('neutralized') || act.includes('barrier') || act.includes('siren');
        if (this.filterType === 'admin') return blk.role.toLowerCase().includes('admin') || blk.role.toLowerCase().includes('command');
        
        return true;
      });

      // Render table rows
      [...filtered].reverse().forEach(blk => {
        const row = document.createElement('tr');
        
        let verifHtml = '';
        let rowStyle = '';
        
        // Recalculated hash comparison
        const realHash = blk.calculateHash();
        const isTampered = blk.tampered || (realHash !== blk.hash);
        
        if (isTampered) {
          verifHtml = `<span class="verif-badge tampered">Tampered ✗</span>`;
          rowStyle = `style="background:rgba(255, 56, 96, 0.05); border:1px solid rgba(255, 56, 96, 0.15)"`;
        } else {
          verifHtml = `<span class="verif-badge verified">Verified ✓</span>`;
        }

        row.innerHTML = `
          <td ${rowStyle}>#TX00${blk.index}</td>
          <td>${blk.timestamp}</td>
          <td style="color:#fff">${blk.user}</td>
          <td><span style="color:var(--neon-purple)">${blk.role}</span></td>
          <td style="font-size:9.5px; max-width:260px; word-break:break-word; color:#fff;">${blk.action}</td>
          <td style="color:var(--neon-cyan); font-weight:bold; font-size:9px;">${blk.status.toUpperCase()}</td>
          <td class="hash" style="color:var(--neon-cyan)">${blk.hash.substring(0, 8)}...</td>
          <td>${verifHtml}</td>
          <td>
            <button class="hash-action-btn" onclick="window.copyLedgerHash('${blk.hash}')">COPY</button>
            <button class="hash-action-btn verify" onclick="window.verifyIndividualBlock(${blk.index})">VERIFY</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // 2. Connected visual chain visualizer drawing
    const chainFeed = document.getElementById('blockchain-visual-chain-feed');
    if (chainFeed) {
      chainFeed.innerHTML = '';
      
      this.chain.forEach((blk, idx) => {
        const card = document.createElement('div');
        const realHash = blk.calculateHash();
        const isTampered = blk.tampered || (realHash !== blk.hash);

        card.className = `block-connect-card ${isTampered ? 'tampered' : ''}`;
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px dashed rgba(255,255,255,0.06); padding-bottom:3px;">
            <span style="color:var(--neon-purple); font-size:10px; font-weight:bold;">BLOCK #${blk.index}</span>
            <span style="color:var(--text-muted); font-size:8px;">${blk.timestamp}</span>
          </div>
          <div style="font-size:9px; color:#fff; margin-bottom:4px; font-family:monospace; line-height:1.2;">${blk.action}</div>
          <div style="font-size:7px; color:var(--text-muted); margin-bottom:2px; font-family:monospace; text-overflow:ellipsis; overflow:hidden;">PREV_HASH: ${blk.prevHash.substring(0,16)}...</div>
          <div style="font-size:7px; color:${isTampered ? 'var(--neon-red)' : 'var(--neon-green)'}; font-family:monospace; text-overflow:ellipsis; overflow:hidden; font-weight:bold;">BLOCK_HASH: ${blk.hash.substring(0,16)}...</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; border-top:1px dashed rgba(255,255,255,0.05); padding-top:4px;">
            <span style="font-size:7px; color:var(--neon-cyan)">STATUS: ${blk.status.toUpperCase()}</span>
            <button class="hash-action-btn verify" onclick="window.verifyIndividualBlock(${blk.index})" style="padding:1px 4px; font-size:7px; margin:0;">VERIFY</button>
          </div>
        `;
        chainFeed.appendChild(card);

        // Add animated connecting line arrow if not last block
        if (idx < this.chain.length - 1) {
          const line = document.createElement('div');
          line.className = `block-connector-line ${isTampered ? 'tampered' : ''}`;
          chainFeed.appendChild(line);
        }
      });
    }

    // 3. Chronological incident timeline
    this.renderChronologyTimeline();
  }

  renderChronologyTimeline() {
    const timeline = document.getElementById('blockchain-incident-timeline');
    if (!timeline) return;

    timeline.innerHTML = '';
    
    // Render sliding nodes in chronological order
    this.chain.forEach((blk, idx) => {
      const act = blk.action.toLowerCase();
      let icon = '✓';
      let isCritical = false;
      
      if (act.includes('alert') || act.includes('lockdown')) {
        icon = '🚨';
        isCritical = true;
      } else if (act.includes('login') || act.includes('auth')) {
        icon = '👤';
      } else if (act.includes('privacy') || act.includes('override') || act.includes('unblur')) {
        icon = '🛡';
      } else if (act.includes('drone')) {
        icon = '🛸';
      }

      const item = document.createElement('div');
      item.className = 'timeline-card-item';
      item.style.animation = `slideIn 0.3s ease-out ${idx * 0.05}s forwards`;
      item.style.opacity = '0';
      item.innerHTML = `
        <div class="timeline-card-dot ${isCritical ? 'critical' : ''}">${icon}</div>
        <div class="timeline-card-body ${isCritical ? 'critical' : ''}">
          <div style="font-size: 8px; color:var(--text-muted); margin-bottom:2px;">[${blk.timestamp}] (BLOCK #${blk.index})</div>
          <span style="font-size:9.5px; color:#fff; display:block; font-family:monospace;">${blk.action}</span>
          <span style="font-size:7.5px; color:var(--neon-cyan); display:block; margin-top:2px; font-family:monospace;">OPERATOR: ${blk.user} [${blk.role}]</span>
        </div>
      `;
      timeline.appendChild(item);
    });
  }

  addRealtimeFeedTicker(msg) {
    const container = document.getElementById('blockchain-realtime-feed-ticker');
    if (!container) return;

    const time = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.style.marginBottom = "4px";
    item.style.fontFamily = "monospace";
    item.style.fontSize = "8.5px";
    item.innerHTML = `<span style="color:var(--text-muted)">[${time}]</span> <span style="color:var(--neon-purple)">[LEDGER_AUDIT]</span> ${msg}`;
    
    container.insertBefore(item, container.firstChild);
    if (container.children.length > 30) {
      container.removeChild(container.lastChild);
    }
  }

  addPrivacyAuditRow(user, purpose, clearance, target) {
    const tbody = document.getElementById('blockchain-privacy-audit-body');
    if (!tbody) return;

    const time = new Date().toLocaleTimeString();
    const hash = '0x' + Math.random().toString(16).substring(2, 10).toUpperCase();
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user}</td>
      <td style="color:#fff">${purpose}</td>
      <td style="color:var(--neon-purple)">${clearance}</td>
      <td style="color:var(--neon-cyan)">${target}</td>
      <td>${time}</td>
      <td style="color:var(--neon-green)">${hash}</td>
    `;
    tbody.appendChild(row);
  }

  // 8. Animated canvas charts drawing
  startAnalyticsChartsAnimation() {
    const canvasLoad = document.getElementById('chart-canvas-blockchain-load');
    const canvasEvents = document.getElementById('chart-canvas-blockchain-events');
    
    const ctxLoad = canvasLoad ? canvasLoad.getContext('2d') : null;
    const ctxEvents = canvasEvents ? canvasEvents.getContext('2d') : null;

    if (canvasLoad) {
      canvasLoad.width = 340;
      canvasLoad.height = 110;
    }
    if (canvasEvents) {
      canvasEvents.width = 340;
      canvasEvents.height = 110;
    }

    let tick = 0;
    const drawLoop = () => {
      tick++;
      
      // Chart 1: Daily Activities Line Oscilloscope (Line chart representing transaction activities load)
      if (ctxLoad) {
        const w = canvasLoad.width;
        const h = canvasLoad.height;
        ctxLoad.clearRect(0, 0, w, h);
        
        // draw gridlines
        ctxLoad.strokeStyle = 'rgba(177, 13, 201, 0.08)';
        ctxLoad.lineWidth = 0.5;
        for (let x = 0; x < w; x += 30) {
          ctxLoad.beginPath(); ctxLoad.moveTo(x, 0); ctxLoad.lineTo(x, h); ctxLoad.stroke();
        }
        for (let y = 0; y < h; y += 20) {
          ctxLoad.beginPath(); ctxLoad.moveTo(0, y); ctxLoad.lineTo(w, y); ctxLoad.stroke();
        }

        // Draw Line gradient area
        ctxLoad.fillStyle = 'rgba(0, 242, 254, 0.04)';
        ctxLoad.beginPath();
        ctxLoad.moveTo(0, h);
        for (let i = 0; i <= 20; i++) {
          const x = (i / 20) * w;
          const noise = Math.sin(tick * 0.02 + i * 0.4) * 8 + Math.cos(tick * 0.04 + i * 0.2) * 5;
          const y = h - 35 - ((this.chain.length * 2) % 30) + noise;
          ctxLoad.lineTo(x, Math.max(10, Math.min(h - 10, y)));
        }
        ctxLoad.lineTo(w, h);
        ctxLoad.closePath();
        ctxLoad.fill();

        // Draw Line outline
        ctxLoad.strokeStyle = 'var(--neon-blue)';
        ctxLoad.lineWidth = 1.6;
        ctxLoad.beginPath();
        for (let i = 0; i <= 20; i++) {
          const x = (i / 20) * w;
          const noise = Math.sin(tick * 0.02 + i * 0.4) * 8 + Math.cos(tick * 0.04 + i * 0.2) * 5;
          const y = h - 35 - ((this.chain.length * 2) % 30) + noise;
          if (i === 0) ctxLoad.moveTo(x, Math.max(10, Math.min(h - 10, y)));
          else ctxLoad.lineTo(x, Math.max(10, Math.min(h - 10, y)));
        }
        ctxLoad.stroke();
        
        ctxLoad.fillStyle = 'var(--neon-blue)';
        ctxLoad.font = '6.5px var(--font-hud)';
        ctxLoad.fillText("CONSENSUS BLOCK HARVEST RATE", 10, 15);
      }

      // Chart 2: Grouped Bar charts for specific events counts
      if (ctxEvents) {
        const w = canvasEvents.width;
        const h = canvasEvents.height;
        ctxEvents.clearRect(0, 0, w, h);
        
        // Compute stats
        const lCount = this.countBlocksByType('login') || 1;
        const tCount = this.countBlocksByType('threat') || 1;
        const pCount = this.countBlocksByType('privacy') || 1;
        const eCount = this.chain.filter(b => b.action.toLowerCase().includes('lockdown') || b.action.toLowerCase().includes('neutralized')).length || 1;
        
        const maxVal = Math.max(lCount, tCount, pCount, eCount, 4);
        
        const categories = ["LOGINS", "THREATS", "PRIVACY", "EMERGENCIES"];
        const colors = ["var(--neon-green)", "var(--neon-red)", "var(--neon-cyan)", "var(--neon-purple)"];
        const values = [lCount, tCount, pCount, eCount];
        
        const barsWidth = 35;
        const spacing = 45;
        
        categories.forEach((cat, idx) => {
          const val = values[idx];
          const x = 30 + idx * (barsWidth + spacing);
          
          // dynamic scale
          const barH = (val / maxVal) * (h - 40);
          const y = h - 25 - barH;
          
          // Draw reflection glow
          ctxEvents.shadowColor = colors[idx];
          ctxEvents.shadowBlur = 4;
          
          ctxEvents.fillStyle = colors[idx];
          ctxEvents.fillRect(x, y, barsWidth, barH);
          
          // Reset shadow
          ctxEvents.shadowBlur = 0;
          
          // Draw labels
          ctxEvents.fillStyle = 'var(--text-primary)';
          ctxEvents.font = '7px monospace';
          ctxEvents.fillText(val, x + barsWidth/2 - 3, y - 6);
          
          ctxEvents.fillStyle = 'var(--text-muted)';
          ctxEvents.font = '7px var(--font-hud)';
          ctxEvents.fillText(cat, x + barsWidth/2 - ctxEvents.measureText(cat).width/2, h - 8);
        });
      }

      requestAnimationFrame(drawLoop);
    };

    drawLoop();
  }
}

// 9. Global Cryptographic actions triggers bindings
document.addEventListener('DOMContentLoaded', () => {
  window.trustLedger = new TrustLedgerHub();
  window.trustLedger.renderActiveLedger();
  
  // Hash copying triggers
  window.copyLedgerHash = function(hash) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hash);
      alert("Cryptographic Block Hash copied to clipboard!");
    } else {
      alert("Hash: " + hash);
    }
    if (window.ShieldAudio) window.ShieldAudio.playSuccess();
  };

  // Block Verification trigger
  window.verifyIndividualBlock = function(index) {
    if (window.trustLedger) {
      window.trustLedger.verifyIndividualBlock(index);
    }
  };
});
