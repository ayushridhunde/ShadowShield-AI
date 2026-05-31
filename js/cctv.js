/* CCTV Surveillance Simulator for ShadowShield AI */

class CCTVStream {
  constructor(canvasId, cameraName, camType) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.cameraName = cameraName;
    this.camType = camType; // 'plaza', 'tunnel', 'metro', 'gate'
    this.entities = [];
    this.width = this.canvas.width = 640;
    this.height = this.canvas.height = 360;
    
    // Switch state triggers
    this.currentChannel = camType; // 'plaza', 'retail', etc.
    this.currentFilter = 'normal';
    this.showBBoxes = true;
    this.showVectors = true;
    this.showBlur = true;
    this.webcamVideo = null;
    this.webcamStream = null;
    this.webcamError = false;
    this.animTick = 0;
    
    // Spawn some initial entities
    this.initEntities();
    this.startStream();
  }

  initEntities() {
    const count = this.camType === 'metro' ? 12 : 5;
    for (let i = 0; i < count; i++) {
      this.entities.push({
        id: Math.floor(Math.random() * 9000 + 1000),
        x: Math.random() * (this.width - 100) + 50,
        y: Math.random() * (this.height - 120) + 60,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 8 + 14,
        name: this.generateRandomName(),
        speedFactor: Math.random() * 0.2 + 0.9
      });
    }
  }

  generateRandomName() {
    const names = ["A. Carter", "M. Vance", "S. Chen", "K. Kovacs", "L. Ripley", "J. Deckard", "T. Miller", "R. Flynn"];
    return names[Math.floor(Math.random() * names.length)];
  }

  updateEntities() {
    this.entities.forEach(ent => {
      ent.x += ent.vx * ent.speedFactor;
      ent.y += ent.vy * ent.speedFactor;

      // Bounce boundaries
      if (ent.x < 30 || ent.x > this.width - 30) {
        ent.vx *= -1;
        ent.x = Math.max(30, Math.min(ent.x, this.width - 30));
      }
      if (ent.y < 40 || ent.y > this.height - 40) {
        ent.vy *= -1;
        ent.y = Math.max(40, Math.min(ent.y, this.height - 40));
      }
      
      // Cam 02 restricted area intrusion check
      if (this.camType === 'tunnel') {
        const isInRestrictedArea = ent.x > 380 && ent.y > 150;
        if (isInRestrictedArea && !ent.wasIntruding) {
          ent.wasIntruding = true;
          ent.vx *= -1.5; // push back
          window.ShieldEvents.emit('intrusionAlert', {
            cam: this.cameraName,
            id: ent.id,
            coords: `X:${Math.round(ent.x)} Y:${Math.round(ent.y)}`
          });
        } else if (!isInRestrictedArea) {
          ent.wasIntruding = false;
        }
      }
    });
  }

  async initWebcamStream() {
    this.webcamVideo = document.getElementById('cctv-webcam-stream');
    if (!this.webcamVideo) return;
    
    this.stopWebcamStream();
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Webcam not supported. Operating in offline simulation mode.");
      this.webcamError = true;
      return;
    }
    
    try {
      this.webcamError = false;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360, facingMode: 'user' },
        audio: false
      });
      this.webcamStream = stream;
      this.webcamVideo.srcObject = stream;
      this.webcamVideo.setAttribute('playsinline', true);
      this.webcamVideo.play();
      
      if (window.ShieldEvents) {
        window.ShieldEvents.emit('newSystemLog', {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          msg: "Surveillance channel: live camera feed connected successfully."
        });
      }
    } catch (err) {
      console.warn("CCTV webcam blocked or unavailable. Falling back to simulations.", err);
      this.webcamError = true;
      this.stopWebcamStream();
    }
  }

  stopWebcamStream() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    if (this.webcamVideo) {
      this.webcamVideo.srcObject = null;
    }
  }

  switchChannel(channel) {
    this.currentChannel = channel;
    
    if (window.ShieldEvents) {
      window.ShieldEvents.emit('cctvChannelChanged', { channel: channel });
    }
    
    // Set appropriate label on top
    const titleEl = document.getElementById('cam-01-channel-title');
    if (titleEl) {
      const channelNames = {
        plaza: 'LOBBY',
        retail: 'RETAIL',
        perimeter: 'PERIMETER',
        street: 'STREET',
        drone: 'DRONE',
        webcam: 'LIVE WEBCAM'
      };
      titleEl.innerText = channelNames[channel] || 'LOBBY';
    }

    if (channel === 'webcam') {
      this.initWebcamStream();
    } else {
      this.stopWebcamStream();
    }
  }

  switchFilter(filter) {
    this.currentFilter = filter;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    this.animTick++;
    const isOverrideActive = window.ShieldState.activeWarrantOverride && this.camType === 'plaza';
    const isLockdown = window.ShieldState.lockdownEnabled;
    
    // Anonymization active checks global shield status and local toggles
    const anonymityActive = window.ShieldState.globalAnonymity && !isOverrideActive;
    const activeMaskStatus = anonymityActive && this.showBlur;
    
    // 1. Draw Background
    if (this.currentFilter === 'wireframe') {
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < this.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
      }
    } else if (this.currentChannel === 'webcam' && this.webcamStream && this.webcamVideo && this.webcamVideo.readyState >= 2) {
      ctx.save();
      // Mirror horizontally
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.webcamVideo, 0, 0, this.width, this.height);
      ctx.restore();

      // Cyber light blue grading tint over video
      ctx.fillStyle = 'rgba(0, 242, 254, 0.06)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // Solid cyber grid background fallback/others
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }

      // Channel-specific visual cues
      if (this.currentChannel === 'retail') {
        // Draw retail counters wireframes
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.strokeRect(60, 80, 120, 80);
        ctx.strokeRect(this.width - 180, 80, 120, 80);
        ctx.font = '7px var(--font-hud)';
        ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
        ctx.fillText("SHELF_A", 65, 95);
        ctx.fillText("SHELF_B", this.width - 175, 95);
      } else if (this.currentChannel === 'perimeter') {
        // Draw boundary threat line
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.7);
        ctx.lineTo(this.width, this.height * 0.7);
        ctx.stroke();
        ctx.font = '7px var(--font-hud)';
        ctx.fillStyle = 'rgba(255, 56, 96, 0.4)';
        ctx.fillText("WARNING: PERIMETER GATEWAY INTRUSION THRESHOLD", 20, this.height * 0.7 - 8);
      } else if (this.currentChannel === 'street') {
        // Draw street lines
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (this.currentChannel === 'drone') {
        // Draw drone telemetry scans
        ctx.strokeStyle = 'rgba(177, 13, 201, 0.15)';
        ctx.strokeRect(30, 30, this.width - 60, this.height - 60);
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, 100, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '7px var(--font-hud)';
        ctx.fillStyle = 'rgba(177, 13, 201, 0.4)';
        ctx.fillText("DRONE ALTITUDE: 142m | GS: 42 km/h", 45, 48);
      }
    }

    // Heatmap mode for metro
    if (this.currentChannel === 'metro' && this.currentFilter !== 'wireframe') {
      this.drawMetroHeatmap();
    }

    // Restricted sector overlay for tunnel
    if (this.currentChannel === 'tunnel' && this.currentFilter !== 'wireframe') {
      ctx.fillStyle = 'rgba(255, 56, 96, 0.08)';
      ctx.fillRect(380, 150, 260, 210);
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(380, 150);
      ctx.lineTo(640, 150);
      ctx.moveTo(380, 150);
      ctx.lineTo(380, 360);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'var(--neon-red)';
      ctx.font = '9px var(--font-hud)';
      ctx.fillText("RESTRICTED ZONE ALPHA", 390, 170);
    }

    // 2. Draw Entities (using filter constraints)
    this.entities.forEach(ent => {
      const drawBlur = this.showBlur && anonymityActive;
      const drawBBox = this.showBBoxes;
      const drawVector = this.showVectors;

      // Draw bounding box around citizen body
      if (drawBBox) {
        ctx.lineWidth = 1.5;
        if (ent.wasIntruding) {
          ctx.strokeStyle = 'var(--neon-red)';
          ctx.fillStyle = 'rgba(255, 56, 96, 0.03)';
        } else {
          ctx.strokeStyle = anonymityActive ? 'var(--neon-blue)' : 'var(--neon-purple)';
          ctx.fillStyle = 'rgba(0, 242, 254, 0.01)';
        }
        
        const widthBox = ent.size * 2.2;
        const heightBox = ent.size * 4;
        
        if (this.currentFilter !== 'wireframe') {
          ctx.fillRect(ent.x - widthBox/2, ent.y - heightBox/2, widthBox, heightBox);
        }
        ctx.strokeRect(ent.x - widthBox/2, ent.y - heightBox/2, widthBox, heightBox);
      }

      // Draw velocity vectors
      if (drawVector) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(177, 13, 201, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.moveTo(ent.x, ent.y);
        ctx.lineTo(ent.x + ent.vx * 15, ent.y + ent.vy * 15);
        ctx.stroke();
        
        // arrow head
        const angle = Math.atan2(ent.vy, ent.vx);
        ctx.fillStyle = 'rgba(177, 13, 201, 0.7)';
        ctx.beginPath();
        ctx.moveTo(ent.x + ent.vx * 15, ent.y + ent.vy * 15);
        ctx.lineTo(ent.x + ent.vx * 15 - 4 * Math.cos(angle - Math.PI / 6), ent.y + ent.vy * 15 - 4 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ent.x + ent.vx * 15 - 4 * Math.cos(angle + Math.PI / 6), ent.y + ent.vy * 15 - 4 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      // Draw head / face region
      const faceRadius = ent.size * 0.7;
      const faceY = ent.y - (ent.size * 4)/2.5;

      if (drawBlur) {
        // Face Scrambling Matrix with HTML5 Canvas filter blur!
        if (this.currentFilter !== 'wireframe') {
          ctx.save();
          // Clip to the circular face area
          ctx.beginPath();
          ctx.arc(ent.x, faceY, faceRadius, 0, Math.PI * 2);
          ctx.clip();
          
          // Apply standard 8px blur filter to satisfy the hackathon request
          ctx.filter = 'blur(8px)';
          
          if (this.currentChannel === 'webcam' && this.webcamStream && this.webcamVideo && this.webcamVideo.readyState >= 2) {
            // Draw mirrored webcam feed cropped inside clipped circle
            ctx.save();
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(this.webcamVideo, 0, 0, this.width, this.height);
            ctx.restore();
          } else {
            // Draw a colorful dynamic gradient block for the simulated citizen face, blurred
            const faceGrad = ctx.createRadialGradient(ent.x, faceY, 2, ent.x, faceY, faceRadius);
            faceGrad.addColorStop(0, 'rgba(0, 242, 254, 0.9)');
            faceGrad.addColorStop(0.7, 'rgba(0, 100, 255, 0.7)');
            faceGrad.addColorStop(1, 'rgba(3, 3, 5, 0.4)');
            ctx.fillStyle = faceGrad;
            ctx.fillRect(ent.x - faceRadius * 2, faceY - faceRadius * 2, faceRadius * 4, faceRadius * 4);
          }
          
          ctx.restore();
          ctx.filter = 'none'; // reset filter
        }

        // Draw Scrambling mesh over the blurred face
        ctx.strokeStyle = 'var(--neon-blue)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = 4; r < faceRadius; r += 4) {
          ctx.arc(ent.x, faceY, r, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Tag label
        ctx.fillStyle = 'var(--neon-blue)';
        ctx.font = '8px var(--font-hud)';
        ctx.fillText(`CITIZEN_MASKED_${ent.id}`, ent.x - (ent.size * 2.2)/1.8, faceY - faceRadius - 6);
      } else {
        // Revealed Face HUD
        if (this.currentFilter !== 'wireframe') {
          ctx.fillStyle = 'rgba(177, 13, 201, 0.15)';
          ctx.beginPath();
          ctx.arc(ent.x, faceY, faceRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = 'var(--neon-purple)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ent.x, faceY, faceRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair overlay inside head
        ctx.strokeStyle = 'rgba(177, 13, 201, 0.5)';
        ctx.beginPath();
        ctx.moveTo(ent.x - faceRadius, faceY);
        ctx.lineTo(ent.x + faceRadius, faceY);
        ctx.moveTo(ent.x, faceY - faceRadius);
        ctx.lineTo(ent.x, faceY + faceRadius);
        ctx.stroke();

        // Unshielded Target Identifier Text
        ctx.fillStyle = 'var(--neon-purple)';
        ctx.font = '9px var(--font-hud)';
        ctx.fillText(`${ent.name} [ID:${ent.id}]`, ent.x - (ent.size * 2.2)/1.5, faceY - faceRadius - 6);
      }
    });

    // 3. Apply HUD Render Filters Overlay
    if (this.currentFilter === 'night') {
      ctx.fillStyle = 'rgba(0, 255, 100, 0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // Green sweep line
      const sweepY = (this.animTick * 2) % this.height;
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, sweepY);
      ctx.lineTo(this.width, sweepY);
      ctx.stroke();

      // Scanline sweep effect
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < this.height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
    } else if (this.currentFilter === 'thermal') {
      ctx.fillStyle = 'rgba(5, 5, 45, 0.32)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // Draw dynamic glowing thermal rings around entities
      this.entities.forEach(ent => {
        const heatGrad = ctx.createRadialGradient(ent.x, ent.y, 4, ent.x, ent.y, ent.size * 3.2);
        heatGrad.addColorStop(0, 'rgba(255, 80, 0, 0.65)');
        heatGrad.addColorStop(0.2, 'rgba(255, 200, 0, 0.45)');
        heatGrad.addColorStop(0.5, 'rgba(0, 255, 100, 0.25)');
        heatGrad.addColorStop(0.8, 'rgba(0, 100, 255, 0.12)');
        heatGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(ent.x, ent.y, ent.size * 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw diagnostic overlay at top right of canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(this.width - 150, 25, 140, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    const maskRatio = activeMaskStatus ? '100%' : '0%';
    ctx.fillText(`ANONYMIZED: ${maskRatio}`, this.width - 140, 38);

    // Update the DOM status badge dynamically for CAM 01
    if (this.camType === 'plaza') {
      const statusBadge = document.getElementById('cctv-mask-status-badge');
      if (statusBadge) {
        if (activeMaskStatus) {
          statusBadge.innerText = "ANONYMITY PROTECT ACTIVE";
          statusBadge.style.color = "var(--neon-green)";
          statusBadge.style.borderColor = "var(--neon-green)";
        } else {
          statusBadge.innerText = "ANONYMITY BYPASSED / DEACTIVATED";
          statusBadge.style.color = "var(--neon-red)";
          statusBadge.style.borderColor = "var(--neon-red)";
        }
      }
    }

    // Holographic Drone Sweep Tracker overlay on CCTV (Visual Wow!)
    ctx.strokeStyle = isLockdown ? 'rgba(255, 56, 96, 0.15)' : 'rgba(0, 242, 254, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);

    // Dynamic sweeping scanner arc simulating active flying drone tracking search beam!
    const time = Date.now() * 0.0018;
    const droneSweepX = this.width / 2 + Math.sin(time * 0.8) * (this.width / 2.5);
    const droneSweepY = this.height / 2 + Math.cos(time) * (this.height / 3);

    // Glowing drone focus point
    ctx.fillStyle = isLockdown ? 'rgba(255, 56, 96, 0.18)' : 'rgba(177, 13, 201, 0.12)';
    ctx.beginPath();
    ctx.arc(droneSweepX, droneSweepY, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isLockdown ? 'var(--neon-red)' : 'var(--neon-purple)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(droneSweepX, droneSweepY, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair target in drone focus
    ctx.beginPath();
    ctx.moveTo(droneSweepX - 20, droneSweepY); ctx.lineTo(droneSweepX + 20, droneSweepY);
    ctx.moveTo(droneSweepX, droneSweepY - 20); ctx.lineTo(droneSweepX, droneSweepY + 20);
    ctx.stroke();

    ctx.fillStyle = isLockdown ? 'var(--neon-red)' : 'var(--neon-purple)';
    ctx.font = '6px monospace';
    ctx.fillText("DRONE_PATROL_SWEEP", droneSweepX + 18, droneSweepY - 4);
  }

  drawMetroHeatmap() {
    const ctx = this.ctx;
    this.entities.forEach(ent => {
      // Draw smooth radial gradients representing heat spots
      const heatGrad = ctx.createRadialGradient(ent.x, ent.y, 5, ent.x, ent.y, ent.size * 3.5);
      heatGrad.addColorStop(0, 'rgba(255, 56, 96, 0.25)');
      heatGrad.addColorStop(0.5, 'rgba(243, 243, 21, 0.12)');
      heatGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = heatGrad;
      ctx.fillRect(ent.x - ent.size * 4, ent.y - ent.size * 4, ent.size * 8, ent.size * 8);
    });
  }

  startStream() {
    const renderLoop = () => {
      this.updateEntities();
      this.draw();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}

// Instantiate Streams on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.CCTVCams = {
    cam01: new CCTVStream('cam-01-canvas', 'CAM 01: CENTRAL PLAZA', 'plaza'),
    cam02: new CCTVStream('cam-02-canvas', 'CAM 02: NORTH TUNNEL', 'tunnel'),
    cam03: new CCTVStream('cam-03-canvas', 'CAM 03: METRO STATION', 'metro'),
    cam04: new CCTVStream('cam-04-canvas', 'CAM 04: EAST GATE', 'gate')
  };

  // Channel Selection tab switching
  document.querySelectorAll('.cctv-channel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const channel = e.target.getAttribute('data-channel');
      
      // Toggle button active status in tab bar
      document.querySelectorAll('.cctv-channel-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = "transparent";
        b.style.borderColor = "rgba(255,255,255,0.05)";
        b.style.color = "var(--text-secondary)";
      });
      e.target.classList.add('active');
      e.target.style.background = channel === 'webcam' ? "rgba(79, 172, 254, 0.15)" : "rgba(0, 242, 254, 0.15)";
      e.target.style.borderColor = channel === 'webcam' ? "var(--neon-blue)" : "var(--border-neon)";
      e.target.style.color = channel === 'webcam' ? "var(--neon-blue)" : "var(--neon-cyan)";
      
      // Sound chime
      if (window.ShieldAudio) window.ShieldAudio.playClick();
      
      // Update Stream state
      if (window.CCTVCams && window.CCTVCams.cam01) {
        window.CCTVCams.cam01.switchChannel(channel);
      }
    });
  });

  // Filter Selection button switching
  document.querySelectorAll('.cctv-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.getAttribute('data-filter');
      
      // Toggle active states
      document.querySelectorAll('.cctv-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = "transparent";
        b.style.borderColor = "rgba(255,255,255,0.05)";
        b.style.color = "var(--text-secondary)";
      });
      e.target.classList.add('active');
      e.target.style.background = "rgba(0, 242, 254, 0.15)";
      e.target.style.borderColor = "var(--border-neon)";
      e.target.style.color = "var(--neon-cyan)";
      
      // Sound click
      if (window.ShieldAudio) window.ShieldAudio.playClick();
      
      // Update filter state
      if (window.CCTVCams && window.CCTVCams.cam01) {
        window.CCTVCams.cam01.switchFilter(filter);
        
        // Voice synthesizer audio cue
        if (window.ShieldEvents) {
          try {
            window.ShieldEvents.emit('voiceSpeak', `Camera filter modes set to ${filter.toUpperCase()}.`);
          } catch (audioErr) {
            console.warn("Audio sweep speak fail:", audioErr);
          }
        }
      }
    });
  });

  // Checkbox bindings
  const bboxCheck = document.getElementById('cctv-toggle-bboxes');
  const vectorCheck = document.getElementById('cctv-toggle-vectors');
  const blurCheck = document.getElementById('cctv-toggle-blur');

  if (bboxCheck) {
    bboxCheck.addEventListener('change', (e) => {
      if (window.CCTVCams && window.CCTVCams.cam01) {
        window.CCTVCams.cam01.showBBoxes = e.target.checked;
      }
    });
  }

  if (vectorCheck) {
    vectorCheck.addEventListener('change', (e) => {
      if (window.CCTVCams && window.CCTVCams.cam01) {
        window.CCTVCams.cam01.showVectors = e.target.checked;
      }
    });
  }

  if (blurCheck) {
    blurCheck.addEventListener('change', (e) => {
      if (window.CCTVCams && window.CCTVCams.cam01) {
        window.CCTVCams.cam01.showBlur = e.target.checked;
      }
    });
  }

  // Sync override styling
  window.ShieldEvents.on('warrantOverrideToggled', (active) => {
    const plazaFeed = document.getElementById('cam-01-panel');
    if (active) {
      if (plazaFeed) plazaFeed.classList.add('unshielded');
      const bypassBtn = document.getElementById('override-btn-01');
      if (bypassBtn) bypassBtn.innerText = "RESTORE MASK";
    } else {
      if (plazaFeed) plazaFeed.classList.remove('unshielded');
      const bypassBtn = document.getElementById('override-btn-01');
      if (bypassBtn) bypassBtn.innerText = "WARRANT BYPASS";
    }
  });

  window.ShieldEvents.on('intrusionAlert', (data) => {
    window.ShieldEvents.emit('newSystemLog', {
      time: new Date().toLocaleTimeString(),
      type: 'critical',
      msg: `INTRUSION: Target ${data.id} breached boundaries on ${data.cam} [${data.coords}]`
    });
  });
});
