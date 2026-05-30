/* Biometric Authentication and Login Logic for ShadowShield AI */

class ShieldLoginPortal {
  constructor() {
    this.selectedRole = 'citizen'; // 'citizen' or 'admin'
    this.selectedBio = 'face'; // 'face', 'fingerprint', 'retina'
    this.canvas = document.getElementById('login-scan-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width = 300;
      this.height = this.canvas.height = 200;
    }
    
    // Webcam hooks
    this.video = document.getElementById('login-webcam-feed');
    this.webcamStream = null;
    this.webcamError = false;

    this.scanProgress = 0;
    this.scanInterval = null;
    this.isScanning = false;
    this.animFrame = null;
    this.animTick = 0;

    this.initHandlers();
    this.startScannerAnimationLoop();
    
    // Automatically trigger initial camera check since 'face' is the default
    this.initWebcam();
  }

  initHandlers() {
    // Role selection
    const citizenBtn = document.getElementById('role-btn-citizen');
    const agentBtn = document.getElementById('role-btn-agent');
    const adminBtn = document.getElementById('role-btn-admin');
    
    const clearRoles = () => {
      [citizenBtn, agentBtn, adminBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
    };

    if (citizenBtn) {
      citizenBtn.addEventListener('click', () => {
        this.selectedRole = 'citizen';
        clearRoles();
        citizenBtn.classList.add('active');
        this.switchBiometricType('face');
        
        // Populate manual username automatically for ease of demo
        const manualUser = document.getElementById('manual-login-username');
        if (manualUser) manualUser.value = 'citizen';
      });
    }

    if (agentBtn) {
      agentBtn.addEventListener('click', () => {
        this.selectedRole = 'agent';
        clearRoles();
        agentBtn.classList.add('active');
        this.switchBiometricType('face');
        
        // Populate manual username automatically for ease of demo
        const manualUser = document.getElementById('manual-login-username');
        if (manualUser) manualUser.value = 'agent';
      });
    }

    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        this.selectedRole = 'admin';
        clearRoles();
        adminBtn.classList.add('active');
        this.switchBiometricType('fingerprint');
        
        // Populate manual username automatically for ease of demo
        const manualUser = document.getElementById('manual-login-username');
        if (manualUser) manualUser.value = 'admin';
      });
    }

    // Biometric selector buttons
    document.querySelectorAll('.bio-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bio = e.target.getAttribute('data-bio');
        this.switchBiometricType(bio);
      });
    });

    // Tactile Scanner Button for holding down Fingerprints or clicking camera modes
    const scanBtn = document.getElementById('trigger-login-scan-btn');
    if (scanBtn) {
      const handleStart = (e) => {
        e.preventDefault();
        // If fingerprint mode is active, we require holding the button
        if (this.selectedBio === 'fingerprint') {
          if (!this.isScanning) {
            this.startBiometricScan();
          }
        } else {
          // Face ID or Retina scan are simple start clicks (and camera will validate them)
          if (!this.isScanning) {
            this.startBiometricScan();
          }
        }
      };

      const handleEnd = () => {
        // Fingerprint hold release interrupt checker
        if (this.selectedBio === 'fingerprint' && this.isScanning && this.scanProgress < 100) {
          if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
          }
          this.isScanning = false;
          this.scanProgress = 0;
          
          const viewport = document.getElementById('login-scanner-viewport');
          const statusText = document.getElementById('login-scan-status-label');
          const progressEl = document.getElementById('login-scan-progress-bar');
          
          if (viewport) viewport.classList.remove('scanning');
          scanBtn.disabled = false;
          if (progressEl) progressEl.style.width = '0%';
          
          if (statusText) {
            statusText.innerText = "SCAN INTERRUPTED: KEEP POSITION SECURED";
            statusText.style.color = "#ff3860";
          }
          
          if (window.ShieldEvents) {
            try {
              window.ShieldEvents.emit('voiceSpeak', "Scan interrupted. Secure key alignment failed.");
            } catch (audioErr) {
              console.warn("Audio failed during fingerprint release:", audioErr);
            }
          }
        }
      };

      // Mouse tactile events
      scanBtn.addEventListener('mousedown', handleStart);
      scanBtn.addEventListener('touchstart', handleStart, { passive: false });

      // Mouse lift / leave interrupts
      scanBtn.addEventListener('mouseup', handleEnd);
      scanBtn.addEventListener('mouseleave', handleEnd);
      scanBtn.addEventListener('touchend', handleEnd);
      
      // Standard click fallback for face/retina mode
      scanBtn.addEventListener('click', (e) => {
        if (this.selectedBio !== 'fingerprint') {
          if (!this.isScanning) {
            this.startBiometricScan();
          }
        }
      });
    }

    // Instant Bypass Scan Button (Hackathon Mode)
    const bypassBtn = document.getElementById('bypass-login-scan-btn');
    if (bypassBtn) {
      bypassBtn.addEventListener('click', () => {
        if (window.ShieldEvents) {
          window.ShieldEvents.emit('voiceSpeak', "Bypassing biometric sync sequence. Authorizing session.");
        }
        this.completeBiometricScan();
      });
    }

    // Gateway Toggles (Bio vs Manual)
    const modeBtnBio = document.getElementById('login-mode-btn-bio');
    const modeBtnManual = document.getElementById('login-mode-btn-manual');
    const bioGroup = document.getElementById('login-scanner-viewport-group');
    const manualGroup = document.getElementById('login-manual-credentials-group');

    if (modeBtnBio && modeBtnManual) {
      modeBtnBio.addEventListener('click', () => {
        modeBtnBio.classList.add('active');
        modeBtnManual.classList.remove('active');
        if (bioGroup) bioGroup.style.display = 'flex';
        if (manualGroup) manualGroup.style.display = 'none';
        
        // Turn webcam back on if relevant
        if (this.selectedBio === 'face' || this.selectedBio === 'retina') {
          this.initWebcam();
        }
      });

      modeBtnManual.addEventListener('click', () => {
        modeBtnManual.classList.add('active');
        modeBtnBio.classList.remove('active');
        if (manualGroup) manualGroup.style.display = 'flex';
        if (bioGroup) bioGroup.style.display = 'none';
        
        // Shut off camera to turn off user's webcam light immediately
        this.stopWebcam();
      });
    }

    // Trigger Manual Credentials Handshake
    const manualLoginBtn = document.getElementById('trigger-manual-login-btn');
    if (manualLoginBtn) {
      manualLoginBtn.addEventListener('click', () => {
        this.verifyManualCredentials();
      });
    }

    // OTP Verify submit trigger
    const otpVerifyBtn = document.getElementById('login-otp-verify-btn');
    if (otpVerifyBtn) {
      otpVerifyBtn.addEventListener('click', () => {
        this.verifyLoginOTP();
      });
    }

    // Log Out button in header
    const logoutBtn = document.getElementById('hud-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  async initWebcam() {
    if (!this.video) return;
    
    // Clear any existing stream
    this.stopWebcam();
    
    if (this.selectedBio === 'fingerprint') {
      return; // Webcam not used for fingerprint scanning
    }

    // Safety check for browser capabilities
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Webcam API (navigator.mediaDevices.getUserMedia) is not supported. Operating in offline simulation mode.");
      this.webcamError = true;
      return;
    }

    try {
      this.webcamError = false;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 200, facingMode: 'user' },
        audio: false
      });
      
      // Bind stream to hidden video tag
      this.webcamStream = stream;
      this.video.srcObject = stream;
      this.video.setAttribute('playsinline', true);
      this.video.play();
    } catch (err) {
      console.warn("Webcam access blocked or unavailable. Falling back to wireframe simulations.", err);
      this.webcamError = true;
      this.stopWebcam();
    }
  }

  stopWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  switchBiometricType(bio) {
    this.selectedBio = bio;
    
    // Toggle active classes on buttons
    document.querySelectorAll('.bio-type-btn').forEach(btn => {
      if (btn.getAttribute('data-bio') === bio) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const statusText = document.getElementById('login-scan-status-label');
    if (statusText) {
      statusText.innerText = `AWAITING ${bio.toUpperCase()} SCAN`;
      statusText.style.color = "";
    }
    
    this.scanProgress = 0;
    const progressEl = document.getElementById('login-scan-progress-bar');
    if (progressEl) progressEl.style.width = '0%';
    
    // Activate camera if Face ID or Retina Scan selected, else close camera
    if (bio === 'face' || bio === 'retina') {
      this.initWebcam();
    } else {
      this.stopWebcam();
    }
  }

  startBiometricScan() {
    try {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
      }
      
      this.isScanning = true;
      this.scanProgress = 0;
      this.hasMorphed = false;
      
      const viewport = document.getElementById('login-scanner-viewport');
      const statusText = document.getElementById('login-scan-status-label');
      const progressEl = document.getElementById('login-scan-progress-bar');
      const scanBtn = document.getElementById('trigger-login-scan-btn');
      
      if (viewport) viewport.classList.add('scanning');
      
      // ONLY disable the button if it is NOT Fingerprint scan mode!
      // This is crucial so we can capture the mouse release event on Fingerprint!
      if (scanBtn && this.selectedBio !== 'fingerprint') {
        scanBtn.disabled = true;
      }
      
      if (statusText) {
        statusText.innerText = "INITIATING SCAN SEQUENCE...";
        statusText.style.color = ""; // reset color
      }

      // Check if webcam is missing/blocked for Face/Retina modes!
      if ((this.selectedBio === 'face' || this.selectedBio === 'retina') && (this.webcamError || !this.webcamStream)) {
        // Trigger realistic biometric camera failure path!
        if (window.ShieldEvents) {
          try {
            window.ShieldEvents.emit('voiceSpeak', "Biometric failure. Active camera feed not detected. Security check aborted.");
          } catch (audioErr) {
            console.warn("Audio failed during camera block alert:", audioErr);
          }
        }
        
        const duration = 1200; // Fail after 1.2 seconds of scanning
        const intervalTime = 50;
        const step = 30 / (duration / intervalTime); // progress goes up to 30% max
        
        this.scanInterval = setInterval(() => {
          try {
            this.scanProgress += step;
            if (this.scanProgress >= 30) {
              this.scanProgress = 30;
              clearInterval(this.scanInterval);
              this.scanInterval = null;
              
              // Halted scan!
              this.isScanning = false;
              if (viewport) viewport.classList.remove('scanning');
              if (scanBtn) scanBtn.disabled = false;
              
              if (progressEl) progressEl.style.width = '30%';
              if (statusText) {
                statusText.innerText = "BIOMETRIC ERROR: NO LIVE FACE DATA DETECTED";
                statusText.style.color = "#ff3860";
              }
              return;
            }
            if (progressEl) progressEl.style.width = `${this.scanProgress}%`;
            if (statusText) {
              statusText.innerText = "CAPTURING CRYPTO NODE...";
            }
          } catch (innerErr) {
            console.error("Camera fail timer error:", innerErr);
            clearInterval(this.scanInterval);
            this.scanInterval = null;
          }
        }, intervalTime);
        return;
      }

      // Normal path with active feed / fingerprint hold
      if (window.ShieldEvents) {
        try {
          window.ShieldEvents.emit('voiceSpeak', `Initiating ${this.selectedBio} scanner verification sequence.`);
        } catch (audioErr) {
          console.warn("Audio announcement failed during scan startup:", audioErr);
        }
      }

      const duration = 2500; // 2.5 seconds
      const intervalTime = 50;
      const step = 100 / (duration / intervalTime);

      this.scanInterval = setInterval(() => {
        try {
          this.scanProgress += step;

          // Biometric Morphing (Face ID ➔ Retina Scan) at 50%
          if ((this.selectedBio === 'face' || this.selectedBio === 'retina') && this.scanProgress >= 50 && !this.hasMorphed) {
            this.hasMorphed = true;
            const targetBio = this.selectedBio === 'face' ? 'retina' : 'face';
            this.selectedBio = targetBio;

            // Synchronized HUD Tabs: Update active state in UI
            document.querySelectorAll('.bio-type-btn').forEach(btn => {
              if (btn.getAttribute('data-bio') === targetBio) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });

            // Audio Voiceover Synced
            if (window.ShieldEvents) {
              const speakText = targetBio === 'retina'
                ? "Face ID verified. Commencing secondary retina scan handshake."
                : "Retina verified. Commencing secondary Face ID scan handshake.";
              try {
                window.ShieldEvents.emit('voiceSpeak', speakText);
              } catch (audioErr) {
                console.warn("Audio voice transition failed:", audioErr);
              }
            }
          }

          if (this.scanProgress >= 100) {
            this.scanProgress = 100;
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            this.completeBiometricScan();
          }
          
          if (progressEl) progressEl.style.width = `${this.scanProgress}%`;
          
          if (statusText) {
            if (this.scanProgress < 30) {
              statusText.innerText = "CAPTURING CRYPTO NODE...";
            } else if (this.scanProgress < 70) {
              statusText.innerText = "DECRYPTING POLYNOMIAL PATH...";
            } else {
              statusText.innerText = "VERIFYING MATRIX ROOT...";
            }
          }
        } catch (innerErr) {
          console.error("Scan interval tick failed:", innerErr);
          clearInterval(this.scanInterval);
          this.scanInterval = null;
          this.completeBiometricScan(); // fallback to complete immediately
        }
      }, intervalTime);
    } catch (err) {
      console.error("Failed to start biometric scan:", err);
      this.completeBiometricScan(); // fallback to complete immediately
    }
  }

  completeBiometricScan() {
    try {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      this.isScanning = false;
      const viewport = document.getElementById('login-scanner-viewport');
      const statusText = document.getElementById('login-scan-status-label');
      const scanBtn = document.getElementById('trigger-login-scan-btn');
      const progressEl = document.getElementById('login-scan-progress-bar');
      
      if (viewport) viewport.classList.remove('scanning');
      if (scanBtn) scanBtn.disabled = false;
      if (progressEl) progressEl.style.width = '100%';

      if (this.selectedRole === 'admin' || this.selectedRole === 'agent') {
        // Admin/Agent login prompts secure OTP pad
        if (statusText) {
          statusText.innerText = "BIOMETRICS OK. SECURITY PASSCODE DISPATCHED.";
          statusText.style.color = "";
        }
        if (window.ShieldEvents) {
          try {
            window.ShieldEvents.emit('voiceSpeak', "Biometrics verified. Access challenge code dispatched. Enter passcode.");
          } catch (audioErr) {
            console.warn("Audio failed during scan completion:", audioErr);
          }
        }
        
        // Toggle views inside Login card (hide scanner, show OTP verification view)
        const scanGroup = document.getElementById('login-scanner-viewport-group');
        const otpGroup = document.getElementById('login-otp-verification-group');
        const demoCard = document.getElementById('demo-credentials-info-card');
        
        if (scanGroup) scanGroup.style.display = 'none';
        if (demoCard) demoCard.style.display = 'none';
        if (otpGroup) otpGroup.style.display = 'flex';
        
        // Generate OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        this.loginOtp = otpCode;
        
        const promptEl = document.getElementById('login-otp-hint');
        if (promptEl) {
          promptEl.innerHTML = `Dispatched verification challenge: <span>${otpCode}</span>`;
        }
        
        const codeInputs = document.querySelectorAll('.login-otp-digit');
        if (codeInputs && codeInputs.length > 0) {
          codeInputs.forEach(c => c.value = '');
          codeInputs[0].focus();
          
          // OTP input routing
          codeInputs.forEach((inp, idx) => {
            inp.addEventListener('keyup', (e) => {
              if (e.key >= 0 && e.key <= 9) {
                if (idx < codeInputs.length - 1) {
                  codeInputs[idx + 1].focus();
                }
              } else if (e.key === 'Backspace' && idx > 0) {
                codeInputs[idx - 1].focus();
              }
            });
          });
        }
        
      } else {
        // Citizen login directly grants access
        if (statusText) {
          statusText.innerText = "ACCESS GRANTED. REDIRECTING...";
          statusText.style.color = "#00e676";
        }
        if (window.ShieldEvents) {
          try {
            window.ShieldEvents.emit('voiceSpeak', "Identity validated. Welcome to Citizen privacy portal.");
          } catch (audioErr) {
            console.warn("Audio failed during citizen access grant:", audioErr);
          }
        }
        
        setTimeout(() => {
          this.grantAccess('citizen');
        }, 1200);
      }
    } catch (err) {
      console.error("Error completing biometric scan:", err);
      this.grantAccess(this.selectedRole); // absolute fallback
    }
  }

  verifyLoginOTP() {
    const codeInputs = document.querySelectorAll('.login-otp-digit');
    let code = "";
    codeInputs.forEach(inp => code += inp.value);

    if (code === this.loginOtp) {
      const statusText = document.getElementById('login-scan-status-label');
      if (statusText) {
        statusText.innerText = "AUTHORIZATION COMPLETED.";
        statusText.style.color = "#00e676";
      }
      const roleText = this.selectedRole === 'admin' ? "Administrator" : "Security Operator";
      if (window.ShieldEvents) {
        try {
          window.ShieldEvents.emit('voiceSpeak', `Welcome back, ${roleText}. Access clearance level verified.`);
        } catch (audioErr) {
          console.warn("Audio speech failed during OTP success:", audioErr);
        }
      }
      
      setTimeout(() => {
        this.grantAccess(this.selectedRole);
      }, 1000);
    } else {
      const statusText = document.getElementById('login-scan-status-label');
      if (statusText) {
        statusText.innerText = "ACCESS DENIED: VERIFICATION CODE MISMATCH";
        statusText.style.color = "#ff3860";
      }
      if (window.ShieldEvents) {
        try {
          window.ShieldEvents.emit('voiceSpeak', "Verification code mismatch. Access challenge aborted.");
        } catch (audioErr) {
          console.warn("Audio speech failed during OTP mismatch:", audioErr);
        }
      }
      codeInputs.forEach(inp => inp.value = '');
      if (codeInputs[0]) codeInputs[0].focus();
    }
  }

  verifyManualCredentials() {
    const usernameEl = document.getElementById('manual-login-username');
    const passwordEl = document.getElementById('manual-login-password');
    const errorEl = document.getElementById('manual-login-error');
    
    if (!usernameEl || !passwordEl) return;
    
    const user = usernameEl.value.trim().toLowerCase();
    const pass = passwordEl.value.trim();
    
    let matchedRole = null;
    
    // Verify credentials
    if ((user === 'citizen' && pass === 'citizen123') || (user === 'officer' && pass === 'shield123')) {
      matchedRole = 'citizen';
    } else if ((user === 'agent' && pass === 'agent123') || (user === 'investigator' && pass === 'shield456') || (user === 'agent' && pass === 'shield456')) {
      matchedRole = 'agent';
    } else if ((user === 'admin' && pass === 'admin123') || (user === 'architect' && pass === 'shield789') || (user === 'admin' && pass === 'shield789')) {
      matchedRole = 'admin';
    }
    
    if (matchedRole) {
      if (errorEl) errorEl.style.display = 'none';
      if (window.ShieldAudio) window.ShieldAudio.playSuccess();
      
      // Stop camera to turn off user's webcam light immediately
      this.stopWebcam();

      if (window.ShieldEvents) {
        let roleLabel = "Citizen Privacy Registry";
        if (matchedRole === 'agent') roleLabel = "Security Surveillance Grid";
        if (matchedRole === 'admin') roleLabel = "Neural Command Console";
        
        try {
          window.ShieldEvents.emit('voiceSpeak', `Credentials authenticated successfully. Opening ${roleLabel}.`);
        } catch (audioErr) {
          console.warn("Audio speech failed during credentials verification:", audioErr);
        }
      }
      
      // Perform access grant
      this.grantAccess(matchedRole);
      
      // Clear fields
      usernameEl.value = '';
      passwordEl.value = '';
    } else {
      if (errorEl) errorEl.style.display = 'block';
      if (window.ShieldEvents) {
        try {
          window.ShieldEvents.emit('voiceSpeak', "Access credentials mismatch. Decryption aborted.");
        } catch (audioErr) {
          console.warn("Audio speech failed during invalid credentials alarm:", audioErr);
        }
      }
    }
  }

  grantAccess(role) {
    // Stop camera immediately to turn off the user's webcam light
    this.stopWebcam();

    // Trigger Holographic success popup verification check
    const successPopup = document.getElementById('identity-verified-popup');
    const roleBadge = document.getElementById('verified-role-badge');
    const keyBadge = document.getElementById('verified-key-badge');
    
    if (successPopup) {
      if (roleBadge) roleBadge.innerText = role.toUpperCase();
      if (keyBadge) {
        // Generate mock key signature based on role
        const keyMap = {
          citizen: '0x8F9A-CIVIL-NODE',
          agent: '0x4C8B-AGENT-CLEAR',
          admin: '0x9E2D-ROOT-ADMIN'
        };
        keyBadge.innerText = keyMap[role] || '0x0000-SECURE-NODE';
      }
      
      // Show holographic popup overlay
      successPopup.classList.add('active');
      
      if (window.ShieldAudio) window.ShieldAudio.playSuccess();

      // Hold for 1.8 seconds, then route
      setTimeout(() => {
        successPopup.classList.remove('active');
        
        // Hide login screen overlay
        const overlay = document.getElementById('login-fullscreen-portal');
        if (overlay) overlay.classList.add('hidden');
        
        // Set state
        window.ShieldState.userRole = role;
        
        // Broadcast event
        if (window.ShieldEvents) {
          try {
            window.ShieldEvents.emit('loginSuccess', role);
          } catch (err) {
            console.error("Error emitting loginSuccess:", err);
          }
        }

        // Apply role view blocks
        this.applyRolePermissions(role);
      }, 1800);
    } else {
      // Fallback
      const overlay = document.getElementById('login-fullscreen-portal');
      if (overlay) overlay.classList.add('hidden');
      window.ShieldState.userRole = role;
      if (window.ShieldEvents) window.ShieldEvents.emit('loginSuccess', role);
      this.applyRolePermissions(role);
    }
  }

  applyRolePermissions(role) {
    const lockMonitor = document.getElementById('monitor-view-lock');
    const lockThreat = document.getElementById('threat-view-lock');
    const lockAdmin = document.getElementById('admin-view-lock');
    const lockTactical = document.getElementById('tactical-view-lock');
    const lockAnalytics = document.getElementById('analytics-view-lock');
    
    const monitorBtn = document.querySelector('.hud-nav-item[data-view="monitor"]');
    const threatBtn = document.querySelector('.hud-nav-item[data-view="threat"]');
    const adminBtn = document.querySelector('.hud-nav-item[data-view="admin"]');
    const tacticalBtn = document.querySelector('.hud-nav-item[data-view="tactical"]');
    const analyticsBtn = document.querySelector('.hud-nav-item[data-view="analytics"]');

    // Reset lock overlays
    if (lockMonitor) lockMonitor.style.display = 'none';
    if (lockThreat) lockThreat.style.display = 'none';
    if (lockAdmin) lockAdmin.style.display = 'none';
    if (lockTactical) lockTactical.style.display = 'none';
    if (lockAnalytics) lockAnalytics.style.display = 'none';
    
    if (monitorBtn) monitorBtn.classList.remove('restricted-tab');
    if (threatBtn) threatBtn.classList.remove('restricted-tab');
    if (adminBtn) adminBtn.classList.remove('restricted-tab');
    if (tacticalBtn) tacticalBtn.classList.remove('restricted-tab');
    if (analyticsBtn) analyticsBtn.classList.remove('restricted-tab');

    if (role === 'citizen') {
      // Lock restricted decks
      if (lockMonitor) lockMonitor.style.display = 'flex';
      if (lockThreat) lockThreat.style.display = 'flex';
      if (lockAdmin) lockAdmin.style.display = 'flex';
      if (lockTactical) lockTactical.style.display = 'flex';
      if (lockAnalytics) lockAnalytics.style.display = 'flex';
      
      if (monitorBtn) monitorBtn.classList.add('restricted-tab');
      if (threatBtn) threatBtn.classList.add('restricted-tab');
      if (adminBtn) adminBtn.classList.add('restricted-tab');
      if (tacticalBtn) tacticalBtn.classList.add('restricted-tab');
      if (analyticsBtn) analyticsBtn.classList.add('restricted-tab');
      
      // Auto redirect to privacy view
      window.navigateToView('privacy');
    } else if (role === 'agent') {
      // Lock admin deck, unlock cctv feeds, threat center, tactical, analytics
      if (lockAdmin) lockAdmin.style.display = 'flex';
      if (adminBtn) adminBtn.classList.add('restricted-tab');
      
      window.navigateToView('home');
    } else {
      // Admin gets full unlock
      window.navigateToView('home');
    }
  }

  logout() {
    const overlay = document.getElementById('login-fullscreen-portal');
    if (overlay) overlay.classList.remove('hidden');

    // Reset Gateway view to Bio
    const bioTab = document.getElementById('login-mode-btn-bio');
    const manualTab = document.getElementById('login-mode-btn-manual');
    if (bioTab) bioTab.classList.add('active');
    if (manualTab) manualTab.classList.remove('active');
    
    const scanGroup = document.getElementById('login-scanner-viewport-group');
    const manualGroup = document.getElementById('login-manual-credentials-group');
    const otpGroup = document.getElementById('login-otp-verification-group');
    
    if (scanGroup) scanGroup.style.display = 'flex';
    if (manualGroup) manualGroup.style.display = 'none';
    if (otpGroup) otpGroup.style.display = 'none';
    
    const demoCard = document.getElementById('demo-credentials-info-card');
    if (demoCard) demoCard.style.display = 'block';

    const statusText = document.getElementById('login-scan-status-label');
    if (statusText) {
      statusText.innerText = "AWAITING FACE ID SCAN";
      statusText.style.color = "";
    }

    this.switchBiometricType(this.selectedRole === 'admin' ? 'fingerprint' : 'face');
  }

  // Draw Canvas biometric scanner indicators
  drawScanner() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    
    // Concrete Colors map to resolve CSS custom property limitations in HTML5 Canvas
    const neonCyan = "#00f2fe";
    const neonRed = "#ff3860";
    const neonBlue = "#4facfe";
    const neonPurple = "#b10dc9";
    const neonGreen = "#00e676";
    
    ctx.clearRect(0, 0, this.width, this.height);
    
    this.animTick++;
    const cx = this.width / 2;
    const cy = this.height / 2;

    const hasVideo = this.webcamStream && this.video && this.video.readyState >= 2;

    // Draw video background if webcam stream is active
    if (hasVideo && (this.selectedBio === 'face' || this.selectedBio === 'retina')) {
      ctx.save();
      // Horizontally mirror video stream for natural feel
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, this.width, this.height);
      ctx.restore();

      // Cyber green/cyan color grading tint over video
      ctx.fillStyle = this.isScanning ? 'rgba(255, 56, 96, 0.08)' : 'rgba(0, 242, 254, 0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // Solid cyber grid background fallback/fingerprint
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < this.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
    }

    if (this.selectedBio === 'retina') {
      // Webcam Eye contour fallback when stream is inactive
      if (!hasVideo) {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Leaf eye outline
        ctx.moveTo(cx - 45, cy);
        ctx.quadraticCurveTo(cx, cy - 25, cx + 45, cy);
        ctx.quadraticCurveTo(cx, cy + 25, cx - 45, cy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating holographic retina scope
      ctx.strokeStyle = this.isScanning ? neonRed : neonCyan;
      ctx.lineWidth = 1;
      
      // Outer reticle scope
      ctx.shadowBlur = this.isScanning ? 8 : 4;
      ctx.shadowColor = this.isScanning ? neonRed : neonCyan;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner reticle scope
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating dashed tracks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.animTick * 0.015);
      ctx.strokeStyle = this.isScanning ? 'rgba(255, 56, 96, 0.4)' : 'rgba(0, 242, 254, 0.4)';
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-this.animTick * 0.025);
      ctx.strokeStyle = this.isScanning ? 'rgba(255, 56, 96, 0.6)' : 'rgba(0, 242, 254, 0.6)';
      ctx.setLineDash([20, 10, 5, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Sweeping scanning line wedge
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.animTick * 0.035);
      ctx.strokeStyle = this.isScanning ? 'rgba(255, 56, 96, 0.4)' : 'rgba(0, 242, 254, 0.3)';
      ctx.fillStyle = this.isScanning ? 'rgba(255, 56, 96, 0.05)' : 'rgba(0, 242, 254, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0, 65, -0.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Horizontal and vertical crosshairs tickers
      ctx.strokeStyle = this.isScanning ? 'rgba(255, 56, 96, 0.5)' : 'rgba(0, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx - 75, cy); ctx.lineTo(cx - 45, cy);
      ctx.moveTo(cx + 45, cy); ctx.lineTo(cx + 75, cy);
      ctx.moveTo(cx, cy - 75); ctx.lineTo(cx, cy - 45);
      ctx.moveTo(cx, cy + 45); ctx.lineTo(cx, cy + 75);
      ctx.stroke();

      // Center iris targeting boxes
      ctx.strokeStyle = this.isScanning ? neonRed : neonBlue;
      ctx.beginPath();
      ctx.rect(cx - 8, cy - 8, 16, 16);
      ctx.stroke();

      // Eye center target dot
      ctx.fillStyle = this.isScanning ? neonRed : neonCyan;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // On-canvas data logs
      ctx.font = '7px monospace';
      ctx.fillStyle = this.isScanning ? neonRed : neonCyan;
      ctx.fillText("IRIS DECRYPTOR ACTIVE", cx - 60, cy - 80);
      ctx.fillText(`VECTOR_LOCK: ${this.isScanning ? 'SECURED' : 'ACQUIRING'}`, cx - 60, cy + 85);

    } else if (this.selectedBio === 'fingerprint') {
      // Draw fingerprint loop ripples
      ctx.strokeStyle = this.isScanning ? neonRed : neonBlue;
      ctx.lineWidth = 1.8;

      ctx.save();
      ctx.shadowBlur = this.isScanning ? 10 : 5;
      ctx.shadowColor = this.isScanning ? neonRed : neonBlue;
      
      for (let r = 12; r < 60; r += 12) {
        ctx.beginPath();
        // Wavy loops
        ctx.arc(cx, cy + r/4, r, 0.15 - Math.sin(this.animTick * 0.04)*0.08, Math.PI - 0.15 + Math.sin(this.animTick * 0.04)*0.08, true);
        ctx.stroke();
      }
      ctx.restore();

      // Scanning viewport container bounds
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx - 45, cy - 50, 90, 100);
      ctx.stroke();

      // Text readouts
      ctx.font = '7px monospace';
      ctx.fillStyle = this.isScanning ? neonRed : neonBlue;
      ctx.fillText("FINGERPRINT SCANNER V2.4", cx - 40, cy - 60);
      ctx.fillText(`STATUS: ${this.isScanning ? 'DECRYPTING...' : 'READY'}`, cx - 40, cy + 65);
      
      // Horizontal laser sweep bar
      const laserY = cy - 50 + ((Math.sin(this.animTick * 0.05) + 1) / 2) * 100;
      ctx.strokeStyle = this.isScanning ? neonRed : neonBlue;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.isScanning ? neonRed : neonBlue;
      ctx.beginPath();
      ctx.moveTo(cx - 50, laserY);
      ctx.lineTo(cx + 50, laserY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

    } else {
      // Face ID mode
      
      // Falling back outline silhouette when stream is inactive
      if (!hasVideo) {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 42, 0, Math.PI, false); // chin
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cx - 18, cy - 20, 9, 0, Math.PI * 2); // left eye
        ctx.arc(cx + 18, cy - 20, 9, 0, Math.PI * 2); // right eye
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx - 8, cy + 8);
        ctx.lineTo(cx, cy + 8); // nose
        ctx.stroke();
      }

      // AI Bounding Box corner brackets
      ctx.strokeStyle = this.isScanning ? neonRed : neonCyan;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = this.isScanning ? 8 : 4;
      ctx.shadowColor = this.isScanning ? neonRed : neonCyan;
      
      const boxW = 120;
      const boxH = 130;
      const bx = cx - boxW / 2;
      const by = cy - boxH / 2 - 5;
      const len = 15;

      // Top Left
      ctx.beginPath(); ctx.moveTo(bx, by + len); ctx.lineTo(bx, by); ctx.lineTo(bx + len, by); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(bx + boxW, by + len); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW - len, by); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(bx, by + boxH - len); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx + len, by + boxH); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(bx + boxW, by + boxH - len); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW - len, by + boxH); ctx.stroke();
      
      ctx.shadowBlur = 0;

      // Face mesh coordinate points (eyes, eyebrows, nose, mouth corners, jaw)
      const points = [
        {x: cx - 22, y: cy - 25}, // Left Eye
        {x: cx + 22, y: cy - 25}, // Right Eye
        {x: cx, y: cy - 10},     // Nose bridge
        {x: cx, y: cy + 5},      // Nose tip
        {x: cx - 12, y: cy + 20}, // Mouth Left
        {x: cx + 12, y: cy + 20}, // Mouth Right
        {x: cx, y: cy + 25},      // Chin top
        {x: cx - 40, y: cy - 10}, // Left Cheek outer
        {x: cx + 40, y: cy - 10}, // Right Cheek outer
        {x: cx - 35, y: cy + 15}, // Left Jaw
        {x: cx + 35, y: cy + 15}, // Right Jaw
        {x: cx, y: cy + 42},      // Chin point
        {x: cx - 18, y: cy - 40}, // Left eyebrow outer
        {x: cx - 5, y: cy - 38},  // Left eyebrow inner
        {x: cx + 5, y: cy - 38},  // Right eyebrow inner
        {x: cx + 18, y: cy - 40}  // Right eyebrow outer
      ];

      // Mesh links connections map
      const connections = [
        [0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6], [6, 11],
        [7, 0], [8, 1], [7, 9], [8, 10], [9, 11], [10, 11], [12, 13], [14, 15],
        [13, 0], [14, 1], [13, 2], [14, 2]
      ];

      // Add a realistic wiggling/jitter animation to the nodes to simulate mapping calculations
      const jitterMax = this.isScanning ? 1.5 : 0.6;
      const mappedPoints = points.map(p => {
        const jitterX = (Math.sin(this.animTick * 0.1 + p.x) * jitterMax);
        const jitterY = (Math.cos(this.animTick * 0.12 + p.y) * jitterMax);
        return { x: p.x + jitterX, y: p.y + jitterY };
      });

      // Draw wireframe connection links
      ctx.strokeStyle = this.isScanning ? 'rgba(255, 56, 96, 0.25)' : 'rgba(0, 242, 254, 0.25)';
      ctx.lineWidth = 0.8;
      connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(mappedPoints[start].x, mappedPoints[start].y);
        ctx.lineTo(mappedPoints[end].x, mappedPoints[end].y);
        ctx.stroke();
      });

      // Draw mesh nodes
      ctx.fillStyle = this.isScanning ? neonRed : neonCyan;
      mappedPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // High-tech overlay texts
      ctx.font = '8px monospace';
      ctx.fillStyle = this.isScanning ? neonRed : neonCyan;
      ctx.fillText("FACIAL MESH ACTIVE", bx + 5, by + 12);
      ctx.fillText(`LOCK: ${this.isScanning ? 'SECURED' : 'ACQUIRING'}`, bx + 5, by + 22);
      ctx.fillText(`ROLE: ${this.selectedRole.toUpperCase()}`, bx + 5, by + 32);

      // Bottom floating tags
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      ctx.fillText(`H-HASH: 0x8F9A${(this.animTick % 100).toString(16).toUpperCase()}`, bx + boxW - 65, by + boxH - 22);
      ctx.fillText("VERIFY: MULTI-SIG", bx + boxW - 65, by + boxH - 12);

      // Scanning vertical sweeping laser line
      let laserY;
      if (this.isScanning) {
        laserY = by + ((this.animTick * 3) % boxH);
      } else {
        laserY = by + ((Math.sin(this.animTick * 0.04) + 1) / 2) * boxH;
      }
      ctx.strokeStyle = this.isScanning ? neonRed : neonCyan;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.isScanning ? neonRed : neonCyan;
      ctx.beginPath();
      ctx.moveTo(bx - 5, laserY);
      ctx.lineTo(bx + boxW + 5, laserY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }

  startScannerAnimationLoop() {
    const loop = () => {
      this.drawScanner();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.loginPortal = new ShieldLoginPortal();
});
