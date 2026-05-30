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

// Threat Center simulator & Incident list dispatcher
document.addEventListener('DOMContentLoaded', () => {
  new ThreatRadar('radar-screen-canvas');

  // Logs updates
  const logScrollArea = document.getElementById('log-scroll-area');
  
  window.ShieldEvents.on('newSystemLog', (logData) => {
    if (!logScrollArea) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${logData.type}`;
    
    entry.innerHTML = `
      <span class="log-time">[${logData.time}]</span>
      <span class="log-message">${logData.msg}</span>
    `;
    
    logScrollArea.insertBefore(entry, logScrollArea.firstChild);
    
    // Truncate to max 50 entries
    if (logScrollArea.children.length > 50) {
      logScrollArea.removeChild(logScrollArea.lastChild);
    }
  });

  // Threat Simulations Setup
  const threatSimBtn = document.getElementById('trigger-threat-sim-btn');
  if (threatSimBtn) {
    threatSimBtn.addEventListener('click', () => {
      triggerThreatSimulation();
    });
  }
  
  // Threat Visualizer Canvas (Threat View page)
  const threatCanvas = document.getElementById('threat-canvas-feed');
  if (threatCanvas) {
    initThreatFeed(threatCanvas);
  }
});

function initThreatFeed(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 360;
  let targetX = 320;
  let targetY = 180;
  let animTick = 0;

  function renderThreatFeed() {
    animTick++;
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scrolling grid
    ctx.strokeStyle = window.ShieldState.systemStatus === 'THREAT_ALERT' ? 'rgba(255, 56, 96, 0.05)' : 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = (animTick % 30); y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Dynamic vertical sonar scanning line sweep
    const sweepY = ((Math.sin(animTick * 0.02) + 1) / 2) * canvas.height;
    ctx.strokeStyle = window.ShieldState.systemStatus === 'THREAT_ALERT' ? 'rgba(255, 56, 96, 0.25)' : 'rgba(0, 242, 254, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, sweepY);
    ctx.lineTo(canvas.width, sweepY);
    ctx.stroke();

    // Draw simulated target tracking box (if active threat)
    if (window.ShieldState.systemStatus === 'THREAT_ALERT') {
      // Oscillating coordinate offsets
      const cx = targetX + Math.sin(animTick * 0.05) * 40;
      const cy = targetY + Math.cos(animTick * 0.05) * 20;

      // Draw bounding box
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 50, cy - 80, 100, 160);

      // Draw tracking reticle corners
      ctx.fillStyle = 'var(--neon-red)';
      // Top Left Corner
      ctx.fillRect(cx - 55, cy - 85, 15, 3);
      ctx.fillRect(cx - 55, cy - 85, 3, 15);
      // Top Right
      ctx.fillRect(cx + 40, cy - 85, 15, 3);
      ctx.fillRect(cx + 52, cy - 85, 3, 15);
      // Bottom Left
      ctx.fillRect(cx - 55, cy + 77, 15, 3);
      ctx.fillRect(cx - 55, cy + 67, 3, 15);
      // Bottom Right
      ctx.fillRect(cx + 40, cy + 77, 15, 3);
      ctx.fillRect(cx + 52, cy + 67, 3, 15);

      // AI locking reticle lines
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();

      // Lock status tags
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '10px monospace';
      ctx.fillText(`AI LOCK: 98.7% CONFIDENCE`, cx - 48, cy - 95);
      ctx.fillText(`TARGET: ILLEGAL_OBJECT`, cx - 48, cy + 105);
      
      // Coordinates text
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText(`AZ: ${Math.round(cx)} EL: ${Math.round(cy)} [RESTRICTED THREAT]`, cx - 48, cy - 110);

      // Draw on-screen ZKP Ethical decision card
      ctx.fillStyle = 'rgba(255, 56, 96, 0.15)';
      ctx.fillRect(15, 15, 230, 45);
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.strokeRect(15, 15, 230, 45);
      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText("ETHICAL SHIELD INTERCEPTED DECRYPT", 20, 26);
      ctx.fillStyle = 'var(--neon-red)';
      ctx.fillText("Reason: Weapon-like object detected with 91% confidence.", 20, 36);
      ctx.fillText("Action: Anonymization bypassed via legal multi-sig warrant.", 20, 46);

    } else {
      // IDLE STATE - Render active citizen zero-trust anonymity sweep!
      const cx = 180 + ((animTick * 1.2) % 300);
      const cy = 190 + Math.sin(animTick * 0.03) * 12;

      // Draw green box representing secure citizen blur
      ctx.strokeStyle = 'var(--neon-green)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 35, cy - 65, 70, 130);

      // Bounding brackets
      ctx.fillStyle = 'var(--neon-green)';
      ctx.fillRect(cx - 39, cy - 69, 10, 2); ctx.fillRect(cx - 39, cy - 69, 2, 10);
      ctx.fillRect(cx + 29, cy - 69, 10, 2); ctx.fillRect(cx + 37, cy - 69, 2, 10);
      ctx.fillRect(cx - 39, cy + 63, 10, 2); ctx.fillRect(cx - 39, cy + 55, 2, 10);
      ctx.fillRect(cx + 29, cy + 63, 10, 2); ctx.fillRect(cx + 37, cy + 55, 2, 10);

      // Metadata tags
      ctx.fillStyle = 'var(--neon-green)';
      ctx.font = '8px monospace';
      ctx.fillText("CIVILIAN_8492-A [ANONYMIZED]", cx - 32, cy - 75);
      ctx.fillText("SHIELD MATRIX: SECURE", cx - 32, cy + 85);

      // Draw facial blur circle
      ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy - 40, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText("FACE SHIELD", cx - 22, cy - 38);

      // On-screen Ethical explainability logs
      ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.fillRect(15, 15, 230, 55);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.strokeRect(15, 15, 230, 55);
      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText("ETHICAL MASK ENGINE: ACTIVE", 20, 26);
      ctx.fillStyle = 'var(--neon-green)';
      ctx.fillText("Status: Privacy protection activated because no", 20, 36);
      ctx.fillText("criminal activity was detected.", 20, 46);
      ctx.fillText("Zero-Trust Anonymization Matrix secured.", 20, 56);

      // Predictive Threat Engine status ticker on screen bottom left
      ctx.fillStyle = 'rgba(5, 5, 8, 0.6)';
      ctx.fillRect(15, canvas.height - 35, 250, 20);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.strokeRect(15, canvas.height - 35, 250, 20);
      ctx.fillStyle = 'var(--neon-cyan)';
      ctx.font = '7px monospace';
      ctx.fillText(`PREDICTIVE THREAT SEARCH SEC-04: ${(10 + Math.sin(animTick * 0.01) * 3).toFixed(1)}% RISK VALUE`, 20, canvas.height - 23);
    }

    requestAnimationFrame(renderThreatFeed);
  }
  renderThreatFeed();
}

function triggerThreatSimulation() {
  window.ShieldState.systemStatus = 'THREAT_ALERT';
  
  // Dispatch global alert event
  window.ShieldEvents.emit('alertTriggered', {
    message: "WEAPON INTRUDER DETECTED - METRO LINK STATION B"
  });

  // Open the fullscreen alert warning modal popup
  const alertPopup = document.getElementById('global-red-alert-popup');
  if (alertPopup) {
    alertPopup.style.display = 'flex';
    alertPopup.classList.add('active');
  }

  // Engage screen red flashing overlay
  const flashOverlay = document.getElementById('screen-red-flash');
  if (flashOverlay) {
    flashOverlay.classList.add('flashing');
  }

  // Switch to Tactical view tab
  window.navigateToView('tactical');

  // Push system log
  window.ShieldEvents.emit('newSystemLog', {
    time: new Date().toLocaleTimeString(),
    type: 'critical',
    msg: "AI WARNING: Class-4 Threat Detected (Unverified weapon scan) on Station-B CCTV"
  });

  // Update AI UI elements in threat dashboard
  const meterCircle = document.getElementById('ai-threat-gauge');
  const percentText = document.getElementById('ai-threat-percentage');
  const levelText = document.getElementById('ai-threat-level-badge');
  const typeText = document.getElementById('ai-threat-type');
  const ethicalCard = document.getElementById('ai-ethical-decision-card');
  
  if (meterCircle && percentText) {
    meterCircle.style.strokeDashoffset = 8.8;
    percentText.innerText = "98.7%";
    levelText.className = "cyber-badge danger";
    levelText.innerText = "CRITICAL RISK";
    typeText.innerText = "Illicit Armament";
  }

  if (ethicalCard) {
    ethicalCard.innerHTML = `
      <span style="color: var(--neon-red); font-weight:bold;">[AI OVERRIDE ENGAGED]</span><br>
      <span style="color: #fff;">Reason: Weapon-like object detected with 91% confidence inside Metro Station Corridor.</span><br>
      <span style="color: var(--neon-yellow);">Action: Authorized bypass unmasked local face tracking grids. Block logged on chain.</span>
    `;
  }
}
