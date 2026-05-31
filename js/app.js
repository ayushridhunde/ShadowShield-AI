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

// ==================== SENTINEL OVERVIEW SOC DASHBOARD CONTROLLER ====================
class SentinelOverviewDashboard {
  constructor() {
    this.activeCam = 'cam01';
    this.animTick = 0;
    
    // Webcam stream variables
    this.webcamVideo = document.getElementById('sentinel-webcam-stream');
    this.cameraCanvas = document.getElementById('sentinel-camera-canvas');
    this.cameraCtx = this.cameraCanvas ? this.cameraCanvas.getContext('2d') : null;
    
    this.webcamStream = null;
    this.isCameraOn = false;
    this.webcamError = false;

    // Heatmap variables
    this.heatmapCanvas = document.getElementById('sentinel-heatmap-canvas');
    this.heatmapCtx = this.heatmapCanvas ? this.heatmapCanvas.getContext('2d') : null;
    this.lastPing = null;

    // Analytics charts canvases (4 grids)
    this.chartThreatsCanvas = document.getElementById('sentinel-chart-threat-trends');
    this.chartPrivacyCanvas = document.getElementById('sentinel-chart-privacy-trends');
    this.chartAccuracyCanvas = document.getElementById('sentinel-chart-ai-accuracy');
    this.chartEmergencyCanvas = document.getElementById('sentinel-chart-emergency-events');

    this.ctxThreats = this.chartThreatsCanvas ? this.chartThreatsCanvas.getContext('2d') : null;
    this.ctxPrivacy = this.chartPrivacyCanvas ? this.chartPrivacyCanvas.getContext('2d') : null;
    this.ctxAccuracy = this.chartAccuracyCanvas ? this.chartAccuracyCanvas.getContext('2d') : null;
    this.ctxEmergency = this.chartEmergencyCanvas ? this.chartEmergencyCanvas.getContext('2d') : null;

    // Historical arrays for smooth graphs
    this.threatHistory = Array.from({length: 30}, (_, i) => 20 + Math.sin(i * 0.5) * 8);
    this.accuracyHistory = Array.from({length: 30}, () => 99.4 + Math.random() * 0.1);

    this.init();
  }

  init() {
    this.setupCanvases();
    this.bindControls();
    this.setupHeatmapClick();
    this.startDashboardEventLoops();
    
    // Seed initial chronological alert logs
    this.seedAlertFeed();
    this.renderLedgerPreview();
  }

  setupCanvases() {
    if (this.cameraCanvas) {
      this.cameraCanvas.width = 320;
      this.cameraCanvas.height = 200;
    }
    if (this.heatmapCanvas) {
      this.heatmapCanvas.width = 460;
      this.heatmapCanvas.height = 240;
    }
    const charts = [
      this.chartThreatsCanvas,
      this.chartPrivacyCanvas,
      this.chartAccuracyCanvas,
      this.chartEmergencyCanvas
    ];
    charts.forEach(c => {
      if (c) {
        c.width = 240;
        c.height = 80;
      }
    });
  }

