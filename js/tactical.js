/* Emergency Tactical Intercept Grid Controller for ShadowShield AI */

class TacticalConsole {
  constructor() {
    this.canvas = document.getElementById('tactical-targeting-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width = 600;
      this.height = this.canvas.height = 300;
    }
    this.animTick = 0;
    this.droneX = 50;
    this.droneY = 50;
    this.targetX = 420;
    this.targetY = 200;
    this.droneSpeed = 1.8;
    this.eta = 15.0; // Dynamic ETA calculation in seconds
    
    // Checklist execution states
    this.checklistIndex = 0;
    this.checklistTimer = null;
    
    this.init();
    this.setupListeners();
  }

  init() {
    if (this.canvas) {
      this.startTargetingLoop();
    }
  }

  setupListeners() {
    // When alert triggers, initiate lockdown sequence
    window.ShieldEvents.on('alertTriggered', () => {
      this.resetLockdownSequence();
      this.startLockdownSequence();
    });

    // When alert is resolved, reset sequence
    window.ShieldEvents.on('alertResolved', () => {
      this.resetLockdownSequence();
    });
  }

  resetLockdownSequence() {
    if (this.checklistTimer) {
      clearTimeout(this.checklistTimer);
      this.checklistTimer = null;
    }
    this.checklistIndex = 0;
    this.eta = 15.0;
    this.droneX = 50;
    this.droneY = 50;
    
    // Reset check status UI
    const ids = ['network', 'anonymity', 'drone', 'dispatch'];
    ids.forEach(id => {
      const el = document.getElementById(`chk-${id}`);
      if (el) {
        el.className = 'checklist-item';
        el.querySelector('.chk-status').innerText = '[ ]';
      }
    });

    const logs = document.getElementById('tactical-timeline-logs');
    if (logs) {
      logs.innerHTML = '<div style="color:var(--text-secondary);">Awaiting tactical threat signal...</div>';
    }
  }

  startLockdownSequence() {
    const logs = document.getElementById('tactical-timeline-logs');
    if (logs) logs.innerHTML = ''; // clear waiting status

    this.addTimelineLog("CRITICAL SYSTEM ALARM: Sector 7 threat detected. Initializing AI containment shell...", "red");
    
    const steps = [
      {
        id: 'network',
        text: "SEVER OUTSIDE NETWORKS",
        log: "LOCKDOWN STEP 1: Firewall barriers erected. External connections cut successfully.",
        voice: "Firewall barriers secured. External connection lines severed."
      },
      {
        id: 'anonymity',
        text: "FORCE CIVILIAN ANONYMITY",
        log: "LOCKDOWN STEP 2: Civilian identity feeds masked globally. Local metadata scrambled.",
        voice: "Civilian privacy matrix engaged globally. Citizen indices encrypted."
      },
      {
        id: 'drone',
        text: "DEPLOY PATROL DRONE SEC-07",
        log: "LOCKDOWN STEP 3: Tactical drone unit dispatched to grid coordinates.",
        voice: "Tactical drone deployed. Target tracking lock initialized."
      },
      {
        id: 'dispatch',
        text: "DISPATCH INTERCEPT SQUAD",
        log: "LOCKDOWN STEP 4: Local defense unit dispatched. Vector route verified.",
        voice: "Tactical intercept squad dispatched. ETA 12 seconds."
      }
    ];

    const runStep = () => {
      if (this.checklistIndex >= steps.length) return;
      const step = steps[this.checklistIndex];
      
      const el = document.getElementById(`chk-${step.id}`);
      if (el) {
        // Mark active
        el.className = 'checklist-item active';
        el.querySelector('.chk-status').innerText = '[/]';
      }

      this.checklistTimer = setTimeout(() => {
        // Mark done
        if (el) {
          el.className = 'checklist-item done';
          el.querySelector('.chk-status').innerText = '[x]';
        }

        // Add log
        this.addTimelineLog(step.log, "green");
        
        // play alert tones
        if (window.ShieldAudio) window.ShieldAudio.playSuccess();
        
        // Speak alert description
        if (window.ShieldEvents) window.ShieldEvents.emit('voiceSpeak', step.voice);

        this.checklistIndex++;
        
        // Schedule next step
        this.checklistTimer = setTimeout(runStep, 1500);
      }, 1200);
    };

    // Run first step
    this.checklistTimer = setTimeout(runStep, 800);
  }

