/* Threat Radar and Incident Response Timeline Module for ShadowShield AI */

class ThreatRadar {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width = 220;
    this.height = this.canvas.height = 220;
    this.radius = this.width / 2;
    this.angle = 0;
    this.blips = [];
    
    // Spawn initial static radar blips
    this.blips.push({ x: 45, y: -50, opacity: 1, type: 'normal' });
    this.blips.push({ x: -60, y: 30, opacity: 0.6, type: 'restricted' });
    this.blips.push({ x: 20, y: 70, opacity: 0.4, type: 'normal' });
    
    this.startRadar();
  }

  addDynamicBlip(type = 'normal') {
    const r = Math.random() * (this.radius - 30) + 10;
    const a = Math.random() * Math.PI * 2;
    this.blips.push({
      x: r * Math.cos(a),
      y: r * Math.sin(a),
      opacity: 1,
      type: type
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.radius, this.radius);

    // Draw grid rings
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 30; r < this.radius; r += 30) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(-this.radius, 0);
    ctx.lineTo(this.radius, 0);
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(0, this.radius);
    ctx.stroke();

    // Draw radar sweep line with gradient tail
    ctx.save();
    ctx.rotate(this.angle);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
    grad.addColorStop(0.8, 'rgba(0, 242, 254, 0.05)');
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.radius, -0.2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'var(--neon-blue)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.radius, 0);
    ctx.stroke();
    ctx.restore();

    // Draw blips
    this.blips.forEach((blip, index) => {
      // Fade blip over time
      blip.opacity -= 0.003;
      if (blip.opacity <= 0) {
        this.blips.splice(index, 1);
        return;
      }
      
      const blipSize = blip.type === 'restricted' ? 6 : 4;
      ctx.fillStyle = blip.type === 'restricted' ? 'var(--neon-red)' : 'var(--neon-blue)';
      ctx.shadowColor = blip.type === 'restricted' ? 'var(--neon-red)' : 'var(--neon-blue)';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.arc(blip.x, blip.y, blipSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0; // reset
    });

    ctx.restore();
    
    // Increment angle
    this.angle += 0.015;
    if (this.angle > Math.PI * 2) {
      this.angle = 0;
      this.addDynamicBlip(Math.random() > 0.7 ? 'restricted' : 'normal');
    }
  }

  startRadar() {
    const animate = () => {
      this.draw();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// 2. High-Tech SOC Threat Intelligence Grid Module
class ThreatIntelligenceGrid {
  constructor() {
    this.activeCam = 'cam01';
    this.threatLevel = 1; // 1 to 5
    this.activeThreatsCount = 0;
    this.emergencyCount = 0;
    this.animTick = 0;
    this.lastPing = null;
    this.executedActions = new Set();
    
    // CCTV feed variables
    this.camCanvas = document.getElementById('threat-grid-camera-canvas');
    this.camCtx = this.camCanvas ? this.camCanvas.getContext('2d') : null;
    
    // Heatmap variables
    this.heatmapCanvas = document.getElementById('threat-grid-heatmap-canvas');
    this.heatmapCtx = this.heatmapCanvas ? this.heatmapCanvas.getContext('2d') : null;
    
    // Incident storage database
    this.incidents = [];
    this.timeline = [];
    
    // Track targets positions in heatmap
    this.targets = [
      { id: 'T-800', x: 120, y: 80, vx: 0.5, vy: 0.3, type: 'suspect', trail: [] },
      { id: 'DRONE-07', x: 200, y: 150, vx: -0.4, vy: 0.2, type: 'drone', trail: [] },
      { id: 'SQUAD-B', x: 80, y: 220, vx: 0.3, vy: -0.1, type: 'squad', trail: [] },
      { id: 'CIVILIAN-04', x: 300, y: 100, vx: 0.2, vy: -0.4, type: 'civilian', trail: [] },
      { id: 'CIVILIAN-09', x: 50, y: 120, vx: -0.3, vy: 0.3, type: 'civilian', trail: [] }
    ];

    this.idleCounter = 0;
    this.lockOnTarget = null;

    this.init();
  }

  init() {
    this.setupCanvases();
    this.bindControls();
    this.seedInitialIncidents();
    this.startGridSimulationLoop();
    this.registerEventBindings();
    this.setupHeatmapClick();
    this.renderAIRecommendations();
  }

  setupCanvases() {
    if (this.camCanvas) {
      this.camCanvas.width = 640;
      this.camCanvas.height = 360;
    }
    if (this.heatmapCanvas) {
      this.heatmapCanvas.width = 460;
      this.heatmapCanvas.height = 240;
    }
  }

  setupHeatmapClick() {
    if (!this.heatmapCanvas) return;
    this.heatmapCanvas.addEventListener('mousedown', (e) => {
      const rect = this.heatmapCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.heatmapCanvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.heatmapCanvas.height / rect.height);
      
      this.triggerHeatmapPing(x, y);
    });
  }

  triggerHeatmapPing(x, y) {
    // Holographic Radar Ping Ring parameters
    this.lastPing = {
      x: x,
      y: y,
      radius: 2,
      maxRadius: 32,
      opacity: 0.9
    };
    
    // Premium scan synthesizer tone
    if (window.ShieldAudio && typeof window.ShieldAudio.playTone === 'function') {
      window.ShieldAudio.playTone(1100, 0.35, 'sine', 0.05);
    }
    
    // Add telemetry coordinate blip
    const blipId = `S-PING-${Math.floor(100 + Math.random() * 900)}`;
    this.targets.push({
      id: blipId,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      type: 'pingblip',
      trail: []
    });
    
    if (this.targets.length > 8) {
      const pingIdx = this.targets.findIndex(t => t.type === 'pingblip');
      if (pingIdx !== -1) this.targets.splice(pingIdx, 1);
    }

    const time = new Date().toLocaleTimeString();
    this.addAlertTicker(`[SCAN] Holographic sonar scan aligned at Sector coordinate X:${Math.round(x)} Y:${Math.round(y)}.`, 'info');
    
    // Dispatch chronological sequence log
    this.addTimelineNode(time.split(' ')[0], `Radar sweep focused on coordinate [X:${Math.round(x)}, Y:${Math.round(y)}]`);

    this.speakVoiceNotification("Focusing satellite surveillance scanner on coordinates.");
  }

  seedInitialIncidents() {
    const time = new Date();
    const formatTime = (minOffset) => {
      const d = new Date(time.getTime() - minOffset * 60 * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Chronological timelines seeds
    this.timeline = [
      { time: formatTime(6), log: "Sentinel Node Online. Validator Consensus established." },
      { time: formatTime(4), log: "Biometric authentication verified for Citizen access gateway." },
      { time: formatTime(2), log: "Dynamic privacy protection score synchronized at 99.8%." }
    ];
    this.renderTimeline();
    this.renderIncidents();
  }

  bindControls() {
    // Camera Selector buttons
    document.querySelectorAll('.threat-cam-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.threat-cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCam = btn.getAttribute('data-cam');
        if (window.ShieldAudio && typeof window.ShieldAudio.playClick === 'function') {
          window.ShieldAudio.playClick();
        }
        
        // Custom telemetry resolution text
        const resEl = document.getElementById('threat-cam-res');
        const latencyEl = document.getElementById('threat-cam-latency');
        if (this.activeCam === 'drone') {
          if (resEl) resEl.innerText = "720p (SAT) @ 30fps";
          if (latencyEl) latencyEl.innerText = "140 ms";
          this.speakVoiceNotification("Switched to drone camera feed.");
        } else {
          if (resEl) resEl.innerText = "1080p @ 60fps";
          if (latencyEl) latencyEl.innerText = `${Math.floor(8 + Math.random() * 8)} ms`;
          this.speakVoiceNotification(`Connected to camera feed channel ${this.activeCam.replace('cam', ' ')}.`);
        }

        // Ticker Alert
        this.addAlertTicker(`[CCTV] Overwatching stream switched to ${this.activeCam.toUpperCase()}`, 'info');

        // Log CCTV Switch on Blockchain
        if (window.ShieldEvents) {
          window.ShieldEvents.emit('cctvChannelChanged', { channel: this.activeCam });
        }
      });
    });

    // Profile Dropdown Selector profiles simulator
    const selectProfile = document.getElementById('threat-type-profile-select');
    if (selectProfile) {
      selectProfile.addEventListener('change', (e) => {
        this.triggerProfileSimulation(e.target.value);
      });
    }
  }

  registerEventBindings() {
    if (window.ShieldEvents) {
      // Listen for critical threat overrides
      window.ShieldEvents.on('alertResolved', () => {
        this.resolveAllIncidentsSilently();
      });
    }
  }

  triggerProfileSimulation(profile) {
    if (profile === 'none') return;
    
    // Reset idle timer
    this.idleCounter = 0;
    
    // Clear dropdown selector selection back to header
    document.getElementById('threat-type-profile-select').value = 'none';

    // Map profiles to incidents with Location and Camera mapping
    const profilesMap = {
      suspicious: { type: 'Suspicious Activity', level: 2, msg: 'Erratic human behavior registered on Lobby.', score: 35, location: 'Central Lobby', camera: 'cam01' },
      unauthorized: { type: 'Unauthorized Access', level: 3, msg: 'Zone 9 boundary checkpoint lock alert.', score: 58, location: 'North Tunnel Checkpoint', camera: 'cam02' },
      weapon: { type: 'Weapon Detection', level: 5, msg: 'Weapon detection classification confidence index 98.7%.', score: 98, location: 'Sector 07 Metro', camera: 'drone' },
      crowd: { type: 'Crowd Panic Alert', level: 3, msg: 'Density platforms panic velocities exceed civil index standards.', score: 62, location: 'Metro Station Platform', camera: 'cam03' },
      intrusion: { type: 'Intrusion Detected', level: 4, msg: 'Restricted boundary zone gate open event detected.', score: 79, location: 'East Gate Perimeter', camera: 'cam04' },
      cyber: { type: 'Cyber Breach Attempt', level: 5, msg: 'Subnet database cluster brute force breach detected.', score: 95, location: 'Quantum Server Subnet', camera: 'cam01' },
      unknown: { type: 'Unknown Threat', level: 3, msg: 'Unclassified biometric anomalous signature detected on Drone scan.', score: 48, location: 'Sector 07 Perimeter', camera: 'drone' }
    };

    const data = profilesMap[profile];
    if (!data) return;

    // Create unique incident ID
    const incId = 'INC-' + Math.floor(1000 + Math.random() * 9000);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newInc = {
      id: incId,
      type: data.type,
      time: time,
      level: data.level,
      msg: data.msg,
      status: 'AWAITING RESPONSE',
      location: data.location,
      camera: data.camera,
      authority: data.level >= 4 ? 'Command Council' : 'Local Patrol Unit'
    };

    this.incidents.unshift(newInc);
    this.activeThreatsCount++;
    
    // Speak announcement
    this.speakVoiceNotification(`Warning. ${data.type} detected.`);

    // Calibrate priority metrics
    this.calibrateThreatPriority(data.level, data.type, data.score);
    
    // Add to chronological timeline
    this.addTimelineNode(time.split(' ')[0], `${data.type} incident registered [${incId}]`, data.level >= 4);
    
    // Log to blockchain
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `THREAT DETECTED: [${incId}] - Category: ${data.type} - Location: ${data.location} - Message: ${data.msg}`,
        validator: "PREDICTIVE_THREAT_ORACLE"
      });
    }

    this.renderIncidents();
    
    // Generate beautiful real-time alerts card
    this.generateAlertCard(incId, data.type, data.level, data.msg);
  }

  generateAlertCard(id, type, level, msg) {
    const alerts = document.getElementById('threat-ticker-alerts');
    if (!alerts) return;

    // Remove fallback log if exists
    if (alerts.children.length === 1 && alerts.firstChild.innerText.includes('SYSTEM_BOOT')) {
      alerts.innerHTML = '';
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const card = document.createElement('div');
    
    let severityClass = 'alert-success';
    let severityText = 'LOW';
    if (level === 2 || level === 3) {
      severityClass = 'alert-warning';
      severityText = level === 2 ? 'GUARDED' : 'ELEVATED';
    } else if (level >= 4) {
      severityClass = '';
      severityText = level === 4 ? 'HIGH RISK' : 'CRITICAL THREAT';
    }

    card.className = `threat-alert-card ${severityClass}`;
    card.id = `alert-card-${id}`;
    card.innerHTML = `
      <div class="threat-alert-header">
        <span style="color: var(--neon-red); text-transform: uppercase;">⚠️ ${severityText}</span>
        <span>${time}</span>
      </div>
      <div class="threat-alert-body">
        <strong>${type} Detected</strong><br>
        <span style="font-size: 7.5px; color: var(--text-secondary);">${msg}</span>
      </div>
      <div class="threat-alert-meta">
        <span>LOC: Sector 07</span>
        <span>ID: ${id}</span>
        <button class="rec-action-btn" onclick="window.threatGrid.acknowledgeAlertFromCard('${id}', this)" style="padding: 1px 4px; font-size: 7px; margin-top: 2px;">ACKNOWLEDGE</button>
      </div>
    `;

    alerts.insertBefore(card, alerts.firstChild);
    if (alerts.children.length > 6) {
      alerts.removeChild(alerts.lastChild);
    }
  }

  acknowledgeAlertFromCard(id, button) {
    if (window.ShieldAudio && typeof window.ShieldAudio.playSuccess === 'function') {
      window.ShieldAudio.playSuccess();
    }
    
    button.className = 'rec-action-btn completed';
    button.innerText = 'ACKNOWLEDGED';
    button.disabled = true;

    this.addAlertTicker(`[INFO] Alert card acknowledgement registered for incident ${id}.`, 'info');
    
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `ALERT VERIFIED: Operator acknowledged and verified incident alert signature [${id}]`,
        validator: "VALIDATOR_OVERSIGHT_NODE"
      });
    }
    this.speakVoiceNotification("Threat signature acknowledged.");
  }

  calibrateThreatPriority(level, type = "Unknown Incident", riskScore = 12) {
    this.threatLevel = level;
    
    const lvlTextMap = ["IDLE", "LOW", "GUARDED", "ELEVATED", "HIGH", "CRITICAL"];
    const colorsMap = ["", "var(--neon-green)", "var(--neon-blue)", "var(--neon-yellow)", "var(--neon-orange)", "var(--neon-red)"];
    
    // Update summary stats
    const lvlLabel = document.getElementById('threat-val-level');
    if (lvlLabel) {
      lvlLabel.innerText = lvlTextMap[level];
      lvlLabel.style.color = colorsMap[level];
      if (level >= 4) {
        lvlLabel.style.textShadow = "0 0 10px " + colorsMap[level];
        lvlLabel.classList.add('animate-pulse');
      } else {
        lvlLabel.style.textShadow = "none";
        lvlLabel.classList.remove('animate-pulse');
      }
    }

    // Circular gauges fill and stroke calculation
    let prob = riskScore;
    let conf = Math.max(82, Math.floor(99 - (5 - level) * 3 - Math.random() * 2));
    
    let predictEscalation = "LOW (STABLE)";
    let predictEta = "NOMINAL";
    let predictPercentage = 12;

    if (level === 2) {
      predictEscalation = "MODERATE POOL";
      predictEta = "15-20 MINS";
      predictPercentage = 35;
    } else if (level === 3) {
      predictEscalation = "POSSIBLE (ELEVATED)";
      predictEta = "8-10 MINS";
      predictPercentage = 58;
    } else if (level === 4) {
      predictEscalation = "HIGHLY PROBABLE";
      predictEta = "3-5 MINS";
      predictPercentage = 78;
    } else if (level === 5) {
      predictEscalation = "IMMINENT (CRITICAL)";
      predictEta = "IMMEDIATE";
      predictPercentage = 98;
    }

    const probCircle = document.getElementById('threat-prob-gauge');
    const confCircle = document.getElementById('threat-conf-gauge');
    const probText = document.getElementById('threat-prob-percentage');
    const confText = document.getElementById('threat-conf-percentage');

    if (probCircle && confCircle) {
      // Circumference is 251.2
      const probOffset = 251.2 - (251.2 * prob) / 100;
      const confOffset = 251.2 - (251.2 * conf) / 100;
      
      probCircle.style.strokeDashoffset = probOffset;
      confCircle.style.strokeDashoffset = confOffset;
      probCircle.style.stroke = colorsMap[level];
      
      probText.innerText = `${prob}%`;
      probText.style.color = colorsMap[level];
      confText.innerText = `${conf}%`;
    }

    // Set center detail details
    const typeLabel = document.getElementById('threat-classification-type');
    const badgeLabel = document.getElementById('threat-severity-badge');
    
    if (typeLabel) typeLabel.innerText = type.toUpperCase();
    if (badgeLabel) {
      badgeLabel.className = `cyber-badge ${level >= 4 ? 'danger' : (level === 3 ? 'warning' : 'success')}`;
      badgeLabel.innerText = level >= 4 ? 'CRITICAL RISK OVERRIDE' : (level === 3 ? 'ELEVATED ALERT' : 'STABLE WATCH');
    }

    // Update AI Threat Prediction details
    const escalationEl = document.getElementById('threat-predict-escalation');
    const etaEl = document.getElementById('threat-predict-eta');
    const probabilityEl = document.getElementById('threat-predict-probability');
    const recommendationEl = document.getElementById('threat-predict-rec');
    
    if (escalationEl) {
      escalationEl.innerText = predictEscalation;
      escalationEl.style.color = colorsMap[level];
    }
    if (etaEl) etaEl.innerText = predictEta;

    if (probabilityEl) {
      probabilityEl.innerText = `${prob}%`;
      probabilityEl.style.color = colorsMap[level];
    }

    if (recommendationEl) {
      let recText = "VERIFY STATE";
      if (level === 2) recText = "FLOW VECTOR CHECK";
      if (level === 3) recText = "DEPLOY DRONE OVERWATCH";
      if (level === 4) recText = "DISPATCH PATROL SQUAD";
      if (level === 5) recText = "INITIALIZE LOCKDOWN";
      recommendationEl.innerText = recText;
      recommendationEl.style.color = 'var(--neon-cyan)';
    }

    // Inject beautiful progress bars into prediction panel
    this.renderPredictiveRiskBar(predictPercentage);

    // Update the MITIGATION RECOMMENDATIONS panel dynamically
    this.renderAIRecommendations();

    // Hook Critical Event level 5 trigger
    if (level === 5) {
      this.triggerEmergencyProtocol(type);
    }
  }

  renderPredictiveRiskBar(percentage) {
    const escalationCard = document.getElementById('threat-predict-escalation')?.parentElement?.parentElement;
    if (!escalationCard) return;

    // Check if progress bar exists, otherwise create it
    let bar = escalationCard.querySelector('.predictive-risk-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'predictive-risk-progress-bar';
      bar.innerHTML = '<div class="predictive-risk-progress-fill"></div>';
      escalationCard.appendChild(bar);
    }

    setTimeout(() => {
      const fill = bar.querySelector('.predictive-risk-progress-fill');
      if (fill) fill.style.width = `${percentage}%`;
    }, 50);
  }

  renderAIRecommendations() {
    const list = document.getElementById('threat-recommendations-list');
    if (!list) return;

    list.innerHTML = '';
    const lvl = this.threatLevel;

    // Recommendations database based on priority
    let recommendations = [];
    if (lvl === 1) {
      recommendations = [
        { id: 'REC-01', title: 'Verify Ledger Node Consensus', desc: 'Confirm validator blockchain state sync integrity.', action: 'VERIFY STATE', type: 'low', auto: true },
        { id: 'REC-02', title: 'Network Security Audit', desc: 'Scan subnet firewalls for anomalies.', action: 'RUN AUDIT', type: 'low', auto: false }
      ];
    } else if (lvl === 2) {
      recommendations = [
        { id: 'REC-03', title: 'Crowd Flow Vector Check', desc: 'Analyze flow velocities around Lobby boundaries.', action: 'MONITOR', type: 'medium', auto: false },
        { id: 'REC-04', title: 'Calibrate Facial Masking Strength', desc: 'Verify pixelation strength is set to maximum.', action: 'CALIBRATE', type: 'low', auto: true }
      ];
    } else if (lvl === 3) {
      recommendations = [
        { id: 'REC-05', title: 'Deploy Drone Overwatch', desc: 'Launch Drone-07 to scan Sector 07 coordinates.', action: 'DEPLOY DRONE', type: 'medium', auto: false },
        { id: 'REC-06', title: 'Escalate Telemetry Scan Density', desc: 'Calibrate radar sweep rate to maximum speed.', action: 'ENHANCE', type: 'medium', auto: false }
      ];
    } else if (lvl === 4) {
      recommendations = [
        { id: 'REC-07', title: 'Dispatch Intercept Patrol', desc: 'Deploy Squad Bravo to metro plaza checkpoints.', action: 'DISPATCH SQUAD', type: 'high', auto: false },
        { id: 'REC-08', title: 'Authorize Administrative Warrant Bypass', desc: 'Warrant bypass allows unmasking of target signatures.', action: 'AUTHORIZE', type: 'high', auto: false }
      ];
    } else if (lvl === 5) {
      recommendations = [
        { id: 'REC-09', title: 'Initialize Lockdown Protocol', desc: 'Force lock restricted gates and sound local sirens.', action: 'ENGAGE LOCKDOWN', type: 'high', auto: false },
        { id: 'REC-10', title: 'Enforce Global Zero-Trust Matrix', desc: 'Apply anonymity pixelation overrides globally.', action: 'ENFORCE', type: 'high', auto: true }
      ];
    }

    recommendations.forEach(rec => {
      const card = document.createElement('div');
      const isCompleted = rec.auto || this.executedActions.has(rec.id);
      
      let priorityClass = 'priority-low';
      if (rec.type === 'medium') priorityClass = 'priority-medium';
      if (rec.type === 'high') priorityClass = 'priority-high';

      card.className = `threat-recommendation-card ${priorityClass}`;
      card.innerHTML = `
        <div class="rec-details">
          <span class="rec-title">${rec.title}</span>
          <span class="rec-desc">${rec.desc}</span>
        </div>
        <div>
          <button class="rec-action-btn ${isCompleted ? 'completed' : ''}" 
                  onclick="window.threatGrid.executeAIRecommendation('${rec.id}', '${rec.title}', this)" 
                  ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? '✓ COMPLETED' : rec.action}
          </button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  executeAIRecommendation(id, title, button) {
    // Save to completed set
    this.executedActions.add(id);
    
    // Style update
    button.className = 'rec-action-btn completed';
    button.innerText = '✓ COMPLETED';
    button.disabled = true;

    // Success sound synthesis
    if (window.ShieldAudio && typeof window.ShieldAudio.playSuccess === 'function') {
      window.ShieldAudio.playSuccess();
    }

    // Speak
    this.speakVoiceNotification(`Executing recommendation: ${title}.`);

    // Add logging tickers
    const time = new Date().toLocaleTimeString();
    this.addAlertTicker(`[RECOMMEND] Action completed: ${title}`, 'success');

    // Blockchain Ledger registration
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `MITIGATION PROTOCOL EXECUTED: Operator authorized action: [${title}]`,
        validator: "OVERSIGHT_COUNCIL_MULTI_SIG"
      });
    }

    // Reroute actions triggers
    if (title.includes('Drone')) {
      if (window.ShieldEvents) window.ShieldEvents.emit('droneDeployed');
    } else if (title.includes('Lockdown')) {
      if (window.ShieldEvents) window.ShieldEvents.emit('lockdownToggled', true);
    }
  }

  triggerEmergencyProtocol(type) {
    this.emergencyCount++;
    
    // Emit audit blockchain block
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `EMERGENCY ACTIVATED: Auto tactical response triggered due to [${type.toUpperCase()}]`,
        validator: "OVERSIGHT_COUNCIL_MULTI_SIG"
      });
    }

    // Speak voice prompts
    this.speakVoiceNotification("Critical threat alert registered. Commencing tactical dispatch protocols.");

    // Screen Red warning flashing activation
    const flash = document.getElementById('screen-red-flash');
    if (flash) flash.classList.add('flashing');

    // Display global Red alert popup modal
    const alertPopup = document.getElementById('global-red-alert-popup');
    const alertTitle = document.getElementById('alert-popup-title');
    const alertMsg = document.getElementById('alert-popup-msg');
    if (alertPopup) {
      if (alertTitle) alertTitle.innerText = `${type.toUpperCase()} THREAT DETECTED`;
      if (alertMsg) alertMsg.innerText = `Critical security alert registered. Automatic overwatch routing to Emergency Tactical console active. Sector 07.`;
      alertPopup.style.display = 'flex';
      alertPopup.classList.add('active');
    }

    // Sound siren
    if (window.ShieldAudio && typeof window.ShieldAudio.startSiren === 'function') {
      window.ShieldAudio.startSiren();
    }

    // Auto routing to Tactical deck view
    setTimeout(() => {
      if (window.navigateToView) {
        window.navigateToView('tactical');
      }
    }, 1500);
  }

  resolveAllIncidentsSilently() {
    this.incidents.forEach(inc => {
      inc.status = 'RESOLVED';
    });
    this.calibrateThreatPriority(1, "None", 12);
    this.activeThreatsCount = 0;
    this.renderIncidents();
    
    const flash = document.getElementById('screen-red-flash');
    if (flash) flash.classList.remove('flashing');

    const list = document.getElementById('threat-recommendations-list');
    if (list) {
      list.innerHTML = `<div style="font-family: monospace; font-size: 8px; color: var(--text-muted); text-align: center; padding: 15px 0;">[SYSTEM_IDLE] GREEN OVERWATCH STABLE</div>`;
    }
  }

  monitorIncident(id) {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return;

    // Reset idle timer
    this.idleCounter = 0;

    // Override camera feed to incident camera
    if (inc.camera) {
      this.activeCam = inc.camera;
      // Switch active buttons in UI if present
      document.querySelectorAll('.threat-cam-btn').forEach(btn => {
        if (btn.getAttribute('data-cam') === inc.camera) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      const resEl = document.getElementById('threat-cam-res');
      const latencyEl = document.getElementById('threat-cam-latency');
      if (inc.camera === 'drone') {
        if (resEl) resEl.innerText = "720p (SAT) @ 30fps";
        if (latencyEl) latencyEl.innerText = "140 ms";
      } else {
        if (resEl) resEl.innerText = "1080p @ 60fps";
        if (latencyEl) latencyEl.innerText = `${Math.floor(8 + Math.random() * 8)} ms`;
      }
    }

    // Trigger lock-on target visual animation inside draw feed
    this.lockOnTarget = {
      ticks: 120, // display reticle lock for 120 animation frames
      location: inc.location || 'Sector 07',
      type: inc.type
    };

    // Speak voice notification
    this.speakVoiceNotification(`Surveillance feed override. Locking scanners onto target at ${inc.location || 'Sector Seven'}.`);

    // Synthesis sound
    if (window.ShieldAudio && typeof window.ShieldAudio.playTone === 'function') {
      window.ShieldAudio.playTone(880, 0.15, 'sawtooth', 0.1);
      setTimeout(() => window.ShieldAudio.playTone(1320, 0.25, 'sawtooth', 0.08), 100);
    }

    // Add timeline & ticker
    const time = new Date().toLocaleTimeString();
    this.addAlertTicker(`[OVERRIDE] Camera matrix focus override to ${inc.location || 'Sector 07'}`, 'info');
    this.addTimelineNode(time.split(' ')[0], `Camera feed focus locked on incident ${inc.id}`);
  }

  investigateIncident(id) {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return;

    inc.status = 'UNDER INVESTIGATION';
    this.renderIncidents();
    this.addAlertTicker(`[INFO] Investigation launched on incident ${id}.`, 'info');
    
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `THREAT ENGAGED: Investigation dispatch initialized for target [${id}]`,
        validator: "VALIDATOR_OVERSIGHT_NODE"
      });
    }
    this.speakVoiceNotification("Monitoring threat progression.");
  }

  escalateIncident(id) {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return;

    // Elevate priority
    const nextLevel = Math.min(5, inc.level + 1);
    inc.level = nextLevel;
    inc.status = 'ESCALATED';

    const scoresMap = [0, 12, 35, 58, 78, 98];
    this.calibrateThreatPriority(nextLevel, inc.type, scoresMap[nextLevel]);
    this.renderIncidents();
    
    this.addTimelineNode(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).split(' ')[0], `${inc.type} escalated to Level ${nextLevel} [${id}]`, true);

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `THREAT ESCALATED: Risk rating elevated to Level ${nextLevel} for incident [${id}]`,
        validator: "PREDICTIVE_THREAT_ORACLE"
      });
    }
    
    this.speakVoiceNotification("Threat escalated.");
    this.addAlertTicker(`[ESCALATE] Incident ${id} has been elevated to severity level ${nextLevel}.`, 'warning');
  }

  resolveIncident(id) {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return;

    inc.status = 'RESOLVED';
    this.renderIncidents();
    this.addAlertTicker(`[INFO] Incident ${id} resolved successfully.`, 'success');

    // Remove warning cards from live alert panel
    const card = document.getElementById(`alert-card-${id}`);
    if (card) {
      card.className = 'threat-alert-card alert-success';
      const btn = card.querySelector('button');
      if (btn) {
        btn.innerText = 'RESOLVED';
        btn.disabled = true;
        btn.className = 'rec-action-btn completed';
      }
    }

    // Check if any critical incidents remain active
    const activeCritical = this.incidents.some(i => i.status !== 'RESOLVED' && i.level === 5);
    if (!activeCritical) {
      const flash = document.getElementById('screen-red-flash');
      if (flash) flash.classList.remove('flashing');
      
      // Return priority to highest active, or fallback low
      const highestActive = this.incidents.filter(i => i.status !== 'RESOLVED').map(i => i.level);
      const topLevel = highestActive.length > 0 ? Math.max(...highestActive) : 1;
      const topInc = this.incidents.find(i => i.level === topLevel && i.status !== 'RESOLVED');
      
      const scoresMap = [0, 12, 35, 58, 78, 98];
      this.calibrateThreatPriority(topLevel, topInc ? topInc.type : "None", scoresMap[topLevel]);
      if (window.ShieldEvents) window.ShieldEvents.emit('alertResolved');
    }

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `THREAT RESOLVED: Incident signature [${id}] neutralized and cleared from overwatch lists`,
        validator: "TACTICAL_LEDGER_ORACLE"
      });
    }

    this.speakVoiceNotification("Threat neutralized.");
  }

  speakVoiceNotification(message) {
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', message);
    }
  }

  renderIncidents() {
    const list = document.getElementById('threat-incident-list');
    if (!list) return;

    if (this.incidents.length === 0) {
      list.innerHTML = `<div style="font-family:monospace; font-size:8px; color:var(--text-muted); text-align:center; padding:20px 0;">NO ACTIVE SECURITY INCIDENTS</div>`;
      return;
    }

    list.innerHTML = '';
    const priorityClasses = ["", "low", "guarded", "elevated", "high", "critical"];

    this.incidents.forEach(inc => {
      const card = document.createElement('div');
      card.className = `threat-incident-card ${priorityClasses[inc.level]}`;
      
      let statusColor = "var(--neon-green)";
      if (inc.status.includes('INVESTIGATION')) statusColor = "var(--neon-blue)";
      if (inc.status.includes('ESCALATED')) statusColor = "var(--neon-orange)";
      if (inc.status.includes('RESOLVED')) statusColor = "var(--text-muted)";

      card.innerHTML = `
        <div class="threat-incident-header">
          <span style="font-weight:bold; color:var(--neon-purple);">${inc.id}</span>
          <span style="color:${statusColor}">${inc.status}</span>
        </div>
        <div class="threat-incident-body">
          <strong>${inc.type}</strong><br>
          <span style="color:var(--text-secondary); font-size:8px;">${inc.msg}</span>
        </div>
        <div style="font-size:7.5px; color:var(--text-muted); display:flex; flex-direction:column; gap:1px; margin-top:3px; border-top:1px dashed rgba(255,255,255,0.03); padding-top:3px;">
          <div style="display:flex; justify-content:space-between;">
            <span>LOC: ${inc.location || 'Sector 07'}</span>
            <span>Time: ${inc.time}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Clearance: ${inc.authority}</span>
            <span>Feed: ${inc.camera ? inc.camera.toUpperCase() : 'CAM 01'}</span>
          </div>
        </div>
        ${inc.status !== 'RESOLVED' ? `
        <div class="threat-incident-actions">
          <button class="incident-act-btn" onclick="window.threatGrid.monitorIncident('${inc.id}')" style="border-color:var(--neon-cyan); color:var(--neon-cyan);">Monitor</button>
          <button class="incident-act-btn" onclick="window.threatGrid.investigateIncident('${inc.id}')">Investigate</button>
          <button class="incident-act-btn" onclick="window.threatGrid.escalateIncident('${inc.id}')">Escalate</button>
          <button class="incident-act-btn resolve" onclick="window.threatGrid.resolveIncident('${inc.id}')">Resolve</button>
        </div>
        ` : ''}
      `;
      list.appendChild(card);
    });
  }

  addTimelineNode(time, text, isDanger = false) {
    this.timeline.unshift({ time: time, log: text, isDanger: isDanger });
    this.renderTimeline();
  }

  renderTimeline() {
    const flow = document.getElementById('threat-chronology-timeline');
    if (!flow) return;

    flow.innerHTML = '';
    this.timeline.slice(0, 8).forEach(item => {
      const node = document.createElement('div');
      node.className = `threat-timeline-item ${item.isDanger ? 'danger' : ''}`;
      node.innerHTML = `
        <span style="color:var(--text-muted); font-size:7px;">[${item.time}]</span> 
        <span style="color:#fff; font-size:8px;">${item.log}</span>
      `;
      flow.appendChild(node);
    });
  }

  addAlertTicker(msg, type = 'info') {
    const alerts = document.getElementById('threat-ticker-alerts');
    if (!alerts) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = document.createElement('div');
    item.style.marginBottom = "3px";
    item.style.fontSize = "8px";
    item.style.fontFamily = "monospace";
    
    let color = 'var(--text-secondary)';
    if (type === 'warning') color = 'var(--neon-orange)';
    if (type === 'danger') color = 'var(--neon-red)';
    if (type === 'success') color = 'var(--neon-green)';

    item.style.color = color;
    item.innerHTML = `<span style="color:var(--text-muted)">[${time}]</span> ${msg}`;

    alerts.insertBefore(item, alerts.firstChild);
    if (alerts.children.length > 20) {
      alerts.removeChild(alerts.lastChild);
    }
  }

  // Multi-camera stream drawing overlays
  drawCameraFeed() {
    if (!this.camCtx) return;
    const ctx = this.camCtx;
    const w = this.camCanvas.width;
    const h = this.camCanvas.height;

    this.animTick++;

    // Background clearing
    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, w, h);

    // Static grid lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Dynamic scanline overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Render based on current selected channel
    const cam = this.activeCam;
    const isLockdown = window.ShieldState && window.ShieldState.lockdownEnabled;
    const isAnonymity = window.ShieldState && window.ShieldState.globalAnonymity && !window.ShieldState.activeWarrantOverride;
    
    let entColor = this.threatLevel === 5 ? 'var(--neon-red)' : (this.threatLevel >= 3 ? 'var(--neon-yellow)' : 'var(--neon-green)');
    ctx.strokeStyle = entColor;
    ctx.lineWidth = 1.5;

    if (cam === 'cam01') {
      // 1. Lobby Stream drawing
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.strokeRect(40, 40, w - 80, h - 80);
      
      // Bounding box simulated walking targets
      const tX = w / 2 + Math.sin(this.animTick * 0.015) * 110;
      const tY = h / 2 + Math.cos(this.animTick * 0.02) * 45;
      
      // Draw target body bounds
      ctx.strokeStyle = entColor;
      ctx.strokeRect(tX - 20, tY - 40, 40, 80);

      // velocity indicator
      ctx.strokeStyle = 'rgba(177,13,201,0.6)';
      ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(tX + Math.sin(this.animTick * 0.015) * 20, tY); ctx.stroke();

      // target detail texts
      ctx.fillStyle = entColor;
      ctx.font = '7.5px monospace';
      ctx.fillText(`TARGET_ID: SEC-0492`, tX - 18, tY - 46);
      ctx.fillText(`VELOCITY: ${(Math.sin(this.animTick*0.015)*1.2).toFixed(1)}m/s`, tX - 18, tY + 50);

      // Face blur masking
      const faceY = tY - 26;
      if (isAnonymity) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
        ctx.beginPath(); ctx.arc(tX, faceY, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'var(--neon-blue)';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '6px monospace';
        ctx.fillText("MASKED", tX - 9, faceY + 2);
      } else {
        ctx.fillStyle = 'rgba(177, 13, 201, 0.15)';
        ctx.beginPath(); ctx.arc(tX, faceY, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'var(--neon-purple)';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '6px monospace';
        ctx.fillText("KYLE_R", tX - 9, faceY + 2);
      }
    } 
    else if (cam === 'cam02') {
      // 2. North Tunnel Stream drawing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      //perspective lines
      ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(240, 140);
      ctx.moveTo(w, h); ctx.lineTo(400, 140);
      ctx.stroke();

      // Passing vehicles (blocks moving horizontally)
      const carX = (this.animTick * 4.5) % (w + 100) - 50;
      if (carX < w) {
        ctx.strokeStyle = 'var(--neon-blue)';
        ctx.strokeRect(carX, h - 85, 55, 25);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
        ctx.fillRect(carX, h - 85, 55, 25);
        
        ctx.fillStyle = 'var(--neon-blue)';
        ctx.font = '7px monospace';
        ctx.fillText(`VEHICLE: SPEED 58km/h`, carX, h - 92);
      }

      // Restricted zone gate line overlay
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(240, 220); ctx.lineTo(400, 220); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '7.5px monospace';
      ctx.fillText("RESTRICTED ZONE INTRUSION LEVEL", 240, 214);
    } 
    else if (cam === 'cam03') {
      // 3. Metro Platform Stream drawing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeRect(20, 20, w - 40, h - 40);

      // platform columns wireframes
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.strokeRect(60, 20, 30, h - 40);
      ctx.strokeRect(w - 90, 20, 30, h - 40);

      // Commuters dense cluster drawing
      ctx.fillStyle = 'var(--neon-green)';
      for (let i = 0; i < 15; i++) {
        const cx = 100 + (Math.sin(this.animTick * 0.001 + i) * 60) + (i * 20);
        const cy = 200 + (Math.cos(this.animTick * 0.002 + i) * 40);
        ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
        
        // draw individual minor bounding boxes
        if (i % 4 === 0) {
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
          ctx.strokeRect(cx - 6, cy - 14, 12, 28);
        }
      }
      ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
      ctx.font = '8px monospace';
      ctx.fillText("METRO PLATFORM OVERWATCH: DENSITY 42%", 30, 40);
    } 
    else if (cam === 'cam04') {
      // 4. East Gate Checkpoint Stream drawing
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
      ctx.strokeRect(100, 50, w - 200, h - 100);

      // Gate outline wireframe
      ctx.strokeRect(w/2 - 60, h/2 - 40, 120, 80);

      // horizontal laser scanning sweeping line
      const laserY = h/2 - 40 + (Math.sin(this.animTick * 0.04) + 1) * 40;
      ctx.strokeStyle = 'var(--neon-orange)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(w/2 - 60, laserY); ctx.lineTo(w/2 + 60, laserY); ctx.stroke();

      // target locking focus frame
      const focusX = w/2 + Math.cos(this.animTick * 0.005) * 40;
      const focusY = h/2 + Math.sin(this.animTick * 0.008) * 20;
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.strokeRect(focusX - 12, focusY - 12, 24, 24);
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '6px monospace';
      ctx.fillText("LOCK", focusX - 12, focusY - 16);
    } 
    else if (cam === 'drone') {
      // 5. Aerial Drone Overwatch Feed
      // Draw circular telemetry HUD reticle
      ctx.strokeStyle = 'rgba(177, 13, 201, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w/2, h/2, 110, 0, Math.PI * 2); ctx.stroke();
      
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.arc(w/2, h/2, 80, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // Flight metrics overlays
      ctx.fillStyle = 'var(--neon-purple)';
      ctx.font = '7.5px monospace';
      ctx.fillText(`ALTITUDE: 154.2 m`, 35, 38);
      ctx.fillText(`AIR_SPEED: 42.6 km/h`, 35, 48);
      ctx.fillText(`LATENCY: 140ms (SAT)`, 35, 58);

      // Target lock circle coordinates tracking suspect blip
      const trgX = w/2 + Math.sin(this.animTick * 0.01) * 60;
      const trgY = h/2 + Math.cos(this.animTick * 0.015) * 35;
      
      ctx.strokeStyle = 'var(--neon-cyan)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(trgX, trgY, 18, 0, Math.PI * 2); ctx.stroke();
      
      // crosshairs
      ctx.beginPath();
      ctx.moveTo(trgX - 25, trgY); ctx.lineTo(trgX + 25, trgY);
      ctx.moveTo(trgX, trgY - 25); ctx.lineTo(trgX, trgY + 25);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.fillText(`COORD_SEC_07: X:${Math.round(trgX)} Y:${Math.round(trgY)}`, trgX + 22, trgY - 4);
    }

    // Dynamic scanline sweeping bar
    const scannerY = (this.animTick * 1.8) % h;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.fillRect(0, scannerY, w, 2);

    // Diagnostics overlays top left
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(15, 15, 120, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`STREAM: ${cam.toUpperCase()}`, 20, 28);

    // Draw Target Lock-On Overlay Reticle
    if (this.lockOnTarget && this.lockOnTarget.ticks > 0) {
      this.lockOnTarget.ticks--;
      const pulse = 1 + Math.sin(this.animTick * 0.2) * 0.15;
      const size = 30 * pulse;
      
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 2;
      
      // Drawing holographic tracking brackets
      // Top-left
      ctx.beginPath(); ctx.moveTo(-size, -size + 10); ctx.lineTo(-size, -size); ctx.lineTo(-size + 10, -size); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(size, -size + 10); ctx.lineTo(size, -size); ctx.lineTo(size - 10, -size); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(-size, size - 10); ctx.lineTo(-size, size); ctx.lineTo(-size + 10, size); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(size, size - 10); ctx.lineTo(size, size); ctx.lineTo(size - 10, size); ctx.stroke();
      
      // Drawing crosshair lines with small gap
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-size - 15, 0); ctx.lineTo(-10, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(size + 15, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -size - 15); ctx.lineTo(0, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, size + 15); ctx.stroke();
      
      // Center pulsing circle
      ctx.fillStyle = 'rgba(255, 56, 96, 0.15)';
      ctx.beginPath(); ctx.arc(0, 0, 5 * pulse, 0, Math.PI * 2); ctx.fill();
      
      // Lock target text tag
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`LOCK-ON ACTIVE: ${this.lockOnTarget.type.toUpperCase()}`, 0, -size - 22);
      ctx.fillText(`COORDS LOCKED: ${this.lockOnTarget.location.toUpperCase()}`, 0, size + 25);
      
      // Red alert warning flash borders on canvas
      if (this.animTick % 20 < 10) {
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-w/2, -h/2, w, h);
      }
      
      ctx.restore();
      ctx.textAlign = 'left'; // Reset
    }
  }

  // Interactive Smart City Heatmap Simulation
  drawHeatmap() {
    if (!this.heatmapCtx) return;
    const ctx = this.heatmapCtx;
    const w = this.heatmapCanvas.width;
    const h = this.heatmapCanvas.height;

    // Background clear
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Named district outlines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.lineWidth = 0.5;
    const cols = 5; const rows = 3;
    const secW = w / cols; const secH = h / rows;
    
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * secW, 0); ctx.lineTo(c * secW, h); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * secH); ctx.lineTo(w, r * secH); ctx.stroke();
    }

    // 1. SAFE ZONES: SEC-02 Safe Area (green translucent boundary)
    ctx.fillStyle = 'rgba(0, 230, 118, 0.03)';
    ctx.fillRect(15, 30, secW * 1.6, secH * 1.5);
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.18)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(15, 30, secW * 1.6, secH * 1.5);
    
    if (this.animTick % 60 < 30) {
      ctx.fillStyle = 'var(--neon-green)';
      ctx.beginPath(); ctx.arc(22, 38, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 230, 118, 0.75)';
    ctx.font = 'bold 6.5px monospace';
    ctx.fillText("SAFE OVERWATCH ZONE - SEC-02", 28, 41);

    // 2. ALERT ZONES: SEC-05 Alert Watch Area (yellow pulsing boundary)
    ctx.fillStyle = 'rgba(243, 243, 21, 0.02)';
    ctx.fillRect(w - 180, 25, 165, 80);
    ctx.strokeStyle = 'rgba(243, 243, 21, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(w - 180, 25, 165, 80);

    if (this.animTick % 40 < 20) {
      ctx.fillStyle = 'var(--neon-yellow)';
      ctx.beginPath(); ctx.arc(w - 172, 33, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(243, 243, 21, 0.7)';
    ctx.font = 'bold 6.5px monospace';
    ctx.fillText("ALERT WATCH ZONE - SEC-05", w - 165, 36);

    // 3. HIGH-RISK AREAS: SEC-07 Danger zone glowing center
    const isThreat = this.threatLevel === 5;
    const isWarning = this.threatLevel >= 3 && this.threatLevel <= 4;
    const heatX = w * 0.68;
    const heatY = h * 0.58;
    const heatSize = 45 + Math.sin(this.animTick * 0.04) * 8;

    ctx.save();
    const heatGrad = ctx.createRadialGradient(heatX, heatY, 3, heatX, heatY, heatSize);
    if (isThreat) {
      heatGrad.addColorStop(0, 'rgba(255, 56, 96, 0.35)');
      heatGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.3)';
    } else if (isWarning) {
      heatGrad.addColorStop(0, 'rgba(243, 243, 21, 0.22)');
      heatGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = 'rgba(243, 243, 21, 0.2)';
    } else {
      heatGrad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
      heatGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
    }
    
    ctx.fillStyle = heatGrad;
    ctx.beginPath(); ctx.arc(heatX, heatY, heatSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(heatX, heatY, heatSize * 0.7, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = isThreat ? 'var(--neon-red)' : (isWarning ? 'var(--neon-yellow)' : 'var(--neon-cyan)');
    ctx.font = 'bold 6.5px monospace';
    ctx.fillText(isThreat ? "HIGH-RISK AREA - SEC-07 CRITICAL" : "SEC-07 FLIGHT VECTOR (MONITOR)", heatX - 65, heatY - heatSize - 4);
    ctx.restore();

    // 4. ACTIVE CAMERAS: Draw active overwatch nodes with FOV scanner sweep cones
    const staticCams = [
      { id: 'CAM-01', x: w * 0.2, y: h * 0.35 },
      { id: 'CAM-02', x: w * 0.45, y: h * 0.28 },
      { id: 'CAM-03', x: w * 0.35, y: h * 0.72 },
      { id: 'CAM-04', x: w * 0.82, y: h * 0.42 }
    ];

    staticCams.forEach(sc => {
      // FOV Sweep Cone
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(this.animTick * 0.006 + (sc.id === 'CAM-01' ? 0 : sc.id === 'CAM-02' ? 1.5 : sc.id === 'CAM-03' ? 3 : 4.5));
      ctx.fillStyle = 'rgba(0, 242, 254, 0.035)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 25);
      ctx.lineTo(12, 25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Camera node dot
      ctx.fillStyle = this.activeCam === sc.id.toLowerCase().replace('-', '') ? 'var(--neon-red)' : 'var(--neon-cyan)';
      ctx.beginPath(); ctx.arc(sc.x, sc.y, 2.5, 0, Math.PI * 2); ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(0, 242, 254, 0.65)';
      ctx.font = '5px monospace';
      ctx.fillText(sc.id, sc.x - 8, sc.y - 5);
    });

    // Map pings coordinate expansions drawing
    if (this.lastPing) {
      this.lastPing.radius += 1.6;
      this.lastPing.opacity -= 0.035;
      
      if (this.lastPing.opacity <= 0) {
        this.lastPing = null;
      } else {
        ctx.strokeStyle = `rgba(0, 242, 254, ${this.lastPing.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.lastPing.x, this.lastPing.y, this.lastPing.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(0, 242, 254, ${this.lastPing.opacity * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(this.lastPing.x - this.lastPing.radius - 4, this.lastPing.y);
        ctx.lineTo(this.lastPing.x + this.lastPing.radius + 4, this.lastPing.y);
        ctx.moveTo(this.lastPing.x, this.lastPing.y - this.lastPing.radius - 4);
        ctx.lineTo(this.lastPing.x, this.lastPing.y + this.lastPing.radius + 4);
        ctx.stroke();
      }
    }

    // Named Sector labels text
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '6px monospace';
    ctx.fillText("SEC-04 DOWNTOWN RESIDENTIAL", 25, h - 25);
    ctx.fillText("SEC-07 METRO COMMERCE DISTRICT", w/2 - 30, 25);
    
    ctx.fillStyle = isThreat ? 'var(--neon-red)' : 'var(--neon-cyan)';
    ctx.font = '7px monospace';
    ctx.fillText("SURVEILLANCE DIGITAL TWIN MATRIX", 15, 15);

    // 5. EMERGENCY UNITS: Draw squads/drones with custom icons, pulsing alerts & target markers
    this.targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;

      // check map boundaries
      if (t.x < 15 || t.x > w - 15) t.vx *= -1;
      if (t.y < 15 || t.y > h - 15) t.vy *= -1;

      // append trails
      t.trail.push({ x: t.x, y: t.y });
      if (t.trail.length > 15) t.trail.shift();

      // Draw vector trails
      ctx.strokeStyle = t.type === 'suspect' ? 'rgba(255, 56, 96, 0.22)' : (t.type === 'drone' ? 'rgba(177, 13, 201, 0.22)' : 'rgba(0, 242, 254, 0.22)');
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      t.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Pulsing lock-on rings for Emergency Units and Suspects
      if (t.type === 'drone' || t.type === 'squad') {
        ctx.strokeStyle = 'rgba(177, 13, 201, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6 + Math.sin(this.animTick * 0.15) * 1.8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (t.type === 'suspect' && (isThreat || isWarning)) {
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 7 + Math.sin(this.animTick * 0.2) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dot drawing
      ctx.fillStyle = t.type === 'suspect' ? 'var(--neon-red)' : (t.type === 'drone' ? 'var(--neon-purple)' : 'var(--neon-blue)');
      if (t.type === 'pingblip') ctx.fillStyle = 'var(--neon-cyan)';
      
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.type === 'suspect' ? 3.2 : 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Text label blips
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '5px monospace';
      
      let label = t.id;
      if (t.type === 'drone') label += " (DRONE UNIT)";
      if (t.type === 'squad') label += " (TACTICAL SQUAD)";
      ctx.fillText(label, t.x + 6, t.y + 1);
    });

    // Radar scanning line sweeping arc circle centered at hazard
    const sweepRadius = (this.animTick * 1.5) % 180;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(heatX, heatY, sweepRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  updateDashboardMetrics() {
    // Dynamic stats row update
    const activeLabel = document.getElementById('threat-val-active');
    const alertsLabel = document.getElementById('threat-val-emergencies');
    const accuracyLabel = document.getElementById('threat-val-accuracy');
    const privacyLabel = document.getElementById('threat-val-privacy');

    if (activeLabel) activeLabel.innerText = this.activeThreatsCount;
    if (alertsLabel) alertsLabel.innerText = this.emergencyCount;
    
    // AI Accuracy slight variance
    if (accuracyLabel && this.animTick % 60 === 0) {
      const varAcc = (99.2 + Math.random() * 0.35).toFixed(2);
      accuracyLabel.innerText = `${varAcc}%`;
    }

    // Threat Level card update
    const levelLabel = document.getElementById('threat-val-level');
    if (levelLabel) {
      const lvlTextMap = ["IDLE", "LOW", "GUARDED", "ELEVATED", "HIGH", "CRITICAL"];
      const colorsMap = ["", "var(--neon-green)", "var(--neon-blue)", "var(--neon-yellow)", "var(--neon-orange)", "var(--neon-red)"];
      
      levelLabel.innerText = lvlTextMap[this.threatLevel];
      levelLabel.style.color = colorsMap[this.threatLevel];
      
      const card = levelLabel.parentElement;
      if (card) {
        if (this.threatLevel >= 4) {
          card.style.borderColor = colorsMap[this.threatLevel];
          card.style.boxShadow = `0 0 10px ${colorsMap[this.threatLevel]}`;
          levelLabel.style.textShadow = `0 0 10px ${colorsMap[this.threatLevel]}`;
        } else {
          card.style.borderColor = "";
          card.style.boxShadow = "";
          levelLabel.style.textShadow = "";
        }
      }
    }

    // Active Cameras card dynamic checking
    const camerasLabel = document.getElementById('threat-val-cameras');
    if (camerasLabel && this.animTick % 120 === 0) {
      const offline = Math.random() > 0.85 ? 1 : 0;
      camerasLabel.innerText = `${128 - offline}/128`;
      const camBadge = document.getElementById('cam-health-badge');
      if (camBadge) {
        if (offline > 0) {
          camBadge.innerText = "ATTENTION REQUIRED";
          camBadge.className = "cyber-badge warning";
        } else {
          camBadge.innerText = "ALL FEEDS ONLINE";
          camBadge.className = "cyber-badge success";
        }
      }
    }

    // Privacy sync index
    if (privacyLabel) {
      let indexVal = 99.8;
      if (this.threatLevel === 5) {
        indexVal = 42.6; // drops due to active unblur override
      } else if (this.threatLevel === 4) {
        indexVal = 71.4;
      } else if (this.threatLevel === 3) {
        indexVal = 88.2;
      }
      
      indexVal = +(indexVal + (Math.random() * 0.2 - 0.1)).toFixed(1);
      privacyLabel.innerText = `${Math.min(100, indexVal)}%`;
      
      const card = privacyLabel.parentElement;
      if (card) {
        if (this.threatLevel >= 4) {
          privacyLabel.style.color = "var(--neon-red)";
          privacyLabel.style.textShadow = "var(--text-glow-red)";
          card.style.borderColor = "var(--neon-red)";
        } else if (this.threatLevel === 3) {
          privacyLabel.style.color = "var(--neon-yellow)";
          privacyLabel.style.textShadow = "var(--text-glow-yellow)";
          card.style.borderColor = "var(--neon-yellow)";
        } else {
          privacyLabel.style.color = "var(--neon-green)";
          privacyLabel.style.textShadow = "0 0 8px rgba(0, 230, 118, 0.4)";
          card.style.borderColor = "";
        }
      }
    }
  }

  startGridSimulationLoop() {
    const loop = () => {
      this.drawCameraFeed();
      this.drawHeatmap();
      this.updateDashboardMetrics();

      // Ambient Security Event Simulator Loop
      if (this.threatLevel === 1) {
        this.idleCounter++;
        if (this.idleCounter > 1800) { // 30 seconds of absolute idle
          this.idleCounter = 0;
          const randomProfiles = ['suspicious', 'unauthorized', 'unknown', 'intrusion'];
          const choice = randomProfiles[Math.floor(Math.random() * randomProfiles.length)];
          this.triggerProfileSimulation(choice);
        }
      } else {
        this.idleCounter = 0; // Reset if there is an active threat
      }
      
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// 3. Global Trigger triggers binds
document.addEventListener('DOMContentLoaded', () => {
  new ThreatRadar('radar-screen-canvas');
  window.threatGrid = new ThreatIntelligenceGrid();
});