  bindControls() {
    // Webcam Toggle button
    const toggleBtn = document.getElementById('sentinel-btn-camera-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCameraStream());
    }

    // Camera channel dropdown switcher
    const selectChannel = document.getElementById('sentinel-camera-select');
    if (selectChannel) {
      selectChannel.addEventListener('change', (e) => {
        this.activeCam = e.target.value;
        const label = document.getElementById('sentinel-active-feed-label');
        if (label) label.innerText = `OVERWATCH FEED: ${e.target.options[e.target.selectedIndex].text.toUpperCase().split(':')[0]}`;
        
        if (window.ShieldAudio && typeof window.ShieldAudio.playClick === 'function') {
          window.ShieldAudio.playClick();
        }
        
        // Log CCTV Switch on Blockchain
        if (window.ShieldEvents) {
          window.ShieldEvents.emit('cctvChannelChanged', { channel: this.activeCam });
        }
      });
    }

    // Quick Command scan/report buttons
    const scanBtn = document.getElementById('sentinel-btn-scan');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.runSystemScan());
    }

    const reportBtn = document.getElementById('sentinel-btn-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => this.generateSecurityReport());
    }

    // Sync from overall platform alerts and events
    if (window.ShieldEvents) {
      window.ShieldEvents.on('alertTriggered', () => {
        this.syncDashboardState();
      });
      window.ShieldEvents.on('alertResolved', () => {
        this.syncDashboardState();
      });
      window.ShieldEvents.on('logAuditBlock', () => {
        this.syncDashboardState();
      });
      window.ShieldEvents.on('shieldToggled', () => {
        this.syncDashboardState();
      });
      window.ShieldEvents.on('lockdownToggled', () => {
        this.syncDashboardState();
      });
      window.ShieldEvents.on('voiceSpeak', (text) => {
        const voiceTextEl = document.getElementById('sentinel-voice-assistant-text');
        if (voiceTextEl) {
          voiceTextEl.innerText = `"${text}"`;
        }
        const voiceIndicator = document.getElementById('sentinel-voice-assistant-indicator');
        if (voiceIndicator) {
          voiceIndicator.style.background = 'var(--neon-cyan)';
          voiceIndicator.style.boxShadow = '0 0 10px var(--neon-cyan)';
          setTimeout(() => {
            voiceIndicator.style.background = 'var(--neon-blue)';
            voiceIndicator.style.boxShadow = '0 0 5px var(--neon-blue)';
          }, 2000);
        }
      });
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
    this.lastPing = {
      x: x,
      y: y,
      radius: 2,
      maxRadius: 32,
      opacity: 0.9
    };
    
    // Play radar sweep tone
    if (window.ShieldAudio && typeof window.ShieldAudio.playTone === 'function') {
      window.ShieldAudio.playTone(1100, 0.35, 'sine', 0.05);
    }

    this.addChronoLog(`Sensor sweep focused on district coordinates X:${Math.round(x)} Y:${Math.round(y)}.`, 'info');
    
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Focusing satellite surveillance scanner on coordinates.");
    }
  }

  async toggleCameraStream() {
    const btn = document.getElementById('sentinel-btn-camera-toggle');
    const statusDot = document.getElementById('sentinel-camera-status-dot');
    if (!this.isCameraOn) {
      // Turn Camera ON
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Webcam not supported, falling back to simulation.");
        this.webcamError = true;
        this.isCameraOn = true;
        if (btn) {
          btn.innerText = "CAMERA: SIMULATED";
          btn.style.color = "var(--neon-yellow)";
          btn.style.borderColor = "var(--neon-yellow)";
        }
        if (statusDot) {
          statusDot.style.background = "var(--neon-yellow)";
          statusDot.style.boxShadow = "0 0 5px var(--neon-yellow)";
        }
        return;
      }
      
      try {
        this.webcamError = false;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 200, facingMode: 'user' },
          audio: false
        });
        this.webcamStream = stream;
        if (this.webcamVideo) {
          this.webcamVideo.srcObject = stream;
          this.webcamVideo.play();
        }
        this.isCameraOn = true;
        if (btn) {
          btn.innerText = "CAMERA: ACTIVE";
          btn.style.color = "var(--neon-green)";
          btn.style.borderColor = "var(--neon-green)";
        }
        if (statusDot) {
          statusDot.style.background = "var(--neon-green)";
          statusDot.style.boxShadow = "0 0 5px var(--neon-green)";
        }
        this.addChronoLog("Surveillance channel: live camera feed connected successfully.", 'success');
      } catch (err) {
        console.warn("Surveillance webcam blocked. Falling back to simulation.", err);
        this.webcamError = true;
        this.isCameraOn = true;
        if (btn) {
          btn.innerText = "CAMERA: SIMULATED";
          btn.style.color = "var(--neon-yellow)";
          btn.style.borderColor = "var(--neon-yellow)";
        }
        if (statusDot) {
          statusDot.style.background = "var(--neon-yellow)";
          statusDot.style.boxShadow = "0 0 5px var(--neon-yellow)";
        }
      }
    } else {
      // Turn Camera OFF
      if (this.webcamStream) {
        this.webcamStream.getTracks().forEach(t => t.stop());
        this.webcamStream = null;
      }
      if (this.webcamVideo) {
        this.webcamVideo.srcObject = null;
      }
      this.isCameraOn = false;
      if (btn) {
        btn.innerText = "CAMERA: OFF";
        btn.style.color = "var(--neon-cyan)";
        btn.style.borderColor = "var(--border-neon)";
      }
      if (statusDot) {
        statusDot.style.background = "var(--neon-cyan)";
        statusDot.style.boxShadow = "0 0 5px var(--neon-cyan)";
      }
      this.addChronoLog("Surveillance channel: disconnected.", 'info');
    }
  }

  runSystemScan() {
    if (window.ShieldAudio && typeof window.ShieldAudio.startScanHum === 'function') {
      window.ShieldAudio.startScanHum();
    }
    
    this.addChronoLog("Initiating municipal zero-trust database scans...", 'info');
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Initiating municipal system diagnostic scans... Grid sectors secure.");
    }

    const btn = document.getElementById('sentinel-btn-scan');
    if (btn) {
      btn.innerText = "SCANNING...";
      btn.disabled = true;
    }

    // Animate stats values count-up sequence
    let count = 0;
    const interval = setInterval(() => {
      count += 5;
      const accEl = document.getElementById('sentinel-val-accuracy');
      if (accEl) accEl.innerText = `${(92 + (count / 100) * 7.4).toFixed(1)}%`;
      
      if (count >= 100) {
        clearInterval(interval);
        if (btn) {
          btn.innerText = "RUN SYSTEM SCAN";
          btn.disabled = false;
        }
        if (window.ShieldAudio && typeof window.ShieldAudio.stopScanHum === 'function') {
          window.ShieldAudio.stopScanHum();
          window.ShieldAudio.playSuccess();
        }
        this.addChronoLog("Zero-trust database integrity scan completed successfully: 100% SECURE.", 'success');
        
        // Log to Blockchain Ledger
        if (window.ShieldEvents) {
          window.ShieldEvents.emit('logAuditBlock', {
            action: "SYSTEM AUDIT SCAN: Grid sectors secure. All privacy nodes integrity verified.",
            validator: "SYSTEM_ROOT_ORACLE"
          });
        }
        
        this.syncDashboardState();
      }
    }, 100);
  }

  generateSecurityReport() {
    this.addChronoLog("Generating Cryptographic Secure Report...", 'info');
    if (window.ShieldAudio && typeof window.ShieldAudio.playSuccess === 'function') {
      window.ShieldAudio.playSuccess();
    }

    // Generate block log on ledger
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('logAuditBlock', {
        action: "SECURITY REPORT GENERATED: Compiled municipal overwatch metrics and warrant hashes.",
        validator: "GOVERNMENT_COMPLIANCE_NODE"
      });
      window.ShieldEvents.emit('voiceSpeak', "Cryptographic system security report generated. Mined block successfully.");
    }
    
    alert("CRYPTOGRAPHIC SECURITY SUMMARY GENERATED\nMined Block: " + Math.random().toString(16).substring(2, 10).toUpperCase() + "\nValidator Node Consensus: ESTABLISHED");
    
    this.syncDashboardState();
  }

  syncDashboardState() {
    // 1. Overview cards stats updates
    const activeIncidents = window.threatGrid ? window.threatGrid.incidents.filter(i => i.status !== 'RESOLVED').length : 0;
    const resolvedIncidents = window.threatGrid ? window.threatGrid.incidents.filter(i => i.status === 'RESOLVED').length : 24;
    const threatLvl = window.threatGrid ? window.threatGrid.threatLevel : 1;

    const cardsMap = {
      'sentinel-val-incidents': activeIncidents,
      'sentinel-sub-incidents': `${activeIncidents} ACTIVE | ${resolvedIncidents} RESOLVED`,
      'sentinel-val-cameras': window.ShieldState && window.ShieldState.lockdownEnabled ? '0/128' : '128/128',
      'sentinel-sub-cameras': window.ShieldState && window.ShieldState.lockdownEnabled ? 'EMERGENCY LOCKDOWN ACTIVE' : 'ALL FEEDS ONLINE'
    };

    for (let id in cardsMap) {
      const el = document.getElementById(id);
      if (el) el.innerText = cardsMap[id];
    }

    // Threat details sync
    const lvlTextMap = ["IDLE", "LOW", "GUARDED", "ELEVATED", "HIGH", "CRITICAL"];
    const statusTextMap = ["STABLE", "NORMAL", "GUARDED", "ELEVATED ALERT", "HIGH ALERT", "CRITICAL LOCKDOWN"];
    const colorsMap = ["", "var(--neon-green)", "var(--neon-blue)", "var(--neon-yellow)", "var(--neon-orange)", "var(--neon-red)"];
    const scoresMap = [0, 12, 35, 58, 78, 98];

    const valLvl = document.getElementById('sentinel-val-threat-level');
    const valScore = document.getElementById('sentinel-val-risk-score');
    const valStatus = document.getElementById('sentinel-val-threat-status');
    if (valLvl) {
      valLvl.innerText = lvlTextMap[threatLvl];
      valLvl.style.color = colorsMap[threatLvl];
    }
    if (valScore) valScore.innerText = `${scoresMap[threatLvl]}%`;
    if (valStatus) {
      valStatus.innerText = statusTextMap[threatLvl];
      valStatus.style.color = colorsMap[threatLvl];
    }

    // Emergency Status cards updates
    const valEmerg = document.getElementById('sentinel-val-emergency');
    const subEmerg = document.getElementById('sentinel-sub-emergency');
    if (valEmerg) {
      if (threatLvl === 5) {
        valEmerg.innerText = "CRITICAL";
        valEmerg.style.color = "var(--neon-red)";
        valEmerg.style.textShadow = "var(--text-glow-red)";
        if (subEmerg) subEmerg.innerText = "🚨 RED ALERT OUTBREAK";
      } else if (threatLvl >= 3) {
        valEmerg.innerText = "ALERT";
        valEmerg.style.color = "var(--neon-orange)";
        valEmerg.style.textShadow = "none";
        if (subEmerg) subEmerg.innerText = `DEFCON STATE: ${6 - threatLvl}`;
      } else {
        valEmerg.innerText = "STANDBY";
        valEmerg.style.color = "var(--neon-cyan)";
        valEmerg.style.textShadow = "none";
        if (subEmerg) subEmerg.innerText = "DEFCON STATE: 5";
      }
    }

    // Toggle red glow animation on threat and emergency cards
    const threatCard = valLvl ? valLvl.closest('.sentinel-card') : null;
    const emergencyCard = valEmerg ? valEmerg.closest('.sentinel-card') : null;
    if (threatLvl >= 4) {
      if (threatCard) threatCard.classList.add('alert-active');
      if (emergencyCard) emergencyCard.classList.add('alert-active');
    } else {
      if (threatCard) threatCard.classList.remove('alert-active');
      if (emergencyCard) emergencyCard.classList.remove('alert-active');
    }

    // Privacy Protections Score sync
    const valPriv = document.getElementById('sentinel-val-privacy');
    const subPrivText = document.getElementById('sentinel-sub-privacy');
    const globalAnon = window.ShieldState ? window.ShieldState.globalAnonymity : true;
    const lockdownActive = window.ShieldState ? window.ShieldState.lockdownEnabled : false;
    const threatActive = window.ShieldState ? (window.ShieldState.systemStatus === 'THREAT_ALERT') : false;

    let privacyScore = 99.8;
    if (lockdownActive) privacyScore = 100.0;
    else if (threatActive) privacyScore = 42.6;
    else if (!globalAnon) privacyScore = 0.0;

    if (valPriv) {
      valPriv.innerText = `${privacyScore}%`;
      valPriv.style.color = privacyScore >= 80 ? "var(--neon-green)" : "var(--neon-red)";
    }
    if (subPrivText) {
      const maskStatus = privacyScore >= 80 ? "BLUR: ACTIVE" : "BLUR: BYPASS";
      subPrivText.innerText = `${maskStatus} | 12,940 CIVILIANS`;
    }

    // 2. Readiness progressions bars sync
    const readinessScore = threatLvl === 5 ? 100 : (threatLvl >= 3 ? 92 : 98);
    const readPercentage = document.getElementById('sentinel-readiness-percentage');
    const readFill = document.getElementById('sentinel-readiness-progress-fill');
    if (readPercentage) readPercentage.innerText = `${readinessScore}%`;
    if (readFill) readFill.style.width = `${readinessScore}%`;

    // 3. Sync AI operations indicator status dots
    const privacyDot = document.getElementById('sentinel-status-ai-privacy-dot');
    const privacyLbl = document.getElementById('sentinel-status-ai-privacy-label');
    if (privacyDot && privacyLbl) {
      if (lockdownActive) {
        privacyDot.style.background = 'var(--neon-green)';
        privacyDot.style.boxShadow = '0 0 5px var(--neon-green)';
        privacyLbl.innerText = 'Privacy Engine: LOCKDOWN';
      } else if (globalAnon) {
        privacyDot.style.background = 'var(--neon-green)';
        privacyDot.style.boxShadow = '0 0 5px var(--neon-green)';
        privacyLbl.innerText = 'Privacy Engine: ACTIVE';
      } else {
        privacyDot.style.background = 'var(--neon-red)';
        privacyDot.style.boxShadow = '0 0 5px var(--neon-red)';
        privacyLbl.innerText = 'Privacy Engine: OFFLINE';
      }
    }

    const predictDot = document.getElementById('sentinel-status-ai-predict-dot');
    const predictLbl = document.getElementById('sentinel-status-ai-predict-label');
    if (predictDot && predictLbl) {
      if (threatActive || lockdownActive) {
        predictDot.style.background = 'var(--neon-red)';
        predictDot.style.boxShadow = '0 0 5px var(--neon-red)';
        predictLbl.innerText = 'Predictions: CRITICAL';
        predictDot.classList.add('animate-pulse');
      } else {
        predictDot.style.background = 'var(--neon-green)';
        predictDot.style.boxShadow = '0 0 5px var(--neon-green)';
        predictLbl.innerText = 'Predictions: ACTIVE';
        predictDot.classList.remove('animate-pulse');
      }
    }

    // AI Core Engine and Ledger logs
    const engineDot = document.getElementById('sentinel-status-ai-engine-dot');
    const ledgerDot = document.getElementById('sentinel-status-ai-ledger-dot');
    if (engineDot) {
      engineDot.style.background = 'var(--neon-green)';
      engineDot.style.boxShadow = '0 0 5px var(--neon-green)';
    }
    if (ledgerDot) {
      ledgerDot.style.background = 'var(--neon-green)';
      ledgerDot.style.boxShadow = '0 0 5px var(--neon-green)';
    }

    // 4. Sync Privacy Protection Center Hub details
    const scrambledToday = 42482 + (this.animTick % 500);
    const requestProcessed = 142 + (window.trustLedger ? window.trustLedger.chain.length : 0);
    const facesBlurredEl = document.getElementById('sentinel-faces-blurred');
    const privacyScoreEl = document.getElementById('sentinel-privacy-score');
    const privacyRequestsEl = document.getElementById('sentinel-privacy-requests');

    if (facesBlurredEl) facesBlurredEl.innerText = scrambledToday.toLocaleString();
    if (privacyScoreEl) privacyScoreEl.innerText = `${privacyScore}%`;
    if (privacyRequestsEl) privacyRequestsEl.innerText = requestProcessed;

    // 5. Render threats preview deck and ledger
    this.renderThreatsSummary();
    this.renderLedgerPreview();
  }

  seedAlertFeed() {
    const logs = [
      { msg: "Core Sentinel Overview online. Synchronized validator consensus.", type: "success" },
      { msg: "Decentralized trust ledger synchronized with validator node ring.", type: "info" },
      { msg: "Camera 01 central plaza: Zero-trust feeds connected.", type: "info" }
    ];
    logs.forEach(l => this.addChronoLog(l.msg, l.type));
  }

  addChronoLog(msg, type = 'info') {
    const feed = document.getElementById('sentinel-alert-feed-ticker');
    if (!feed) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const card = document.createElement('div');
    card.className = `sentinel-alert-feed-item ${type}`;
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-weight:bold; color:#fff; font-size:7px;">
        <span>${type.toUpperCase()}</span>
        <span>${time}</span>
      </div>
      <div style="color:var(--text-secondary); line-height:1.2; font-size:7.5px;">${msg}</div>
    `;

    feed.insertBefore(card, feed.firstChild);
    if (feed.children.length > 15) {
      feed.removeChild(feed.lastChild);
    }
  }

  renderLedgerPreview() {
    const tbody = document.getElementById('sentinel-ledger-preview-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const chain = window.trustLedger ? window.trustLedger.chain : [];
    
    // Display 4 most recent transaction blocks matching Timestamp, Action, User, Status
    [...chain].reverse().slice(0, 4).forEach(blk => {
      const row = document.createElement('tr');
      let statusColor = "var(--neon-green)";
      if (blk.status === 'WARNING' || blk.status === 'CRITICAL' || blk.status === 'ACTIVE' || blk.status === 'FAIL') {
        statusColor = "var(--neon-red)";
      } else if (blk.status === 'BYPASS' || blk.status === 'WARNING') {
        statusColor = "var(--neon-yellow)";
      }
      
      row.innerHTML = `
        <td style="color:var(--text-muted); font-size:7.5px;">${blk.timestamp}</td>
        <td style="color:#fff; font-weight:500; max-width: 140px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${blk.action}">${blk.action}</td>
        <td><span style="color:var(--neon-purple);">${blk.user}</span></td>
        <td><span style="color:${statusColor}; font-weight:bold; font-size:7.5px;">${blk.status.toUpperCase()}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  renderThreatsSummary() {
    const container = document.getElementById('sentinel-threats-summary-container');
    if (!container) return;

    const incidents = window.threatGrid ? window.threatGrid.incidents : [];
    const active = incidents.filter(i => i.status !== 'RESOLVED');

    if (active.length === 0) {
      container.innerHTML = `<div style="font-size:7.5px; color:var(--text-muted); font-family:monospace; text-align:center; padding:10px 0;">NO ACTIVE SYSTEM THREATS</div>`;
      return;
    }

    container.innerHTML = '';
    active.slice(0, 2).forEach(inc => {
      const card = document.createElement('div');
      card.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed rgba(255,255,255,0.05); padding-bottom:3px; font-family:monospace; font-size:8px;";
      
      let statusColor = "var(--neon-yellow)";
      if (inc.status.includes('ESCALATED')) statusColor = "var(--neon-orange)";
      else if (inc.level === 5) statusColor = "var(--neon-red)";
      
      card.innerHTML = `
        <div>
          <span style="color:var(--neon-purple); font-weight:bold;">${inc.id}</span>
          <span style="color:#fff; margin-left: 5px;">${inc.type}</span>
        </div>
        <span style="color:${statusColor}; font-weight:bold;">${inc.status}</span>
      `;
      container.appendChild(card);
    });
  }

  // Webcam canvas drawing overlays (bounding boxes and face scramble masks)
  drawWebcamFeed() {
    if (!this.cameraCtx) return;
    const ctx = this.cameraCtx;
    const w = this.cameraCanvas.width;
    const h = this.cameraCanvas.height;

    this.animTick++;

    // Background clearing
    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grids
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Sync live timestamp text overlay in DOM
    const timeEl = document.getElementById('sentinel-camera-timestamp');
    if (timeEl) {
      const pad = (n) => String(n).padStart(2, '0');
      const now = new Date();
      timeEl.innerText = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`;
    }

    const threatLvl = window.threatGrid ? window.threatGrid.threatLevel : 1;
    const isThreatActive = threatLvl >= 3;
    const boundingColor = isThreatActive ? 'var(--neon-red)' : 'var(--neon-green)';

    // Motion Detection logic overlay
    const motionDot = document.getElementById('sentinel-motion-dot');
    const motionLabel = document.getElementById('sentinel-motion-label');
    const hasMotion = this.isCameraOn && (this.animTick % 300 < 80 || isThreatActive);
    if (motionDot && motionLabel) {
      if (hasMotion) {
        motionDot.classList.add('alerting');
        motionDot.style.background = 'var(--neon-red)';
        motionDot.style.boxShadow = '0 0 6px var(--neon-red)';
        motionLabel.innerText = 'MOTION: DETECTED';
        motionLabel.style.color = 'var(--neon-red)';
      } else {
        motionDot.classList.remove('alerting');
        motionDot.style.background = 'var(--neon-green)';
        motionDot.style.boxShadow = '0 0 6px var(--neon-green)';
        motionLabel.innerText = 'MOTION: IDLE';
        motionLabel.style.color = 'var(--neon-green)';
      }
    }

    if (this.isCameraOn && !this.webcamError && this.webcamVideo && this.webcamVideo.readyState >= 2) {
      // Draw live camera mirrored horizontally
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.webcamVideo, 0, 0, w, h);
      ctx.restore();

      // Cyber grading tint
      ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.fillRect(0, 0, w, h);

      // Draw face tracking mesh bounding boxes
      ctx.strokeStyle = boundingColor;
      ctx.lineWidth = 1.8;
      
      const headX = w / 2 + Math.sin(this.animTick * 0.02) * 20;
      const headY = h / 2 + Math.cos(this.animTick * 0.015) * 10 - 10;
      
      // circular facial privacy mask scrambler
      const faceR = 16;
      ctx.strokeRect(headX - 25, headY - 35, 50, 70);
      
      const globalAnon = window.ShieldState ? window.ShieldState.globalAnonymity : true;
      if (globalAnon) {
        ctx.save();
        ctx.beginPath(); ctx.arc(headX, headY - 10, faceR, 0, Math.PI * 2); ctx.clip();
        
        // canvas blur filter scrambling
        ctx.filter = 'blur(6px)';
        ctx.save();
        ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(this.webcamVideo, 0, 0, w, h);
        ctx.restore();
        ctx.restore();
        ctx.filter = 'none';

        // Scrambling digital meshes
        ctx.strokeStyle = 'var(--neon-blue)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let r = 4; r < faceR; r += 4) {
          ctx.arc(headX, headY - 10, r, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      ctx.fillStyle = boundingColor;
      ctx.font = '6px monospace';
      ctx.fillText(`OPERATOR_LOCK: CONF_99%`, headX - 24, headY - 40);

      // Render red radar targeting overlays in case of motion detection
      if (hasMotion) {
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.35)';
        ctx.beginPath();
        ctx.moveTo(headX, 0); ctx.lineTo(headX, h);
        ctx.moveTo(0, headY); ctx.lineTo(w, headY);
        ctx.stroke();
        
        ctx.fillStyle = 'var(--neon-red)';
        ctx.fillText("WARN: HIGH MOTION INDEX", 10, h - 12);
      }
    } else {
      // Draw simulated camera overview lobby walking blocks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeRect(20, 20, w - 40, h - 40);

      const tX = w / 2 + Math.sin(this.animTick * 0.015) * 60;
      const tY = h / 2 + Math.cos(this.animTick * 0.02) * 20;
      
      ctx.strokeStyle = boundingColor;
      ctx.strokeRect(tX - 10, tY - 20, 20, 40);
      
      ctx.fillStyle = boundingColor;
      ctx.font = '6px monospace';
      ctx.fillText(`CIVILIAN_${tX > w/2 ? '0492' : '1428'}`, tX - 10, tY - 24);

      // head masks if anonymity active
      const globalAnon = window.ShieldState ? window.ShieldState.globalAnonymity : true;
      if (globalAnon) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
        ctx.beginPath(); ctx.arc(tX, tY - 12, 5, 0, Math.PI*2); ctx.fill();
      }
      
      if (hasMotion) {
        ctx.strokeStyle = 'var(--neon-red)';
        ctx.strokeRect(tX - 14, tY - 24, 28, 48);
        ctx.fillStyle = 'var(--neon-red)';
        ctx.fillText("ANOMALOUS_VELOCITY", tX - 14, tY + 30);
      }
    }
  }

  // Interactive Smart City Heatmap drawing logic
  drawHeatmap() {
    if (!this.heatmapCtx) return;
    const ctx = this.heatmapCtx;
    const w = this.heatmapCanvas.width;
    const h = this.heatmapCanvas.height;

    // Background clear
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Named district outlines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
    ctx.lineWidth = 0.5;
    const cols = 5; const rows = 3;
    const secW = w / cols; const secH = h / rows;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * secW, 0); ctx.lineTo(c * secW, h); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * secH); ctx.lineTo(w, r * secH); ctx.stroke();
    }

    // safe and danger zones
    const threatLvl = window.threatGrid ? window.threatGrid.threatLevel : 1;
    const isThreat = threatLvl === 5;
    const isWarning = threatLvl >= 3 && threatLvl <= 4;
    
    // SEC-02 Safe Area (green translucent)
    ctx.fillStyle = 'rgba(0, 230, 118, 0.03)';
    ctx.fillRect(20, 20, secW * 1.5, secH * 1.5);
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.1)';
    ctx.strokeRect(20, 20, secW * 1.5, secH * 1.5);

    // SEC-07 Danger zone glowing center
    const heatX = w * 0.68;
    const heatY = h * 0.45;
    const heatSize = 45 + Math.sin(this.animTick * 0.04) * 8;

    const heatGrad = ctx.createRadialGradient(heatX, heatY, 3, heatX, heatY, heatSize);
    if (isThreat) {
      heatGrad.addColorStop(0, 'rgba(255, 56, 96, 0.28)');
      heatGrad.addColorStop(1, 'transparent');
    } else if (isWarning) {
      heatGrad.addColorStop(0, 'rgba(243, 243, 21, 0.2)');
      heatGrad.addColorStop(1, 'transparent');
    } else {
      heatGrad.addColorStop(0, 'rgba(0, 242, 254, 0.12)');
      heatGrad.addColorStop(1, 'transparent');
    }
    
    ctx.fillStyle = heatGrad;
    ctx.beginPath(); ctx.arc(heatX, heatY, heatSize, 0, Math.PI * 2); ctx.fill();

    // glowing boundary ring
    ctx.strokeStyle = isThreat ? 'rgba(255, 56, 96, 0.2)' : 'rgba(0, 242, 254, 0.1)';
    ctx.beginPath(); ctx.arc(heatX, heatY, heatSize * 0.8, 0, Math.PI * 2); ctx.stroke();

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

    // Active city crawlers (patrolling cars, drones)
    const targets = window.threatGrid ? window.threatGrid.targets : [];
    targets.forEach(t => {
      ctx.fillStyle = t.type === 'suspect' ? 'var(--neon-red)' : (t.type === 'drone' ? 'var(--neon-purple)' : 'var(--neon-blue)');
      if (t.type === 'pingblip') ctx.fillStyle = 'var(--neon-cyan)';
      
      ctx.beginPath(); ctx.arc(t.x, t.y, t.type === 'suspect' ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '5px monospace';
      ctx.fillText(t.id, t.x + 5, t.y - 1);
    });

    // Radar scanning line sweeping arc circle centered at hazard
    const sweepRadius = (this.animTick * 1.5) % 180;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(heatX, heatY, sweepRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Mini HUD Analytics Charts Oscilloscopes drawing loops (4 distinct charts)
  drawAnalyticsCharts() {
    const threatLvl = window.threatGrid ? window.threatGrid.threatLevel : 1;

    // 1. Chart 1: Threat Trends Wave
    if (this.ctxThreats) {
      const ctx = this.ctxThreats;
      const w = this.chartThreatsCanvas.width;
      const h = this.chartThreatsCanvas.height;
      ctx.clearRect(0, 0, w, h);

      // background lines
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Draw wave
      ctx.strokeStyle = threatLvl >= 4 ? 'var(--neon-red)' : 'var(--neon-orange)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const factor = threatLvl >= 3 ? 1.8 : 0.6;
        const noise = Math.sin(this.animTick * 0.04 + x * 0.05) * 12 * factor;
        const y = h/2 + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 2. Chart 2: Privacy Protection Trends (increasing bar indices)
    if (this.ctxPrivacy) {
      const ctx = this.ctxPrivacy;
      const w = this.chartPrivacyCanvas.width;
      const h = this.chartPrivacyCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 230, 118, 0.04)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const barCount = 12;
      const barW = w / barCount - 3;
      const globalAnon = window.ShieldState ? window.ShieldState.globalAnonymity : true;

      for (let i = 0; i < barCount; i++) {
        const multiplier = globalAnon ? 1 : 0.2;
        const barH = (15 + (i * 3) + Math.cos(this.animTick * 0.02 + i) * 3) * multiplier;
        const x = i * (barW + 3) + 2;
        const y = h - barH;

        ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
        ctx.fillRect(x, y, barW, barH);
        ctx.strokeStyle = 'var(--neon-green)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, barW, barH);
      }
    }

    // 3. Chart 3: AI Classification Accuracy (stable linear index with slight noise)
    if (this.ctxAccuracy) {
      const ctx = this.ctxAccuracy;
      const w = this.chartAccuracyCanvas.width;
      const h = this.chartAccuracyCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      ctx.strokeStyle = 'var(--neon-blue)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const noise = Math.sin(this.animTick * 0.01 + x * 0.1) * 2 + Math.random() * 1.5;
        const y = h - 25 + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 4. Chart 4: Emergency Tactical Events
    if (this.ctxEmergency) {
      const ctx = this.ctxEmergency;
      const w = this.chartEmergencyCanvas.width;
      const h = this.chartEmergencyCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(177, 13, 201, 0.04)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const pointCount = 10;
      const barW = w / pointCount - 4;
      for (let i = 0; i < pointCount; i++) {
        const multiplier = threatLvl >= 3 ? (1.5 + (i % 2) * 0.8) : 0.6;
        const barH = (10 + (i * 4) % 25 + Math.sin(this.animTick * 0.03 + i) * 4) * multiplier;
        const x = i * (barW + 4) + 2;
        const y = h - barH;

        ctx.fillStyle = threatLvl === 5 ? 'rgba(255, 56, 96, 0.15)' : 'rgba(177, 13, 201, 0.15)';
        ctx.fillRect(x, y, barW, barH);
        ctx.strokeStyle = threatLvl === 5 ? 'var(--neon-red)' : 'var(--neon-purple)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, barW, barH);
      }
    }
  }

  startDashboardEventLoops() {
    const loop = () => {
      this.drawWebcamFeed();
      this.drawHeatmap();
      this.drawAnalyticsCharts();
      
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.telemetryStats = new TelemetryStatsManager();
  window.sentinelOverview = new SentinelOverviewDashboard();
});
