/* AI Analytics Center and Drone Flight Controller for ShadowShield AI */

class AnalyticsConsole {
  constructor() {
    this.chartCanvas = document.getElementById('surveillance-risk-chart');
    this.droneCanvas = document.getElementById('drone-console-canvas');
    this.orbitCanvas = document.getElementById('satellite-orbit-canvas');
    
    // Canvas contexts
    this.chartCtx = this.chartCanvas ? this.chartCanvas.getContext('2d') : null;
    this.droneCtx = this.droneCanvas ? this.droneCanvas.getContext('2d') : null;
    this.orbitCtx = this.orbitCanvas ? this.orbitCanvas.getContext('2d') : null;
    
    this.animTick = 0;
    
    // Dynamic chart data arrays (Incidents, Privacy Index)
    this.chartPointsCount = 12;
    this.threatData = [10, 15, 8, 5, 20, 12, 18, 30, 22, 10, 8, 12];
    this.privacyData = [95, 96, 98, 99, 90, 94, 92, 75, 82, 98, 99, 98];
    
    // Drone simulation state
    this.isDroneFlying = false;
    this.droneX = 0;
    this.droneY = 0;
    this.droneTargetX = 0;
    this.droneTargetY = 0;
    this.dronePathPoints = [];
    this.activeRadarPulse = null;
    
    this.init();
  }

  init() {
    this.resizeCanvases();
    this.setupListeners();
    this.startSimulationLoop();
  }

  resizeCanvases() {
    if (this.chartCanvas) {
      this.chartCanvas.width = this.chartCanvas.parentElement.clientWidth || 500;
      this.chartCanvas.height = this.chartCanvas.parentElement.clientHeight || 250;
    }
    if (this.droneCanvas) {
      this.droneCanvas.width = this.droneCanvas.parentElement.clientWidth || 300;
      this.droneCanvas.height = this.droneCanvas.parentElement.clientHeight || 130;
    }
    if (this.orbitCanvas) {
      this.orbitCanvas.width = 140;
      this.orbitCanvas.height = 70;
    }
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resizeCanvases());

