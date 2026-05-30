/* Admin Control Center and Authentication Modals for ShadowShield AI */

class AdminConsole {
  constructor() {
    this.otpCode = null;
    this.activeCamId = null;
    this.decryptPin = "";

    this.initAdminControls();
    this.initMetricUpdater();
    this.initModalHooks();
    this.initDecryptionKeypad();
    this.initAdminLockAuth();

    // Sync status indicators
    window.ShieldEvents.on('warrantOverrideToggled', (active) => {
      this.updateShieldStatusUI();
    });
    this.updateShieldStatusUI();
  }

  initAdminControls() {
    // Lockdown Switch
    const lockdownSw = document.getElementById('toggle-emergency-lockdown');
    if (lockdownSw) {
      lockdownSw.checked = window.ShieldState.lockdownEnabled;
      lockdownSw.addEventListener('change', (e) => {
        this.toggleLockdown(e.target.checked);
      });
    }

    // Force Global Anonymity Switch
    const forceAnonSw = document.getElementById('toggle-force-anonymity');
    if (forceAnonSw) {
      forceAnonSw.checked = window.ShieldState.globalAnonymity;
      forceAnonSw.addEventListener('change', (e) => {
        window.ShieldState.globalAnonymity = e.target.checked;
        
        // Dynamic voice speak
        window.ShieldEvents.emit('voiceSpeak', e.target.checked
          ? "Global Surveillance Privacy Shield engaged. Mirror privacy fully active."
          : "Global privacy shield deactivated. Local overrides enabled.");

        // Log to blockchain
        const logMsg = `Global Surveillance Privacy Shield set to: ${e.target.checked ? 'FORCED_ON' : 'DEACTIVATED'}`;
        window.ShieldEvents.emit('logAuditBlock', {
          action: logMsg,
          validator: "ADMIN_OVERWATCH_CONSOLE"
        });
      });
    }
  }

  toggleLockdown(enabled) {
    window.ShieldState.lockdownEnabled = enabled;
    window.ShieldState.systemStatus = enabled ? 'LOCKDOWN' : 'ACTIVE';
    
    // Broadcast lockdown change
    window.ShieldEvents.emit('lockdownToggled', enabled);

    const forceAnonSw = document.getElementById('toggle-force-anonymity');
    if (forceAnonSw) {
      if (enabled) {
        window.ShieldState.globalAnonymity = true;
        forceAnonSw.checked = true;
        forceAnonSw.disabled = true;
      } else {
        forceAnonSw.disabled = false;
      }
    }

    // Write to blockchain log
    window.ShieldEvents.emit('logAuditBlock', {
      action: enabled ? "CRITICAL EMERGENCY SYSTEM LOCKDOWN ACTIVE" : "LOCKDOWN OVERRIDE: SYSTEM RESTORED NORMAL",
      validator: "ADMIN_SECURE_AUTH"
    });

    // Write system log
    window.ShieldEvents.emit('newSystemLog', {
      time: new Date().toLocaleTimeString(),
      type: enabled ? 'critical' : 'success',
      msg: enabled ? "SYSTEM WARNING: EMERGENCY LOCKDOWN ACTIVATED" : "SYSTEM RESTORE: NORMAL WORK ENVIRONMENT RESET"
    });

    this.updateShieldStatusUI();
  }

  initMetricUpdater() {
    // Mock system metrics updater loop
    const cpuVal = document.getElementById('metric-cpu-load');
    const tempVal = document.getElementById('metric-cpu-temp');
    const hashVal = document.getElementById('metric-hashrate');
    
    setInterval(() => {
      if (cpuVal) {
        const randCpu = (Math.random() * 12 + 25).toFixed(1);
        cpuVal.innerText = `${randCpu}%`;
      }
      if (tempVal) {
        const randTemp = (Math.random() * 3 + 41.5).toFixed(1);
        tempVal.innerText = `${randTemp}°C`;
      }
      if (hashVal) {
        const randHash = (Math.random() * 5 + 142).toFixed(1);
        hashVal.innerText = `${randHash} TH/s`;
      }
    }, 2000);
  }

