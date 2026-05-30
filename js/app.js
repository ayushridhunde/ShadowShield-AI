/* Main Application Controller & SPA Router for ShadowShield AI */

// Global State
const ShieldState = {
  activeView: 'home',
  systemStatus: 'ACTIVE', // 'ACTIVE', 'LOCKDOWN', 'THREAT_ALERT'
  globalAnonymity: true,
  warrantRequired: true,
  behavioralOptOut: false,
  anonymityLevel: 'MAXIMUM', // 'STANDARD', 'MAXIMUM', 'STRICT'
  radarCount: 0,
  lockdownEnabled: false,
  activeWarrantOverride: false,
  verifiedAccessCamId: null
};

// Global Event Bus
const ShieldEvents = {
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in ShieldEvents listener for [${event}]:`, err);
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initClock();
  initGlobalAlerts();
  initDigitalTwinMap();
  
  // Dispatch boot sequences
  writeBootLog("CORE SHIELD SYSTEMS: BOOT SUCCESSFUL");
  writeBootLog("ANONYMITY MATRICES: READY (99.4% STABLE)");
  writeBootLog("BLOCKCHAIN SECURED NODE NETWORK: ON-LINE");
  
  // Set up global hooks for modules
  window.ShieldState = ShieldState;
  window.ShieldEvents = ShieldEvents;

  // Set up click listener on system status indicator to toggle privacy shield
  const statusPanel = document.getElementById('system-status-indicator-panel');
  if (statusPanel) {
    statusPanel.style.cursor = 'pointer';
    statusPanel.style.transition = 'all 0.2s ease';
    
    statusPanel.addEventListener('click', () => {
      // If lockdown is active, we cannot deactivate the shield!
      if (window.ShieldState.lockdownEnabled) {
        window.ShieldEvents.emit('voiceSpeak', "Emergency lockdown is active. Shield cannot be bypassed.");
        if (window.ShieldAudio) window.ShieldAudio.playError();
        return;
      }

      // Toggle state
      const newState = !window.ShieldState.globalAnonymity;
      window.ShieldEvents.emit('shieldToggled', newState);
    });
  }

  // Handle shieldToggled events to update header states
  window.ShieldEvents.on('shieldToggled', (enabled) => {
    window.ShieldState.globalAnonymity = enabled;
    
    const panel = document.getElementById('system-status-indicator-panel');
    const label = document.getElementById('system-status-label');
    if (!panel || !label) return;
    
    if (enabled) {
      panel.classList.remove('deactivated');
      panel.style.background = 'rgba(57, 255, 20, 0.08)';
      panel.style.borderColor = 'rgba(57, 255, 20, 0.2)';
      panel.style.color = 'var(--neon-green)';
      label.innerText = "SHIELD: ACTIVE";
      
      const indicator = panel.querySelector('.hud-system-status-indicator');
      if (indicator) {
        indicator.style.background = 'var(--neon-green)';
        indicator.style.boxShadow = '0 0 8px var(--neon-green)';
      }
      
      window.ShieldEvents.emit('voiceSpeak', "Global Surveillance Privacy Shield engaged. Anonymization matrix active.");
      
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        msg: "SHIELD STATUS: Privacy Shield activated globally."
      });
      
      window.ShieldEvents.emit('logAuditBlock', {
        action: "PRIVACY SHIELD ACTIVATION: Global anonymity protections verified.",
        validator: "SYSTEM_ROOT_ORACLE"
      });
    } else {
      panel.classList.add('deactivated');
      panel.style.background = 'rgba(243, 243, 21, 0.08)';
      panel.style.borderColor = 'rgba(243, 243, 21, 0.2)';
      panel.style.color = 'var(--neon-yellow)';
      label.innerText = "SHIELD: BYPASS";
      
      const indicator = panel.querySelector('.hud-system-status-indicator');
      if (indicator) {
        indicator.style.background = 'var(--neon-yellow)';
        indicator.style.boxShadow = '0 0 8px var(--neon-yellow)';
      }
      
      window.ShieldEvents.emit('voiceSpeak', "Warning. Privacy shield bypassed. Civilian identity protection disabled.");
      
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'warning',
        msg: "SHIELD STATUS: Warning — Privacy Shield bypassed globally."
      });
      
      window.ShieldEvents.emit('logAuditBlock', {
        action: "PRIVACY SHIELD BYPASS: Warning — Global identity protection disabled.",
        validator: "SYSTEM_ROOT_ORACLE"
      });
    }

    if (window.ShieldAudio) {
      if (enabled) {
        window.ShieldAudio.playSuccess();
      } else {
        window.ShieldAudio.playError();
      }
    }
  });

  // Listen to login sessions
  window.ShieldEvents.on('loginSuccess', (role) => {
    writeBootLog(`SECURITY HANDSHAKE: Role ${role.toUpperCase()} authorized.`);
    
    // Write an immutable block log to blockchain explorer!
    window.ShieldEvents.emit('logAuditBlock', {
      action: `SECURE ACCESS: Biometric handshake succeeded for role ${role.toUpperCase()}`,
      validator: `AUTH_SECURE_GATEWAY`
    });

    // Start 5-second automatic threat simulation timer for judges
    setTimeout(() => {
      // Check that the user is still logged in (overlay is hidden)
      const overlay = document.getElementById('login-fullscreen-portal');
      if (overlay && overlay.classList.contains('hidden')) {
        console.log("[Simulation] Starting automatic 5-second AI Threat scan...");
        if (typeof triggerThreatSimulation === 'function') {
          triggerThreatSimulation();
        }
      }
    }, 5000);
  });
});

// SPA Router
function initRouter() {
  const navItems = document.querySelectorAll('.hud-nav-item');
  const sections = document.querySelectorAll('.view-section');
  
  function navigate(targetView) {
    if (!targetView) return;
    
    // Deactivate all navigation items & sections
    navItems.forEach(btn => {
      if (btn.getAttribute('data-view') === targetView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    sections.forEach(sec => {
      if (sec.id === `${targetView}-view`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
    
    ShieldState.activeView = targetView;
    ShieldEvents.emit('viewChanged', targetView);
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      navigate(view);
    });
  });

  // Global navigation handler
  window.navigateToView = navigate;
}

// Clock updates
function initClock() {
  const clockEl = document.getElementById('hud-clock-time');
  if (!clockEl) return;
  
  function updateTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    
    // Format: YYYY-MM-DD HH:MM:SS TZ
    const yr = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hr = pad(d.getHours());
    const min = pad(d.getMinutes());
    const sec = pad(d.getSeconds());
    
    clockEl.innerText = `${yr}-${mo}-${day} ${hr}:${min}:${sec} UTC`;
  }
  
  setInterval(updateTime, 1000);
  updateTime();
}

// Global Banner Notifications
function initGlobalAlerts() {
  const banner = document.getElementById('global-alert-banner');
  if (!banner) return;

  ShieldEvents.on('alertTriggered', (alertData) => {
    banner.innerText = `CRITICAL ALERT: ${alertData.message}`;
    banner.style.display = 'block';
    banner.className = 'global-alert-ticker alert-danger animate-pulse';
  });

  ShieldEvents.on('alertResolved', () => {
    banner.style.display = 'none';
  });

  window.closeGlobalAlertPopup = function() {
    const popup = document.getElementById('global-red-alert-popup');
    if (popup) {
      popup.classList.remove('active');
      popup.style.display = 'none';
    }

    const flash = document.getElementById('screen-red-flash');
    if (flash) {
      flash.classList.remove('flashing');
    }

    // Stop alert sound
    if (window.ShieldAudio) {
      window.ShieldAudio.stopSiren();
      window.ShieldAudio.playSuccess();
    }

    // Restore state
    window.ShieldState.systemStatus = 'ACTIVE';

    // Broadcast resolution
    window.ShieldEvents.emit('alertResolved');

    // Add block log to blockchain explorer
    window.ShieldEvents.emit('logAuditBlock', {
      action: "THREAT RESOLVED: Operator override authorized unmask verification check.",
      validator: "OPERATOR_CLEARANCE_KEY"
    });

    window.ShieldEvents.emit('newSystemLog', {
      time: new Date().toLocaleTimeString(),
      type: 'success',
      msg: "ALERT OVERRIDE: Threat acknowledged & resolved by command authority."
    });

    if (window.ShieldEvents) {
      try {
        window.ShieldEvents.emit('voiceSpeak', "Threat acknowledged and bypassed. Restoring normal surveillance parameters. Logging event on chain.");
      } catch (err) {
        console.warn("Override voice speak failed:", err);
      }
    }
  };
  
  ShieldEvents.on('lockdownToggled', (enabled) => {
    const statusPanel = document.getElementById('system-status-indicator-panel');
    const statusLabel = document.getElementById('system-status-label');
    const heatmapLabel = document.getElementById('active-heatmap-label');
    
    if (enabled) {
      statusPanel.classList.add('lockdown');
      statusLabel.innerText = "SHIELD: LOCKDOWN";
      banner.innerHTML = "<marquee scrollamount='8'>[CRITICAL EMERGENCY LOCKDOWN] ALL CAMERA BLUR SHIELDS HAVE BEEN LOCKED DOWN. SYSTEM SECURE.</marquee>";
      banner.style.display = 'block';
      banner.style.background = 'var(--neon-red)';
      banner.style.color = '#fff';
      banner.style.boxShadow = '0 0 15px var(--neon-red)';
      if (heatmapLabel) {
        heatmapLabel.innerText = "CRITICAL EMERGENCY LOCKDOWN ACTIVE";
        heatmapLabel.style.color = "var(--neon-red)";
      }
    } else {
      statusPanel.classList.remove('lockdown');
      statusLabel.innerText = "SHIELD: ENABLED";
      banner.style.display = 'none';
      if (heatmapLabel) {
        heatmapLabel.innerText = "ALL SECTORS SECURED";
        heatmapLabel.style.color = "var(--neon-green)";
      }
    }
  });
}

function writeBootLog(msg) {
  setTimeout(() => {
    ShieldEvents.emit('newSystemLog', {
      time: new Date().toLocaleTimeString(),
      type: 'success',
      msg: msg
    });
  }, Math.random() * 800);
}

// Digital Twin Smart City Holographic Map Animation
function initDigitalTwinMap() {
  const canvas = document.getElementById('digital-twin-grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set resolution based on physical viewport
  let width = canvas.width = canvas.parentElement.clientWidth || 800;
  let height = canvas.height = canvas.parentElement.clientHeight || 360;
  
  window.addEventListener('resize', () => {
    if (canvas && canvas.parentElement) {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    }
  });

  // Building node matrices (X, Y, Width, Height, Height3D, GlowColor)
  const buildings = [];
  const cols = 8;
  const rows = 4;
  const colWidth = width / cols;
  const rowHeight = height / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Create random building shapes on grid points, leaving space for roads
      if ((c + r) % 2 === 0) {
        buildings.push({
          x: c * colWidth + colWidth * 0.15 + (Math.random() * 10 - 5),
          y: r * rowHeight + rowHeight * 0.15 + (Math.random() * 6 - 3),
          w: colWidth * 0.7,
          h: rowHeight * 0.7,
          h3d: Math.floor(Math.random() * 35 + 15),
          color: Math.random() > 0.4 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(177, 13, 201, 0.06)',
          glowColor: Math.random() > 0.4 ? 'var(--neon-cyan)' : 'var(--neon-purple)'
        });
      }
    }
  }

  // Patrolling surveillance drones
  const drones = [
    { x: 100, y: 80, angle: 0, speed: 0.015, radius: 50, sector: 4 },
    { x: 500, y: 140, angle: Math.PI, speed: 0.01, radius: 70, sector: 7 }
  ];

  let satSweepX = 0;
  let mapTick = 0;

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    mapTick++;

    const isLockdown = window.ShieldState.lockdownEnabled;

    // Draw cyber grids representation streets
    ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.06)' : 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Active Threat risk hotspots heatmaps (Sector 4 and Sector 7 risk levels)
    const isThreat = window.ShieldState.systemStatus === 'THREAT_ALERT';
    const heatmaps = [
      { x: width * 0.35, y: height * 0.35, size: 55 + Math.sin(mapTick * 0.04) * 4, risk: isThreat ? 98 : 82, color: isThreat ? '255, 56, 96' : '255, 170, 0', label: isThreat ? "SEC-04 CRITICAL OUTBREAK" : "SEC-04 CROWD LOAD" },
      { x: width * 0.72, y: height * 0.55, size: 65 + Math.cos(mapTick * 0.03) * 6, risk: isThreat ? 99 : 68, color: isThreat ? '255, 56, 96' : '0, 242, 254', label: isThreat ? "SEC-07 WEAPON INTRUDER" : "SEC-07 FLIGHT VECT" }
    ];

    if (isLockdown) {
      // In lockdown all sectors display critical heatmaps
      heatmaps.push(
        { x: width * 0.18, y: height * 0.65, size: 70 + Math.sin(mapTick * 0.05)*8, risk: 99, color: '255, 56, 96', label: "SEC-02 CRITICAL" },
        { x: width * 0.52, y: height * 0.25, size: 75 + Math.cos(mapTick * 0.04)*10, risk: 95, color: '255, 56, 96', label: "SEC-05 CRITICAL" }
      );
    }

    // Draw glowing dynamic Heatmaps
    heatmaps.forEach(h => {
      const grad = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.size);
      grad.addColorStop(0, `rgba(${h.color}, 0.22)`);
      grad.addColorStop(0.5, `rgba(${h.color}, 0.07)`);
      grad.addColorStop(1, `rgba(${h.color}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.size, 0, Math.PI * 2);
      ctx.fill();

      // Glowing outer warning ring
      ctx.strokeStyle = `rgba(${h.color}, ${0.12 + Math.sin(mapTick * 0.05) * 0.04})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.size * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Dynamic text label
      ctx.font = '6px monospace';
      ctx.fillStyle = `rgba(${h.color}, 0.55)`;
      ctx.fillText(`${h.label}: ${isLockdown ? '99' : h.risk}%`, h.x - 28, h.y - 3);
    });

    // Draw building blocks with 3D wireframe projections
    buildings.forEach(b => {
      const px = 0.08 * (b.x - width/2);
      const py = 0.06 * (b.y - height/2);

      // Base flat shape
      ctx.fillStyle = isLockdown ? 'rgba(255, 56, 96, 0.02)' : b.color;
      ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.1)' : 'rgba(0, 242, 254, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.w, b.h);
      ctx.fill();
      ctx.stroke();

      const corners = [
        [b.x, b.y],
        [b.x + b.w, b.y],
        [b.x + b.w, b.y + b.h],
        [b.x, b.y + b.h]
      ];
      
      // Calculate top 3D offset projection
      const topCorners = corners.map(c => [c[0] + px, c[1] + py - b.h3d]);

      // Draw vertical connector lines
      ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.12)' : 'rgba(0, 242, 254, 0.12)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(corners[i][0], corners[i][1]);
        ctx.lineTo(topCorners[i][0], topCorners[i][1]);
        ctx.stroke();
      }

      // Draw top roof wireframe shape
      ctx.fillStyle = isLockdown ? 'rgba(255, 56, 96, 0.03)' : 'rgba(0, 242, 254, 0.03)';
      ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.25)' : b.glowColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(topCorners[0][0], topCorners[0][1]);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(topCorners[i][0], topCorners[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing hazard light node on tall structures
      if (b.h3d > 28) {
        ctx.fillStyle = isLockdown ? 'var(--neon-red)' : 'var(--neon-green)';
        ctx.beginPath();
        ctx.arc(topCorners[0][0] + b.w/2, topCorners[0][1] + b.h/2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw active orbital satellite sweep line
    satSweepX += 2.0;
    if (satSweepX > width) satSweepX = 0;
    ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.2)' : 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(satSweepX, 0);
    ctx.lineTo(satSweepX, height);
    ctx.stroke();

    // Satellite sweep glowing gradient trail
    const satGrad = ctx.createLinearGradient(satSweepX - 50, 0, satSweepX, 0);
    satGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
    satGrad.addColorStop(1, isLockdown ? 'rgba(255, 56, 96, 0.04)' : 'rgba(0, 242, 254, 0.04)');
    ctx.fillStyle = satGrad;
    ctx.fillRect(satSweepX - 50, 0, 50, height);

    // Draw patrolling holographic drones
    drones.forEach(d => {
      d.angle += d.speed;
      const center = heatmaps[d.sector === 4 ? 0 : 1] || { x: width/2, y: height/2 };
      d.x = center.x + Math.cos(d.angle) * d.radius;
      d.y = center.y + Math.sin(d.angle) * (d.radius * 0.6);

      // Search cone gradient projection
      const beamGrad = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y + 35, 40);
      beamGrad.addColorStop(0, 'rgba(177, 13, 201, 0.2)');
      beamGrad.addColorStop(1, 'rgba(177, 13, 201, 0)');
      ctx.fillStyle = beamGrad;
      
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 25, d.y + 50);
      ctx.lineTo(d.x + 25, d.y + 50);
      ctx.closePath();
      ctx.fill();

      // Drone model icon drawing
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle + Math.PI/2);
      ctx.fillStyle = 'var(--neon-purple)';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center flashing warning dot
      ctx.fillStyle = (mapTick % 30 < 15) ? 'var(--neon-cyan)' : 'var(--neon-red)';
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Drone vector flow link in lockdown
      if (isLockdown) {
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.25)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(width/2, height/2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Flashing lockdown warning boundaries
    if (isLockdown) {
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      if (mapTick % 40 < 20) {
        ctx.font = '8px monospace';
        ctx.fillStyle = 'var(--neon-red)';
        ctx.fillText("EMERGENCY SYSTEM LOCKDOWN ACTIVE — ZERO-TRUST CORES SECURED", width/2 - 145, height - 15);
      }
    }
  }

  function tick() {
    draw();
    requestAnimationFrame(tick);
  }
  tick();
}

// ==================== PWA STANDALONE NATIVE APP CONVERSION SYSTEM ====================

// 1. Register Service Worker for offline asset pre-caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('[PWA Scope] Service worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA Scope] Service worker registration aborted:', err);
      });
  });
}

// 2. Intercept and handle browser's app installation prompts
let deferredPrompt;
const installBtn = document.getElementById('hud-install-app-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent modern mobile/desktop browsers from automatically prompting
  e.preventDefault();
  
  // Stash the event so we can trigger it inside our glowing HUD button
  deferredPrompt = e;
  
  // Display our custom green-glowing install button in navigation header
  if (installBtn) {
    installBtn.style.display = 'inline-block';
    
    // Broadcast boot log
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        msg: "STANDALONE HUD: App installation protocol ready."
      });
    }
  }
});

// Bind installation trigger on HUD install button click
if (installBtn) {
  installBtn.addEventListener('click', () => {
    if (!deferredPrompt) return;
    
    // Trigger Chrome/Edge system installation prompt dialog
    deferredPrompt.prompt();
    
    // Wait for the judge or user decision
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA App] User accepted ShadowShield desktop installation');
        
        // Log this system installation block directly into the Blockchain Ledger!
        if (window.ShieldEvents) {
          window.ShieldEvents.emit('logAuditBlock', {
            action: `SYSTEM INSTALLATION: Standalone HUD Desktop client successfully installed as native process.`,
            validator: `PWA_NATIVE_ORACLE`
          });
          
          window.ShieldEvents.emit('newSystemLog', {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            msg: "SYSTEM INSTALLED: Dashboard running on native standalone framework."
          });
        }
      } else {
        console.log('[PWA App] User dismissed ShadowShield desktop installation');
      }
      
      // Clear the prompt variable
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  });
}

// Hide install button when app is successfully installed
window.addEventListener('appinstalled', (evt) => {
  console.log('[PWA App] ShadowShield standalone desktop HUD installed successfully!');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
});

// ==================== REAL-TIME TELEMETRY STATS & ETHICAL AI EXPLAINER ====================
class TelemetryStatsManager {
  constructor() {
    this.accuracyEl = document.getElementById('telemetry-accuracy');
    this.preventedEl = document.getElementById('telemetry-prevented');
    this.privacyEl = document.getElementById('telemetry-privacy');
    this.timelineEl = document.getElementById('ethical-explanation-timeline');
    this.statusBadgeEl = document.getElementById('ethical-status-badge');
    
    this.accuracy = 99.23;
    this.prevented = 1482;
    
    this.initStatsLoop();
    this.initEventHooks();
    this.initEthicalMockGenerator();
  }
  
  initStatsLoop() {
    // Stats update loop
    setInterval(() => {
      // AI Accuracy slight jitter
      this.accuracy = +(99.1 + Math.random() * 0.3).toFixed(2);
      if (this.accuracyEl) {
        this.accuracyEl.innerText = this.accuracy;
      }
      
      // Threats prevented slow increment
      if (Math.random() > 0.85) {
        this.prevented += 1;
        if (this.preventedEl) {
          this.preventedEl.innerText = this.prevented.toLocaleString();
        }
      }
      
      // Privacy Index sync with State
      if (this.privacyEl) {
        const isThreat = window.ShieldState.systemStatus === 'THREAT_ALERT';
        const isLockdown = window.ShieldState.lockdownEnabled;
        const isOverride = window.ShieldState.activeWarrantOverride;
        
        let indexVal = 99.8;
        if (isLockdown) {
          indexVal = 100.0; // lockdown forces complete masking
        } else if (isThreat) {
          indexVal = 42.6; // threat drops index due to active override
        } else if (isOverride) {
          indexVal = 91.2; // warrant unblur lowers rating slightly
        }
        
        // Add tiny jitter
        indexVal = +(indexVal + (Math.random() * 0.2 - 0.1)).toFixed(1);
        if (indexVal > 100) indexVal = 100;
        
        this.privacyEl.innerText = indexVal;
        
        const parentNode = this.privacyEl.parentElement;
        if (parentNode) {
          if (isThreat) {
            parentNode.style.color = "var(--neon-red)";
            parentNode.style.textShadow = "0 0 8px rgba(255, 56, 96, 0.4)";
          } else if (isOverride) {
            parentNode.style.color = "var(--neon-yellow)";
            parentNode.style.textShadow = "0 0 8px rgba(243, 243, 21, 0.4)";
          } else {
            parentNode.style.color = "var(--neon-green)";
            parentNode.style.textShadow = "0 0 8px rgba(0, 230, 118, 0.4)";
          }
        }
      }
    }, 3000);
  }
  
  addEthicalLog(type, camera, message) {
    if (!this.timelineEl) return;
    
    const entry = document.createElement('div');
    entry.className = 'ethical-log-item';
    
    let borderStyle = '2px solid var(--neon-green)';
    let prefixColor = 'var(--neon-green)';
    let prefixText = '[PRIVACY ENFORCED]';
    
    if (type === 'safety') {
      borderStyle = '2px solid var(--neon-red)';
      prefixColor = 'var(--neon-red)';
      prefixText = '[SAFETY OVERRIDE]';
    } else if (type === 'warrant') {
      borderStyle = '2px solid var(--neon-purple)';
      prefixColor = 'var(--neon-purple)';
      prefixText = '[WARRANT ACCESS]';
    } else if (type === 'resolved') {
      borderStyle = '2px solid var(--neon-cyan)';
      prefixColor = 'var(--neon-cyan)';
      prefixText = '[PRIVACY RESTORED]';
    }
    
    entry.style.cssText = `border-left: ${borderStyle}; padding-left: 8px; color: #fff; margin-bottom: 4px;`;
    
    entry.innerHTML = `
      <span style="color: ${prefixColor}; font-weight: bold;">${prefixText}</span> 
      <span style="color: var(--text-secondary);">${camera}:</span> ${message}
    `;
    
    this.timelineEl.insertBefore(entry, this.timelineEl.firstChild);
    
    // Limit to 5 logs
    if (this.timelineEl.children.length > 5) {
      this.timelineEl.removeChild(this.timelineEl.lastChild);
    }
  }
  
  initEventHooks() {
    // Hook threat simulated alerts
    window.ShieldEvents.on('alertTriggered', (data) => {
      this.addEthicalLog('safety', 'SEC-07 METRO STATION', 'Alert generated due to weapon probability 98.7% (Confidence threshold exceeded). Multi-sig authorization override active: Unblurring local grids for visual verification.');
      if (this.statusBadgeEl) {
        this.statusBadgeEl.className = 'cyber-badge danger animate-pulse';
        this.statusBadgeEl.innerText = 'SAFETY OVERRIDE ACTIVE';
      }
    });
    
    // Hook threat resolved
    window.ShieldEvents.on('alertResolved', () => {
      this.addEthicalLog('resolved', 'SEC-07 METRO STATION', 'Weapon threat resolved and cleared by operator. Zero-trust anonymization shields fully restored.');
      if (this.statusBadgeEl) {
        this.statusBadgeEl.className = 'cyber-badge success';
        this.statusBadgeEl.innerText = 'PRIVACY MATRIX STABLE';
      }
    });
    
    // Hook warrant bypasses
    window.ShieldEvents.on('warrantOverrideToggled', (active) => {
      if (active) {
        this.addEthicalLog('warrant', 'CAM 01 central plaza', 'Facial decryption token generated. Court warrant multi-sig verified on ledger. Citizen unmasked for officer review.');
        if (this.statusBadgeEl) {
          this.statusBadgeEl.className = 'cyber-badge warning';
          this.statusBadgeEl.innerText = 'WARRANT ACCESS ENABLED';
        }
      } else {
        this.addEthicalLog('resolved', 'CAM 01 central plaza', 'Warrant bypass window elapsed. Facial decryption token revoked. Privacy shield matrix fully engaged.');
        if (this.statusBadgeEl) {
          this.statusBadgeEl.className = 'cyber-badge success';
          this.statusBadgeEl.innerText = 'PRIVACY MATRIX STABLE';
        }
      }
    });
  }
  
  initEthicalMockGenerator() {
    const mockFeeds = ['CAM 01 central plaza', 'CAM 02 north tunnel', 'CAM 03 metro station', 'CAM 04 east gate'];
    const mockMessages = [
      'Anonymity mask enforced. Zero-trust classification: Pedestrian activities nominal.',
      'Citizen facial signature encrypted. Privacy ledger validation successful.',
      'Pixelation mask active. Safe pedestrian flows registered.',
      'Anonymization grid stable. Automated crowd analytics operating on localized vector indices only.'
    ];
    
    // Inject mock logs every 15-20 seconds to keep screen alive
    setInterval(() => {
      const isThreat = window.ShieldState.systemStatus === 'THREAT_ALERT';
      if (isThreat) return; // don't mock logs during threat active
      
      const feed = mockFeeds[Math.floor(Math.random() * mockFeeds.length)];
      const msg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
      this.addEthicalLog('privacy', feed, msg);
    }, 18000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.telemetryStats = new TelemetryStatsManager();
});