    // Deploy drone button click trigger
    const deployBtn = document.getElementById('analytics-deploy-drone-btn');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        this.triggerDroneDeployment();
      });
    }
    
    // Jitter metrics update loop
    setInterval(() => {
      // Crowd density updates
      const densEl = document.getElementById('analytics-density');
      if (densEl) {
        const val = (45 + Math.sin(this.animTick * 0.05) * 5 + Math.random() * 2).toFixed(1);
        densEl.innerText = `${val}%`;
      }
      
      // Sync loading metrics
      const loadEl = document.getElementById('telemetry-trans-load');
      if (loadEl) {
        const val = (420 + Math.cos(this.animTick * 0.03) * 20 + Math.random() * 5).toFixed(1);
        loadEl.innerText = `${val} Mb/s`;
      }

      // Slightly update dynamic chart data lists to simulate real-time metrics stream
      if (Math.random() > 0.6) {
        this.threatData.shift();
        const nextThreat = Math.max(2, Math.min(80, Math.floor(this.threatData[this.threatData.length - 1] + (Math.random() * 8 - 4))));
        this.threatData.push(nextThreat);

        this.privacyData.shift();
        const nextPrivacy = Math.max(30, Math.min(100, Math.floor(this.privacyData[this.privacyData.length - 1] + (Math.random() * 4 - 2))));
        this.privacyData.push(nextPrivacy);
      }
    }, 3000);
  }

  triggerDroneDeployment() {
    if (this.isDroneFlying) return;
    
    this.isDroneFlying = true;
    this.droneX = 20;
    this.droneY = this.droneCanvas.height / 2;
    this.droneTargetX = this.droneCanvas.width - 20;
    this.droneTargetY = this.droneCanvas.height / 2 + (Math.random() * 30 - 15);
    
    // Deploy announcement
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('voiceSpeak', "Drone deployment sequence initiated. Commencing aerial scan of Sector 7.");
      window.ShieldEvents.emit('droneDeployed');

      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        msg: "DRONE DEPLOY: Unit #07 dispatched. Initiating aerial scanning beam."
      });
    }

    if (window.ShieldAudio) {
      window.ShieldAudio.playSuccess();
      window.ShieldAudio.startScanHum();
    }
  }

  drawAnalyticsChart() {
    if (!this.chartCtx) return;
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;
    
    ctx.clearRect(0, 0, w, h);

    // Grid details
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;
    
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    // Draw borders & reference grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    
    const gridCols = 6;
    const gridRows = 4;
    
    for (let c = 0; c <= gridCols; c++) {
      const x = paddingLeft + (c / gridCols) * chartW;
      ctx.beginPath(); ctx.moveTo(x, paddingTop); ctx.lineTo(x, h - paddingBottom); ctx.stroke();
    }
    for (let r = 0; r <= gridRows; r++) {
      const y = paddingTop + (r / gridRows) * chartH;
      ctx.beginPath(); ctx.moveTo(paddingLeft, y); ctx.lineTo(w - paddingRight, y); ctx.stroke();
      
      // Y-axis ticks labels (0 to 100%)
      ctx.fillStyle = '#525f73';
      ctx.font = '7.5px monospace';
      const tickValue = Math.round(100 - (r / gridRows) * 100);
      ctx.fillText(`${tickValue}%`, 6, y + 2.5);
    }

    // Graph Toggles data mapping helper
    const getCoords = (dataList) => {
      const pts = [];
      const stepX = chartW / (dataList.length - 1);
      dataList.forEach((val, idx) => {
        const x = paddingLeft + idx * stepX;
        const y = paddingTop + chartH - (val / 100) * chartH;
        pts.push({ x, y });
      });
      return pts;
    };

    // 1. Draw Privacy index Area chart (Green)
    const privacyPts = getCoords(this.privacyData);
    ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.beginPath();
    ctx.moveTo(privacyPts[0].x, h - paddingBottom);
    privacyPts.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(privacyPts[privacyPts.length - 1].x, h - paddingBottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(privacyPts[0].x, privacyPts[0].y);
    privacyPts.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();

    // 2. Draw Threat severity Line chart (Red)
    const threatPts = getCoords(this.threatData);
    ctx.strokeStyle = 'rgba(255, 56, 96, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(threatPts[0].x, threatPts[0].y);
    threatPts.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();

    // Highlight target vertices with dynamic glowing nodes
    threatPts.forEach(pt => {
      ctx.fillStyle = 'var(--neon-red)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    privacyPts.forEach(pt => {
      ctx.fillStyle = 'var(--neon-green)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Chart Legends drawing
    ctx.font = '8px var(--font-hud)';
    ctx.fillStyle = 'var(--neon-green)';
    ctx.fillText("■ PRIVACY SHIELD RATIO", paddingLeft + 10, h - 8);
    ctx.fillStyle = 'var(--neon-red)';
    ctx.fillText("■ PREDICTIVE RISK SEVERITY", paddingLeft + 160, h - 8);
  }

  drawDroneConsole() {
    if (!this.droneCtx) return;
    const ctx = this.droneCtx;
    const w = this.droneCanvas.width;
    const h = this.droneCanvas.height;

    // Draw dark scan backdrop
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Draw digital coordinates scanning lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.isDroneFlying) {
      // Advance drone progress
      const dx = this.droneTargetX - this.droneX;
      const dy = this.droneTargetY - this.droneY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 2.2;
      
      if (dist > 3) {
        this.droneX += (dx / dist) * speed;
        this.droneY += (dy / dist) * speed;
        
        // Spawn active scanning sweeps at intervals
        if (this.animTick % 25 === 0) {
          this.activeRadarPulse = {
            x: this.droneX,
            y: this.droneY,
            size: 0,
            opacity: 1.0
          };
        }
      } else {
        // Complete trajectory flight
        this.isDroneFlying = false;
        this.activeRadarPulse = null;
        if (window.ShieldAudio) window.ShieldAudio.stopScanHum();
      }

      // Draw radar sweep pulse projection
      if (this.activeRadarPulse) {
        const pulse = this.activeRadarPulse;
        pulse.size += 1.5;
        pulse.opacity -= 0.02;
        
        if (pulse.opacity > 0) {
          ctx.strokeStyle = `rgba(0, 242, 254, ${pulse.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.size, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Drone flight vector path line
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(20, h/2);
      ctx.lineTo(this.droneX, this.droneY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Drone icon block
      ctx.fillStyle = 'var(--neon-blue)';
      ctx.shadowColor = 'var(--neon-blue)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.droneX, this.droneY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Scanning vector beam
      ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.beginPath();
      ctx.moveTo(this.droneX, this.droneY);
      ctx.lineTo(this.droneX - 15, h);
      ctx.lineTo(this.droneX + 15, h);
      ctx.closePath();
      ctx.fill();

      // Telemetry tagging details
      ctx.fillStyle = '#fff';
      ctx.font = '6.5px monospace';
      ctx.fillText(`DRONE_PATROL #07: X:${Math.round(this.droneX)} Y:${Math.round(this.droneY)}`, 10, 15);
      ctx.fillText("RADAR SCANNING PERIMETER ACTIVE", 10, 25);
    } else {
      // Idle state
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '7.5px var(--font-hud)';
      ctx.fillText("TACTICAL DRONE SYSTEMS: STANDBY", 10, 18);
      ctx.fillText("AWAITING LAUNCH SIGNAL", 10, 28);
      
      // Draw idle drone schematic outline centered
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
      ctx.beginPath();
      ctx.arc(w/2, h/2, 25, 0, Math.PI*2);
      ctx.rect(w/2 - 20, h/2 - 10, 40, 20);
      ctx.stroke();
    }
  }

  drawSatelliteOrbit() {
    if (!this.orbitCtx) return;
    const ctx = this.orbitCtx;
    const w = this.orbitCanvas.width;
    const h = this.orbitCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 10;

    // Draw localized planet Earth slice
    ctx.fillStyle = 'rgba(13, 16, 27, 0.8)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, h + 30, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Satellite Orbit rings trajectory
    ctx.strokeStyle = 'rgba(177, 13, 201, 0.15)';
    ctx.save();
    ctx.translate(cx, h + 30);
    ctx.scale(1, 0.35); // flatten to look 3D
    ctx.beginPath();
    ctx.arc(0, -65, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Dynamic satellite positions on orbit
    const orbitAngle = this.animTick * 0.025;
    const satX = cx + Math.cos(orbitAngle) * 65;
    const satY = cy - 25 + Math.sin(orbitAngle) * 8;

    // Communication beam to Earth
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(cx, h - 8);
    ctx.stroke();

    // Draw Satellite
    ctx.fillStyle = 'var(--neon-purple)';
    ctx.beginPath();
    ctx.fillRect(satX - 4, satY - 2, 8, 4); // main body
    
    // panels
    ctx.fillStyle = 'var(--neon-blue)';
    ctx.fillRect(satX - 10, satY - 1, 5, 2);
    ctx.fillRect(satX + 5, satY - 1, 5, 2);

    // Indicator dot
    ctx.fillStyle = (this.animTick % 30 < 15) ? 'var(--neon-green)' : 'transparent';
    ctx.beginPath();
    ctx.arc(satX, satY, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  startSimulationLoop() {
    const loop = () => {
      this.animTick++;
      this.drawAnalyticsChart();
      this.drawDroneConsole();
      this.drawSatelliteOrbit();
      
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.analyticsConsole = new AnalyticsConsole();
});
