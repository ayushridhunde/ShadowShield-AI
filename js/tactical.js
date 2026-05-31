/* Coordinated Emergency Command Center Controller for ShadowShield AI */

class EmergencyCommandDeck {
  constructor() {
    // 1. Core Target canvases and contexts
    this.targetCanvas = document.getElementById('tactical-targeting-canvas');
    this.cctvCanvases = [
      document.getElementById('tactical-cctv-1'),
      document.getElementById('tactical-cctv-2'),
      document.getElementById('tactical-cctv-3'),
      document.getElementById('tactical-cctv-4')
    ];
    this.metricsCanvas = document.getElementById('tactical-live-metrics-chart');

    // Canvas contexts
    this.tCtx = this.targetCanvas ? this.targetCanvas.getContext('2d') : null;
    this.cCtxs = this.cctvCanvases.map(canvas => canvas ? canvas.getContext('2d') : null);
    this.mCtx = this.metricsCanvas ? this.metricsCanvas.getContext('2d') : null;

    // Dimensions
    if (this.targetCanvas) {
      this.targetCanvas.width = 460;
      this.targetCanvas.height = 250;
    }
    this.cctvCanvases.forEach(canvas => {
      if (canvas) {
        canvas.width = 160;
        canvas.height = 110;
      }
    });
    if (this.metricsCanvas) {
      this.metricsCanvas.width = 300;
      this.metricsCanvas.height = 110;
    }

    // 2. Coordinated Telemetry state variables
    this.animTick = 0;
    this.zoomLevel = 1.0;
    this.threatType = 'weapon';
    this.countdownSeconds = 59;
    this.countdownTimer = null;
    this.sirenActive = false;
    this.lockdownEnabled = false;

    // Movement coordinate parameters
    this.targetX = 320;
    this.targetY = 140;
    this.droneX = 50;
    this.droneY = 50;
    this.squadX = 400;
    this.squadY = 220;

    // Interactive speeds
    this.droneSpeed = 1.6;
    this.squadSpeed = 0.9;
    this.eta = 12.0;

    // Metrics graph points
    this.metricsHistory = [];
    for (let i = 0; i < 40; i++) {
      this.metricsHistory.push(50 + Math.sin(i * 0.4) * 15);
    }

    this.init();
    this.setupControlHooks();
  }

  init() {
    // Begin main execution loop
    if (this.tCtx) {
      this.startTargetingAnimation();
    }
    
    // Setup general event bindings
    if (window.ShieldEvents) {
      window.ShieldEvents.on('alertTriggered', () => this.handleAlertTrigger());
      window.ShieldEvents.on('alertResolved', () => this.handleAlertResolve());
    }
  }