  initModalHooks() {
    // Warrant Bypass button on Cam 01
    const bypassBtn = document.getElementById('override-btn-01');
    if (bypassBtn) {
      bypassBtn.addEventListener('click', () => {
        if (window.ShieldState.activeWarrantOverride) {
          // Relock face mask
          window.ShieldState.activeWarrantOverride = false;
          window.ShieldEvents.emit('warrantOverrideToggled', false);
          
          window.ShieldEvents.emit('newSystemLog', {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            msg: "ADMIN: Security unblur warrant window closed. Face shields restored on CAM 01."
          });
          return;
        }
        
        // Open Decryption Modal
        this.openDecryptionModal('CAM 01');
      });
    }

    // OTP Input Boxes behavior (automatic tab to next digit)
    const inputs = document.querySelectorAll('#otp-modal .otp-digit-field');
    inputs.forEach((input, index) => {
      input.addEventListener('keyup', (e) => {
        if (e.key >= 0 && e.key <= 9) {
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          } else {
            this.verifyOTP();
          }
        } else if (e.key === 'Backspace' && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    // Close Modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });
  }

  openBiometricsModal(camName) {
    if (window.ShieldState.lockdownEnabled) {
      alert("ACCESS DENIED: Core shields are under emergency lockdown. Warrant bypass disabled.");
      return;
    }
    this.activeCamId = camName;
    const modal = document.getElementById('biometric-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Run scanning simulation animations
    const scanner = document.getElementById('bio-scanner-container');
    const scanStatus = document.getElementById('bio-scan-status-text');
    
    if (scanner && scanStatus) {
      scanner.className = "bio-scanner-box scanning";
      scanStatus.innerText = "Scanning fingerprint scanner matrix...";

      setTimeout(() => {
        scanStatus.innerText = "Analyzing biometric grid matches...";
        
        setTimeout(() => {
          scanner.className = "bio-scanner-box success";
          scanStatus.innerText = "Biometrics Verified. Code sent to admin device.";
          
          // Move to Step 2: Show OTP modal
          setTimeout(() => {
            this.openOTPModal();
          }, 1200);

        }, 1500);

      }, 1500);
    }
  }

  openOTPModal() {
    this.closeAllModals();
    const modal = document.getElementById('otp-modal');
    if (!modal) return;

    modal.classList.add('active');
    
    // Generate a random 4-digit code
    this.otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const codeHint = document.getElementById('otp-code-hint');
    if (codeHint) {
      codeHint.innerText = this.otpCode;
    }

    // Reset inputs
    const inputs = document.querySelectorAll('#otp-modal .otp-digit-field');
    inputs.forEach(inp => {
      inp.value = '';
    });
    inputs[0].focus();
  }

  verifyOTP() {
    const inputs = document.querySelectorAll('#otp-modal .otp-digit-field');
    let entered = "";
    inputs.forEach(inp => entered += inp.value);

    if (entered === this.otpCode) {
      // Success! Grant override unblur access
      this.closeAllModals();
      
      window.ShieldState.activeWarrantOverride = true;
      window.ShieldEvents.emit('warrantOverrideToggled', true);

      // Log into blockchain
      window.ShieldEvents.emit('logAuditBlock', {
        action: `AUTHORIZED DE-ANONYMOUS BYPASS ON ${this.activeCamId}`,
        validator: "OVERSIGHT_COUNCIL_MULTI_SIG"
      });

      // Audit list log creation
      window.ShieldEvents.emit('blockchainOverrideCreated', {
        admin: "Chief Officer Override",
        cam: this.activeCamId
      });

      // Show temporary warning ticker
      window.ShieldEvents.emit('newSystemLog', {
        time: new Date().toLocaleTimeString(),
        type: 'warning',
        msg: `ACCESS RECORDED: Authority override unmasked face shields on CAM 01 [Blockchain Logged]`
      });

      // Automatically relock after 15 seconds
      setTimeout(() => {
        if (window.ShieldState.activeWarrantOverride) {
          window.ShieldState.activeWarrantOverride = false;
          window.ShieldEvents.emit('warrantOverrideToggled', false);
          
          window.ShieldEvents.emit('newSystemLog', {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            msg: "ADMIN: Security unblur warrant window elapsed. Face shields restored on CAM 01."
          });
        }
      }, 15000);

    } else {
      // Failed! Focus back to first input
      alert("Invalid Security Passcode. Access Intercepted.");
      inputs.forEach(inp => inp.value = '');
      inputs[0].focus();
    }
  }

  updateShieldStatusUI() {
    const shieldStatusEl = document.getElementById('admin-shield-status');
    if (!shieldStatusEl) return;

    if (window.ShieldState.lockdownEnabled) {
      shieldStatusEl.className = "cyber-badge danger";
      shieldStatusEl.innerText = "EMERGENCY LOCKDOWN ENGAGED";
    } else if (window.ShieldState.activeWarrantOverride) {
      shieldStatusEl.className = "cyber-badge warning";
      shieldStatusEl.innerText = "SHIELD OVERRIDDEN (CAM 01)";
    } else {
      shieldStatusEl.className = "cyber-badge success";
      shieldStatusEl.innerText = "ALL CORE SHIELDS SECURED";
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  openDecryptionModal(camName) {
    if (window.ShieldState.lockdownEnabled) {
      alert("ACCESS DENIED: Core shields are under emergency lockdown. Warrant bypass disabled.");
      return;
    }
    this.activeCamId = camName;
    this.decryptPin = "";
    
    const modal = document.getElementById('decryption-modal');
    if (!modal) return;
    
    // Reset modal UI elements
    const pinDisplay = document.getElementById('decrypt-pin-display');
    const errMsg = document.getElementById('decrypt-error-message');
    const progGroup = document.getElementById('decrypt-progress-group');
    const progBar = document.getElementById('decrypt-progress-bar');
    
    if (pinDisplay) pinDisplay.innerText = "";
    if (errMsg) errMsg.style.display = "none";
    if (progGroup) progGroup.style.display = "none";
    if (progBar) progBar.style.width = "0%";
    
    modal.classList.add('active');
    
    if (window.ShieldEvents) {
      try {
        window.ShieldEvents.emit('voiceSpeak', "Decryption override sequence initialized. Enter security credentials.");
      } catch (err) {
        console.warn("Audio speech fail:", err);
      }
    }
  }

  initDecryptionKeypad() {
    const pinDisplay = document.getElementById('decrypt-pin-display');
    const errMsg = document.getElementById('decrypt-error-message');
    const progGroup = document.getElementById('decrypt-progress-group');
    const progBar = document.getElementById('decrypt-progress-bar');
    const progLabel = document.getElementById('decrypt-progress-label');
    const submitBtn = document.getElementById('decrypt-submit-btn');
    
    // Virtual Keypad click listeners
    document.querySelectorAll('#decryption-modal .keypad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = btn.getAttribute('data-val');
        if (window.ShieldAudio) window.ShieldAudio.playClick();
        if (errMsg) errMsg.style.display = "none";
        
        if (val === 'clear') {
          this.decryptPin = "";
        } else if (val === 'back') {
          this.decryptPin = this.decryptPin.slice(0, -1);
        } else {
          // Append digit up to a max of 8 characters
          if (this.decryptPin.length < 8) {
            this.decryptPin += val;
          }
        }
        
        if (pinDisplay) {
          // Display masked bullets
          pinDisplay.innerText = "•".repeat(this.decryptPin.length);
        }
      });
    });
    
    // Submit Verification Handler
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const selectClearance = document.getElementById('decrypt-clearance-select');
        if (!selectClearance) return;
        
        const role = selectClearance.value; // 'officer', 'agent', 'admin'
        
        // Define expected passcode mappings
        const pinMap = {
          officer: 'shield123',
          agent: 'shield456',
          admin: 'shield789'
        };
        
        const expectedPin = pinMap[role];
        
        if (this.decryptPin === expectedPin) {
          // Success! Hide error, show progress simulation
          if (errMsg) errMsg.style.display = "none";
          if (progGroup) progGroup.style.display = "flex";
          if (progBar) progBar.style.width = "0%";
          
          let progress = 0;
          submitBtn.disabled = true;
          
          const interval = setInterval(() => {
            progress += 10;
            if (progBar) progBar.style.width = `${progress}%`;
            
            if (progLabel) {
              if (progress <= 30) {
                progLabel.innerText = "DECRYPTING CORRELATION PIPELINE...";
              } else if (progress <= 70) {
                progLabel.innerText = "VERIFYING BLOCKCHAIN MULTI-SIG...";
              } else {
                progLabel.innerText = "GENERATING CRYPTOGRAPHIC KEY...";
              }
            }
            
            if (progress >= 100) {
              clearInterval(interval);
              submitBtn.disabled = false;
              
              // Grant access
              this.closeAllModals();
              
              window.ShieldState.activeWarrantOverride = true;
              window.ShieldEvents.emit('warrantOverrideToggled', true);
              
              if (window.ShieldAudio) window.ShieldAudio.playSuccess();
              
              // Log into blockchain validation
              window.ShieldEvents.emit('logAuditBlock', {
                action: `AUTHORIZED DE-ANONYMOUS BYPASS ON ${this.activeCamId} [Clearance: ${role.toUpperCase()}]`,
                validator: "OVERSIGHT_COUNCIL_MULTI_SIG"
              });
              
              // Audit list log creation
              window.ShieldEvents.emit('blockchainOverrideCreated', {
                admin: `${role.toUpperCase()} Overriding Anonymity`,
                cam: this.activeCamId
              });
              
              // Show temporary warning ticker
              window.ShieldEvents.emit('newSystemLog', {
                time: new Date().toLocaleTimeString(),
                type: 'warning',
                msg: `ACCESS RECORDED: ${role.toUpperCase()} override unmasked face shields on CAM 01 [Blockchain Logged]`
              });
              
              // Speech audio
              if (window.ShieldEvents) {
                try {
                  window.ShieldEvents.emit('voiceSpeak', "Warrant bypass authorized. Decrypting privacy shields on camera one. Access logged on chain.");
                } catch (vErr) {
                  console.warn("Speech failed inside decrypt success:", vErr);
                }
              }
              
              // Automatically relock after 15 seconds
              setTimeout(() => {
                if (window.ShieldState.activeWarrantOverride) {
                  window.ShieldState.activeWarrantOverride = false;
                  window.ShieldEvents.emit('warrantOverrideToggled', false);
                  
                  window.ShieldEvents.emit('newSystemLog', {
                    time: new Date().toLocaleTimeString(),
                    type: 'success',
                    msg: "ADMIN: Security unblur warrant window elapsed. Face shields restored on CAM 01."
                  });
                }
              }, 15000);
            }
          }, 150);
        } else {
          // Failure
          if (errMsg) errMsg.style.display = "block";
          if (window.ShieldAudio) window.ShieldAudio.playError();
          this.decryptPin = "";
          if (pinDisplay) pinDisplay.innerText = "";
          
          if (window.ShieldEvents) {
            try {
              window.ShieldEvents.emit('voiceSpeak', "Access credentials mismatch. Decryption aborted.");
            } catch (vErr) {
              console.warn("Speech failed inside decrypt fail:", vErr);
            }
          }
        }
      });
    }
  }

  initAdminLockAuth() {
    const adminLockUser = document.getElementById('admin-lock-username');
    const adminLockPass = document.getElementById('admin-lock-password');
    const adminLockBtn = document.getElementById('admin-lock-login-btn');
    const adminLockError = document.getElementById('admin-lock-error');
    
    if (adminLockBtn) {
      adminLockBtn.addEventListener('click', () => {
        if (!adminLockUser || !adminLockPass) return;
        const u = adminLockUser.value.trim().toLowerCase();
        const p = adminLockPass.value.trim();
        
        let matchedRole = null;
        if ((u === 'admin' && p === 'shield789') || (u === 'admin' && p === 'admin123') || (u === 'architect' && p === 'shield789')) {
          matchedRole = 'admin';
        } else if ((u === 'agent' && p === 'shield456') || (u === 'agent' && p === 'agent123') || (u === 'investigator' && p === 'shield456')) {
          matchedRole = 'agent';
        } else if ((u === 'officer' && p === 'shield123') || (u === 'citizen' && p === 'citizen123')) {
          matchedRole = 'citizen';
        }
        
        if (matchedRole) {
          if (adminLockError) adminLockError.style.display = 'none';
          
          // Sound Success
          if (window.ShieldAudio) window.ShieldAudio.playSuccess();
          
          // Log success to blockchain
          window.ShieldEvents.emit('logAuditBlock', {
            action: `ADMIN CLEARANCE ACCEPTED: Command shell console unlocked via local credentials [Clearance: ${matchedRole.toUpperCase()}]`,
            validator: "LOCAL_ROOT_ORACLE"
          });
          
          window.ShieldEvents.emit('newSystemLog', {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            msg: `ADMIN OVERRIDE: Local command authorization verified for role ${matchedRole.toUpperCase()}.`
          });
          
          if (window.ShieldEvents) {
            try {
              window.ShieldEvents.emit('voiceSpeak', "Command console clearance verified. Access authorized.");
            } catch (vErr) {
              console.warn("Speech failed inside admin local lock:", vErr);
            }
          }
          
          // Hide lock overlay
          const lockAdmin = document.getElementById('admin-view-lock');
          if (lockAdmin) lockAdmin.style.display = 'none';
          
          // Elevate user's global state role
          window.ShieldState.userRole = matchedRole;
          
          // Clear inputs
          adminLockUser.value = '';
          adminLockPass.value = '';
        } else {
          // Failure
          if (adminLockError) adminLockError.style.display = 'block';
          if (window.ShieldAudio) window.ShieldAudio.playError();
          if (window.ShieldEvents) {
            try {
              window.ShieldEvents.emit('voiceSpeak', "Access credentials mismatch. Decryption aborted.");
            } catch (vErr) {
              console.warn("Speech failed inside admin local lock failure:", vErr);
            }
          }
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminConsole = new AdminConsole();
});