  addTimelineLog(msg, colorClass = '') {
    const logs = document.getElementById('tactical-timeline-logs');
    if (!logs) return;
    
    const timeStr = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `timeline-log-entry ${colorClass}`;
    entry.innerHTML = `<span style="color:var(--text-muted); font-size: 8px;">[${timeStr}]</span> ${msg}`;
    
    logs.insertBefore(entry, logs.firstChild);
  }

  drawTargetingRadar() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.animTick++;

    const isAlarm = window.ShieldState.systemStatus === 'THREAT_ALERT';

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Draw background grid lines
    ctx.strokeStyle = isAlarm ? 'rgba(255, 56, 96, 0.04)' : 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < this.width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    // Draw concentric threat rings in center
    ctx.strokeStyle = isAlarm ? 'rgba(255, 56, 96, 0.15)' : 'rgba(0, 242, 254, 0.15)';
    for (let r = 40; r < 200; r += 40) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(this.width, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, this.height);
    ctx.stroke();

    // Radar scan lines sweeping
    const angle = this.animTick * 0.015;
    ctx.strokeStyle = isAlarm ? 'rgba(255, 56, 96, 0.2)' : 'rgba(0, 242, 254, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 300, cy + Math.sin(angle) * 300);
    ctx.stroke();

    // Draw Drone Intercept Node
    if (isAlarm) {
      // Guide drone towards target
      const dx = this.targetX - this.droneX;
      const dy = this.targetY - this.droneY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 3) {
        this.droneX += (dx / dist) * this.droneSpeed;
        this.droneY += (dy / dist) * this.droneSpeed;
        this.eta = +(dist / (this.droneSpeed * 30)).toFixed(1);
      } else {
        this.droneX = this.targetX;
        this.droneY = this.targetY;
        this.eta = 0.0;
      }

      // Update ETA and Intruder details in DOM
      const etaEl = document.getElementById('tactical-drone-eta');
      if (etaEl) {
        etaEl.innerText = `${this.eta}s`;
        etaEl.style.color = this.eta === 0 ? "var(--neon-green)" : "var(--neon-yellow)";
      }

      const coordsEl = document.getElementById('tactical-intruder-coords');
      if (coordsEl) {
        // Display animated target coordinates
        const displayX = +(this.targetX / 10 + Math.sin(this.animTick * 0.1) * 0.2).toFixed(2);
        const displayY = +(this.targetY / 10 + Math.cos(this.animTick * 0.1) * 0.2).toFixed(2);
        coordsEl.innerText = `X: ${displayX} Y: ${displayY}`;
      }

      // Draw vector linking drone and target
      ctx.strokeStyle = 'rgba(243, 243, 21, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.droneX, this.droneY);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Drone Unit
      ctx.fillStyle = 'var(--neon-purple)';
      ctx.shadowColor = 'var(--neon-purple)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.droneX, this.droneY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText("DRONE_07", this.droneX + 8, this.droneY - 4);

      // Draw Target Intruder Unit
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.targetX - 8, this.targetY - 8, 16, 16);

      // Flashing alert crosshairs on target
      if (this.animTick % 20 < 10) {
        ctx.fillStyle = 'rgba(255, 56, 96, 0.2)';
        ctx.fillRect(this.targetX - 8, this.targetY - 8, 16, 16);
      }

      ctx.fillStyle = 'var(--neon-red)';
      ctx.fillText("INTRUDER_LOCK", this.targetX + 12, this.targetY - 2);
    } else {
      // Idle simulation: static scanner sweep readouts
      const radarSweepX = cx + Math.sin(this.animTick * 0.01) * 120;
      const radarSweepY = cy + Math.cos(this.animTick * 0.01) * 60;
      
      ctx.strokeStyle = 'var(--neon-cyan)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(radarSweepX, radarSweepY, 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'var(--neon-cyan)';
      ctx.font = '7px monospace';
      ctx.fillText("CIVILIAN_FEED_NOMINAL", radarSweepX + 8, radarSweepY - 2);

      const etaEl = document.getElementById('tactical-drone-eta');
      if (etaEl) etaEl.innerText = "STANDBY";
      
      const coordsEl = document.getElementById('tactical-intruder-coords');
      if (coordsEl) coordsEl.innerText = "NO THREATS ACQUIRED";
    }
  }

  startTargetingLoop() {
    const render = () => {
      this.drawTargetingRadar();
      requestAnimationFrame(render);
    };
    render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tacticalConsole = new TacticalConsole();
});