  setupControlHooks() {
    // Zoom focus buttons
    const zooms = ['1x', '2x', '4x', '8x'];
    zooms.forEach(z => {
      const btn = document.getElementById(`tzoom-${z}`);
      if (btn) {
        btn.addEventListener('click', () => {
          zooms.forEach(x => {
            const b = document.getElementById(`tzoom-${x}`);
            if (b) b.classList.remove('active');
          });
          btn.classList.add('active');
          this.zoomLevel = parseFloat(z);
          this.addTimelineLog(`Tactical focal index calibrated to: ${z} zoom magnification`, 'yellow');
          if (window.ShieldAudio) window.ShieldAudio.playClick();
        });
      }
    });

    // Threat Selection dropdown change
    const selector = document.getElementById('tactical-threat-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.changeThreatProfile(e.target.value);
      });
    }

    // Emergency Control Buttons
    const btnLockdown = document.getElementById('tactical-btn-lockdown');
    if (btnLockdown) {
      btnLockdown.addEventListener('click', () => this.toggleLockdown());
    }

    const btnNeutralize = document.getElementById('tactical-btn-neutralize');
    if (btnNeutralize) {
      btnNeutralize.addEventListener('click', () => this.neutralizeThreat());
    }

    const btnReroute = document.getElementById('tactical-btn-reroute');
    if (btnReroute) {
      btnReroute.addEventListener('click', () => this.rerouteDrones());
    }

    const btnSiren = document.getElementById('tactical-btn-siren');
    if (btnSiren) {
      btnSiren.addEventListener('click', () => this.toggleSirenAudio());
    }
  }

  // 3. Dynamic Alert activation triggers
  handleAlertTrigger() {
    document.body.classList.add('red-alert-active');
    this.sirenActive = true;
    this.lockdownEnabled = true;

    // Reset coordinates for chase simulation
    this.droneX = 40;
    this.droneY = 30;
    this.squadX = 420;
    this.squadY = 210;
    this.countdownSeconds = 59;

    // Start countdown
    this.startCountdown();

    // Load recommendations
    this.changeThreatProfile(this.threatType, true);

    // Initial logs entries
    this.addTimelineLog("EMERGENCY COMMAND CENTER DECK INITIALIZED - ALL FEEDS ONLINE", "red");
    this.addCoordinatedChatter("SHIELD_AI", "Threat classification verified. Security overrides active.");
    this.addCoordinatedChatter("OPERATOR", "Acknowledging RED ALERT. Sector lockdown barriers initiated.");
    
    // Add blocks on blockchain log
    this.mineBlockchainBlock("EMERGENCY_OVERRIDE", "Global privacy unmask active for Sector 07");
    this.mineBlockchainBlock("LOCKDOWN_INITIATE", "Pulsing safety barriers closed in target sector");
  }

  handleAlertResolve() {
    document.body.classList.remove('red-alert-active');
    this.sirenActive = false;
    this.lockdownEnabled = false;
    this.stopCountdown();

    if (window.ShieldAudio) {
      window.ShieldAudio.stopSiren();
    }

    // Reset DEFCON boxes
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`defcon-${i}`);
      if (el) {
        el.classList.remove('active');
        if (i === 5) el.classList.add('active'); // DEFCON 5 is idle
      }
    }
  }

  // 4. Custom spoken Jarvis AI sequences
  speakJarvisEmergency() {
    // Handled in voice.js to prevent concurrent SpeechSynthesis overlaps
  }

  // 5. Tactical interactive action controls
  changeThreatProfile(type, quiet = false) {
    this.threatType = type;
    const recContainer = document.getElementById('tactical-recommendations-log');
    const decisionLog = document.getElementById('tactical-ai-decision-log');
    
    let recsHtml = '';
    let decisionsText = '';
    let voiceAnnouncement = '';
    let defconLevel = 1;
    let targetName = 'SUSPECT_LOCK';

    switch (type) {
      case 'weapon':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] Sever local metro terminal grids</div>
          <div class="rec-item enacted">[AI ENFORCED] Deploy tactical drone-07 to station exits</div>
          <div class="rec-item">[RECOMMENDED] Dispatch Rapid Intercept Squad Bravo</div>
          <div class="rec-item">[RECOMMENDED] Enable multi-sig facial override verification</div>
        `;
        decisionsText = `• AI weapon detector registered positive firearm scan (98.7% confidence)<br>• Civilian privacy shield bypassed locally inside Sector 07 corridor<br>• Drone tracking algorithm locks onto velocity path vector`;
        voiceAnnouncement = "Weapon Detection threat profile loaded. Firearm scan positive. Launching surveillance drone-07.";
        this.targetX = 320; this.targetY = 140;
        defconLevel = 1;
        break;

      case 'violence':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] Broadcaster citizen evacuation alerts</div>
          <div class="rec-item enacted">[AI ENFORCED] Dispatching police defense units to plaza</div>
          <div class="rec-item">[RECOMMENDED] Engage smart crowd scattering sensors</div>
          <div class="rec-item">[RECOMMENDED] Lockdown surrounding shopping sectors</div>
        `;
        decisionsText = `• Riot and violent disorder threshold exceeded in Plaza square<br>• Dispatching civic units. Comm link secured via radio band-12<br>• Real-time crowd density vector tracks anomalous group loads`;
        voiceAnnouncement = "Violent activity incident detected. Mobilizing police intercept forces to Sector 04 plaza.";
        this.targetX = 140; this.targetY = 190;
        defconLevel = 2;
        break;

      case 'intrusion':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] Seal reinforced vaults gate perimeter</div>
          <div class="rec-item">[RECOMMENDED] Cut local subnet connections for breach security</div>
          <div class="rec-item">[RECOMMENDED] Dispatch security patrol units to zone-9</div>
        `;
        decisionsText = `• Security breach warning: Zone 9 restricted gates forced open<br>• Local metadata records cryptographic warrant scan authorized<br>• Laser barrier activation in coordinate Sector 09 confirmed`;
        voiceAnnouncement = "Intrusion alarm active. Restricted zone boundary violation. Sealing secure perimeter.";
        this.targetX = 240; this.targetY = 80;
        defconLevel = 2;
        break;

      case 'crowd':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] Force zero-trust anonymity mask grids</div>
          <div class="rec-item">[RECOMMENDED] Monitor exit transit bottlenecks</div>
          <div class="rec-item">[RECOMMENDED] Scan focal group boundaries for potential weapons</div>
        `;
        decisionsText = `• Public transit crowd shielding indices exceed baseline levels<br>• Zero-trust audit check: No immediate threat signature registered<br>• Anonymity parameters maintained at high level`;
        voiceAnnouncement = "Suspicious crowd density threshold met. Scanning target environment for hazardous objects.";
        this.targetX = 280; this.targetY = 160;
        defconLevel = 3;
        break;

      case 'cyber':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] Engage Quantum encryption vaults</div>
          <div class="rec-item enacted">[AI ENFORCED] sever external API gateway server bridges</div>
          <div class="rec-item">[RECOMMENDED] Re-route command server nodes to backup clusters</div>
        `;
        decisionsText = `• Critical brute-force intrusion vector caught on Central Core Database<br>• Severing connection lines to outer networks<br>• AI firewall active. System integrity index stable`;
        voiceAnnouncement = "Quantum cyberattack detected. database cluster under intrusion attempts. Engaging security walls.";
        this.targetX = 230; this.targetY = 125;
        defconLevel = 1;
        break;

      case 'breach':
        recsHtml = `
          <div class="rec-item enacted">[AI ENFORCED] isolate containment grid Alpha completely</div>
          <div class="rec-item">[RECOMMENDED] Deploy localized smoke deterrent units</div>
          <div class="rec-item">[RECOMMENDED] Lock municipal terminal doors in target sectors</div>
        `;
        decisionsText = `• Sector 7 restricted research facility door forced breached<br>• Tracking movement velocity vector of intruder: 2.1 m/s north<br>• Dispatching drone pursuit tracking locks`;
        voiceAnnouncement = "Restricted sector breach confirmed. Securing facility containment structures.";
        this.targetX = 390; this.targetY = 110;
        defconLevel = 1;
        break;
    }

    if (recContainer) recContainer.innerHTML = recsHtml;
    if (decisionLog) decisionLog.innerHTML = decisionsText;

    // Toggle DEFCON status UI
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`defcon-${i}`);
      if (el) {
        el.classList.remove('active');
        if (i === defconLevel) {
          el.classList.add('active');
        }
      }
    }

    // Speak announcement if not quiet
    if (!quiet && window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', voiceAnnouncement);
    }

    this.addTimelineLog(`Threat category re-calibrated to: ${type.toUpperCase()}`, 'red');
    this.addCoordinatedChatter("AI_COMMAND", `Re-routing response units to tactical coordinates.`);
    this.mineBlockchainBlock("THREAT_CLASSIFY", `Calibrated alert profiles to category type: ${type}`);
  }

  toggleLockdown() {
    this.lockdownEnabled = !this.lockdownEnabled;
    const btn = document.getElementById('tactical-btn-lockdown');
    
    if (this.lockdownEnabled) {
      if (btn) btn.innerText = "BARRIER DEACTIVATED";
      this.addTimelineLog("COMMAND INTERCEPT: Barrier zone lockdown enforced.", "red");
      this.addCoordinatedChatter("SQUAD-B", "Lockdown gates secured. Containment zone blocked.");
      this.mineBlockchainBlock("SEC_LOCKDOWN", "Sector gates locked. Multi-barrier active.");
      if (window.ShieldEvents) window.ShieldEvents.emit('voiceSpeak', "Initiating emergency lockdown.");
    } else {
      if (btn) btn.innerText = "LOCKDOWN BARRIER";
      this.addTimelineLog("COMMAND INTERCEPT: Lockdown override authorized. Opening gates.", "yellow");
      this.addCoordinatedChatter("SQUAD-B", "Gates open. Standby mode.");
      this.mineBlockchainBlock("OVERRIDE_GATE", "Lockdown barriers released by command staff");
      if (window.ShieldEvents) window.ShieldEvents.emit('voiceSpeak', "Restoring tactical barriers.");
    }

    if (window.ShieldAudio) window.ShieldAudio.playSuccess();
  }

  toggleSirenAudio() {
    const btn = document.getElementById('tactical-btn-siren');
    if (this.sirenActive) {
      this.sirenActive = false;
      if (btn) btn.innerText = "SIREN SOUNDS ENABLED";
      if (window.ShieldAudio) window.ShieldAudio.stopSiren();
      this.addTimelineLog("SIREN ALARMS ENGAGED IN STEALTH SILENT OPERATION", "yellow");
    } else {
      this.sirenActive = true;
      if (btn) btn.innerText = "MUTE SIREN";
      if (window.ShieldAudio) window.ShieldAudio.startSiren();
      this.addTimelineLog("SIREN ALARMS ACTIVATED AUDIBLY AT CORE FREQUENCY", "red");
    }
  }

  rerouteDrones() {
    // Reset drone position to target coordinate, updating drone pursuit simulation
    this.droneX = this.targetCanvas.width - this.droneX;
    this.droneY = this.targetCanvas.height - this.droneY;
    this.eta = 15.0; // reset chase timer

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Deploying surveillance drones.");
      window.ShieldEvents.emit('droneRerouted');
    }
    this.addTimelineLog("TACTICAL MANEUVER: Surveillance Drone-07 re-routed dynamically.", "yellow");
    this.addCoordinatedChatter("DRONE-07", "Steering system recalibrated. High resolution optical locks engaged.");
    this.mineBlockchainBlock("DRONE_REROUTE", "Realigned aerial vector paths targeting suspect coordinates");
  }

  neutralizeThreat() {
    // Play victory chimes and sound effects
    if (window.ShieldAudio) {
      window.ShieldAudio.stopSiren();
      window.ShieldAudio.playSuccess();
    }

    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Threat neutralized. Containment grid clear. Restoring normal municipal parameters.");
      window.ShieldEvents.emit('threatNeutralized');
    }

    // Mine successful block
    this.mineBlockchainBlock("THREAT_NEUTRALIZED", "Incident resolved successfully. Security indexes normal.");

    this.addTimelineLog("CRITICAL SECURITY CLEARANCE: Threat successfully neutralized. Containment grids nominal.", "green");
    this.addCoordinatedChatter("SQUAD-B", "Suspect captured. All safety vectors secure. Returning to base.");
    
    // Stop timers
    this.stopCountdown();

    // Trigger overlay alert clear
    if (typeof window.closeGlobalAlertPopup === 'function') {
      window.closeGlobalAlertPopup();
    }

    // Switch view back to neural command center SPA view
    setTimeout(() => {
      if (window.navigateToView) {
        window.navigateToView('monitor');
      }
    }, 2800);
  }

  // 6. Clock and timer loops
  startCountdown() {
    this.stopCountdown();
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.countdownSeconds = 0;
        this.stopCountdown();
        this.addTimelineLog("CONTAINMENT TIME ELAPSED: Automatic security shields forced closed.", "red");
        if (window.ShieldEvents) window.ShieldEvents.emit('voiceSpeak', "Threat approaching restricted zone. Security seals active.");
      }

      // Update HUD Element
      const timerEl = document.getElementById('tactical-countdown-timer');
      if (timerEl) {
        const mins = String(Math.floor(this.countdownSeconds / 60)).padStart(2, '0');
        const secs = String(this.countdownSeconds % 60).padStart(2, '0');
        timerEl.innerText = `${mins}:${secs}`;
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  // 7. Dynamic Data Generators (Logs, Chatter, Blockchain)
  addTimelineLog(msg, color = 'green') {
    const timeStr = new Date().toLocaleTimeString();
    this.addCoordinatedChatter("LOG", msg);
  }

  addCoordinatedChatter(sender, msg) {
    const container = document.getElementById('tactical-comm-feed');
    if (!container) return;

    const timeStr = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = 'comm-item';
    item.innerHTML = `<span style="color:var(--text-muted)">[${timeStr}]</span> <strong>${sender}:</strong> ${msg}`;

    container.insertBefore(item, container.firstChild);
    
    // Truncate
    if (container.children.length > 25) {
      container.removeChild(container.lastChild);
    }
  }

  mineBlockchainBlock(action, details) {
    const container = document.getElementById('tactical-blockchain-logs');
    if (!container) return;

    const blockId = 8400 + container.children.length;
    const hash = '0x' + Math.random().toString(16).substring(2, 8).toUpperCase() + '...';
    
    const item = document.createElement('div');
    item.className = 'ledger-item';
    item.innerHTML = `
      <span style="color:var(--neon-red)">#${blockId} [${action}]</span>
      <span style="color:var(--text-secondary); font-size:7px;">${details}</span>
      <strong style="color:var(--neon-yellow)">${hash}</strong>
    `;

    container.insertBefore(item, container.firstChild);

    // Truncate
    if (container.children.length > 25) {
      container.removeChild(container.lastChild);
    }

    // Push into the central Blockchain app state ledger if available
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: `TACTICAL ALARM: Blocked transaction [${action}] - ${details}`,
        validator: "TACTICAL_LEDGER_ORACLE"
      });
    }
  }

  // 8. HTML5 High-Tech Canvas drawings
  drawTargetingRadar() {
    if (!this.tCtx) return;
    const ctx = this.tCtx;
    const width = this.targetCanvas.width;
    const height = this.targetCanvas.height;

    // Clear background
    ctx.fillStyle = '#070203';
    ctx.fillRect(0, 0, width, height);

    // Dynamic zoom scale factor
    ctx.save();
    if (this.zoomLevel > 1.0) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(this.zoomLevel * 0.7, this.zoomLevel * 0.7);
      ctx.translate(-width / 2, -height / 2);
    }

    // Draw background blueprint grids
    ctx.strokeStyle = 'rgba(255, 56, 96, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Draw scanning vector concentric threat rings
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = 'rgba(255, 56, 96, 0.15)';
    for (let r = 50; r < 250; r += 50) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
    ctx.stroke();

    // Active Target locking and movements calculations
    const isAlarm = document.body.classList.contains('red-alert-active');
    
    if (isAlarm) {
      // Suspect target dot jitter
      const suspectX = this.targetX + Math.sin(this.animTick * 0.08) * 6;
      const suspectY = this.targetY + Math.cos(this.animTick * 0.08) * 4;

      // Drone coordinates tracking vector moves towards suspect
      const dx = suspectX - this.droneX;
      const dy = suspectY - this.droneY;
      const dDist = Math.sqrt(dx * dx + dy * dy);
      
      if (dDist > 5) {
        this.droneX += (dx / dDist) * this.droneSpeed;
        this.droneY += (dy / dDist) * this.droneSpeed;
        this.eta = +(dDist / (this.droneSpeed * 25)).toFixed(1);
      } else {
        this.droneX = suspectX;
        this.droneY = suspectY;
        this.eta = 0.0;
      }

      // Police Squad vehicle coordinates tracking moves towards suspect
      const sx = suspectX - this.squadX;
      const sy = suspectY - this.squadY;
      const sDist = Math.sqrt(sx * sx + sy * sy);
      
      if (sDist > 5) {
        this.squadX += (sx / sDist) * this.squadSpeed;
      } else {
        this.squadX = suspectX;
        this.squadY = suspectY;
      }

      // Update ETA text in DOM
      const etaEl = document.getElementById('tactical-police-eta');
      if (etaEl) {
        etaEl.innerText = `${this.eta}s`;
        etaEl.style.color = this.eta < 3.0 ? "var(--neon-green)" : "var(--neon-yellow)";
      }

      // 1. Draw dashed line for predictive suspect movement path
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(suspectX, suspectY);
      ctx.quadraticCurveTo(suspectX - 40, suspectY + 40, suspectX - 80, suspectY + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw laser locking beam between drone and target
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.droneX, this.droneY);
      ctx.lineTo(suspectX, suspectY);
      ctx.stroke();

      // 3. Draw containment grid zone bubble around target
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.15)';
      ctx.fillStyle = 'rgba(255, 56, 96, 0.04)';
      ctx.beginPath();
      ctx.arc(suspectX, suspectY, 40 + Math.sin(this.animTick * 0.1) * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 4. Draw Drone unit
      ctx.fillStyle = 'var(--neon-purple)';
      ctx.beginPath();
      ctx.arc(this.droneX, this.droneY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText("DRONE_07", this.droneX + 8, this.droneY - 2);

      // 5. Draw Police Squad vehicle
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(this.squadX, this.squadY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText("SQUAD_B", this.squadX - 18, this.squadY - 9);

      // 6. Draw Suspect target locking crosshairs
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 2;
      ctx.strokeRect(suspectX - 10, suspectY - 10, 20, 20);

      // Pulse scanning reticle
      if (this.animTick % 20 < 10) {
        ctx.fillStyle = 'rgba(255, 56, 96, 0.25)';
        ctx.fillRect(suspectX - 10, suspectY - 10, 20, 20);
      }

      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '9px monospace';
      ctx.fillText(`LOCK: [${targetName}]`, suspectX + 15, suspectY + 4);
      ctx.fillText(`X:${Math.round(suspectX)} Y:${Math.round(suspectY)}`, suspectX + 15, suspectY + 14);

    } else {
      // IDLE simulation mode - rotating radar sweeping line
      const angle = this.animTick * 0.012;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText("SENTINEL RADAR STANDBY: NO THREATS DETECTED", 20, 25);
    }

    ctx.restore();
  }

  drawCCTVFeeds() {
    const isAlarm = document.body.classList.contains('red-alert-active');
    
    this.cCtxs.forEach((ctx, idx) => {
      if (!ctx) return;
      const w = this.cctvCanvases[idx].width;
      const h = this.cctvCanvases[idx].height;

      // Draw background CCTV video static grid
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, w, h);

      // CRT interlaced scanlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.6;
      for (let y = 0; y < h; y += 3) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      ctx.save();
      if (isAlarm && (idx === 0 || idx === 3)) {
        // Digital zoom focus crop on suspect cams
        ctx.translate(w/2, h/2);
        ctx.scale(1.2, 1.2);
        ctx.translate(-w/2, -h/2);
      }

      switch (idx) {
        case 0: // CAM-01: Plaza square
          // Draw stick figures represent crowd
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(30, 40, 20, 40);
          ctx.fillRect(100, 30, 25, 45);
          
          if (isAlarm) {
            // Draw red locking bounding bracket over threat subject
            ctx.strokeStyle = 'var(--neon-red)';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(60, 25, 40, 60);
            
            ctx.fillStyle = 'var(--neon-red)';
            ctx.font = '6px monospace';
            ctx.fillText("WEAPON_IDENTIFIED", 62, 20);
          } else {
            // Green blur anonymity face circle
            ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
            ctx.beginPath(); ctx.arc(75, 40, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'var(--neon-green)';
            ctx.font = '5px monospace';
            ctx.fillText("MASK ACTIVE", 62, 20);
          }
          break;

        case 1: // CAM-02: Metro gates
          // Sweeping scanlines grid
          const sweepY = ((Math.sin(this.animTick * 0.05) + 1)/2) * h;
          ctx.strokeStyle = isAlarm ? 'rgba(255, 56, 96, 0.3)' : 'rgba(0, 242, 254, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, sweepY); ctx.lineTo(w, sweepY); ctx.stroke();
          
          ctx.fillStyle = isAlarm ? 'var(--neon-red)' : 'var(--neon-cyan)';
          ctx.font = '5px monospace';
          ctx.fillText(`BIOMETRIC_SWEEP: ${isAlarm ? 'CRITICAL_ALERT' : 'STABLE'}`, 10, 15);
          ctx.fillText(`MATCH_DB: ${isAlarm ? 'Kyle_Reese (92%)' : 'NONE'}`, 10, 95);
          break;

        case 2: // CAM-03: Perimeter (Thermal infrared camera)
          // Draw solid blue background with hot orange silhouettes
          ctx.fillStyle = '#020020';
          ctx.fillRect(0,0,w,h);
          
          // Draw glowing thermal human shapes
          ctx.fillStyle = 'rgba(255, 120, 0, 0.6)';
          ctx.beginPath(); ctx.arc(45, 50, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255, 220, 0, 0.8)';
          ctx.beginPath(); ctx.arc(45, 50, 6, 0, Math.PI * 2); ctx.fill();
          
          ctx.fillStyle = 'rgba(255, 120, 0, 0.4)';
          ctx.beginPath(); ctx.arc(115, 60, 10, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = '5px monospace';
          ctx.fillText("THERMAL_IMAGER_v2.0", 5, 10);
          break;

        case 3: // CAM-04: Aerial drone tracker camera
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.arc(w/2, h/2, 45, 0, Math.PI * 2); ctx.stroke();
          
          // crosshairs reticle in center
          ctx.beginPath();
          ctx.moveTo(w/2 - 10, h/2); ctx.lineTo(w/2 + 10, h/2);
          ctx.moveTo(w/2, h/2 - 10); ctx.lineTo(w/2, h/2 + 10);
          ctx.stroke();

          if (isAlarm) {
            // Target locked onto center
            ctx.strokeStyle = 'var(--neon-red)';
            ctx.strokeRect(w/2 - 14, h/2 - 14, 28, 28);
            
            ctx.fillStyle = 'var(--neon-red)';
            ctx.font = '6px monospace';
            ctx.fillText("DRONE_LOCK_ON", w/2 + 18, h/2 - 18);
          }
          break;
      }
      ctx.restore();

      // Top corner rec box
      ctx.fillStyle = 'rgba(255,0,0,0.2)';
      if (isAlarm && this.animTick % 30 < 15) {
        ctx.fillStyle = 'var(--neon-red)';
        ctx.fillRect(w - 22, 5, 15, 6);
        ctx.fillStyle = '#fff';
        ctx.font = '5px monospace';
        ctx.fillText("REC", w - 21, 10);
      }
    });
  }

  drawMetricsChart() {
    if (!this.mCtx) return;
    const ctx = this.mCtx;
    const w = this.metricsCanvas.width;
    const h = this.metricsCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Roll metric values history
    const isAlarm = document.body.classList.contains('red-alert-active');
    const newVal = isAlarm ? (85 + Math.sin(this.animTick * 0.3) * 6) : (25 + Math.sin(this.animTick * 0.2) * 5);
    this.metricsHistory.push(newVal);
    if (this.metricsHistory.length > 50) {
      this.metricsHistory.shift();
    }

    // Draw line charts
    ctx.strokeStyle = isAlarm ? 'var(--neon-red)' : 'var(--neon-blue)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    this.metricsHistory.forEach((val, idx) => {
      const x = (idx / 50) * w;
      const y = h - (val / 100) * h;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area below chart
    ctx.fillStyle = isAlarm ? 'rgba(255, 56, 96, 0.06)' : 'rgba(0, 242, 254, 0.05)';
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Draw rolling gridlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  }

  simulateLiveFeeds() {
    this.animTick++;

    // Draw elements
    this.drawTargetingRadar();
    this.drawCCTVFeeds();
    this.drawMetricsChart();

    // Dynamic UI animations: Jitter radial gauge values on alarm
    const isAlarm = document.body.classList.contains('red-alert-active');
    
    if (isAlarm) {
      const circleFill = document.getElementById('probability-radial-fill');
      const valOverlay = document.getElementById('probability-percentage-value');
      
      const probValue = +(98.1 + Math.sin(this.animTick * 0.1) * 0.6).toFixed(1);
      
      if (circleFill && valOverlay) {
        // Tweak dashoffset (circumference is ~251)
        const offset = 251.2 - (probValue / 100) * 251.2;
        circleFill.style.strokeDashoffset = offset;
        valOverlay.innerText = `${probValue}%`;
      }

      // Add database face biometric feeds periodically
      if (this.animTick % 120 === 0) {
        this.generateBiometricScan();
      }

      // Add simulated patrol communications radio chatter
      if (this.animTick % 220 === 0) {
        this.generateRadioChatter();
      }
    }
  }

  generateBiometricScan() {
    const container = document.getElementById('tactical-facial-scanner');
    if (!container) return;

    const suspects = [
      { name: "Kyle Reese", match: "92.4%", status: "WARRANT_RECOGNITION" },
      { name: "Sarah Connor", match: "89.1%", status: "WARRANT_RECOGNITION" },
      { name: "Susanne Connor", match: "98.7%", status: "CRITICAL_SUSPECT" },
      { name: "Marcus Wright", match: "78.2%", status: "BIOMETRIC_TRACE" }
    ];

    const s = suspects[Math.floor(Math.random() * suspects.length)];
    const item = document.createElement('div');
    item.className = 'scanner-feed-item';
    item.innerHTML = `
      <div class="scanner-avatar-box"></div>
      <div class="scanner-meta">
        <strong>${s.name}</strong><br>
        Match Rate: <span style="color:var(--neon-yellow)">${s.match}</span><br>
        Status: <span style="color:var(--neon-red)">${s.status}</span>
      </div>
    `;

    container.insertBefore(item, container.firstChild);
    
    // Limit to 4 entries
    if (container.children.length > 4) {
      container.removeChild(container.lastChild);
    }
  }

  generateRadioChatter() {
    const chatters = [
      { sender: "SQUAD-B", msg: "Approaching Metro perimeter. Deploying barrier overrides." },
      { sender: "DRONE-07", msg: "Visual lock active. Suspect moves north along exit gate." },
      { sender: "COMMAND", msg: "Acknowledging. Force zero-trust unmasking verified on ledger." },
      { sender: "DRONE-07", msg: "Facial trace matching suspect database. Match rate: 98 percent." },
      { sender: "SQUAD-B", msg: "Target in sight. Closing vectors for containment lock." }
    ];

    const c = chatters[Math.floor(Math.random() * chatters.length)];
    this.addCoordinatedChatter(c.sender, c.msg);
  }

  startTargetingAnimation() {
    const loop = () => {
      this.simulateLiveFeeds();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// 9. Startup initialization
document.addEventListener('DOMContentLoaded', () => {
  window.emergencyConsole = new EmergencyCommandDeck();
});
