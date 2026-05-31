/* Citizen Privacy Portal Logic for ShadowShield AI */

class CitizenPrivacyPortal {
  constructor() {
    this.privacyScore = 98;
    this.accessLogs = [
      { time: "04:22:15 PM", agency: "Admin Authority", request: "Decrypt CCTV Cam 01 Footage (Warrant bypass)", target: "CAM 01 central plaza", warrant: "VALIDATED OVERRIDE", status: "ALLOWED (UNMASKED)" },
      { time: "04:20:10 PM", agency: "Officer M. Vance", request: "Acknowledge Class-4 Threat Alert", target: "SECTOR 7 METRO B", warrant: "VALID", status: "ALERT OVERRIDDEN" },
      { time: "01:05:12 PM", agency: "Officer A. Carter", request: "Query CCTV Cam 03 Feed", target: "CAM 03 metro station", warrant: "VALID", status: "ALLOWED (MASKED)" },
      { time: "11:48:30 AM", agency: "Federal Intel Bureau", request: "Fetch Biometric Face Database Registry", target: "DATABASE SECURE", warrant: "REJECTED", status: "INTERCEPTED - BLOCKED" }
    ];

    this.initToggles();
    this.initPrivacyWallet();
    this.calculateScore();
    this.renderAccessLogs();
  }

  initToggles() {
    const warrantToggle = document.getElementById('toggle-warrant-req');
    const analyticsToggle = document.getElementById('toggle-analytics-opt');
    const anonLevelSelect = document.getElementById('select-anon-level');

    if (warrantToggle) {
      warrantToggle.checked = window.ShieldState.warrantRequired;
      warrantToggle.addEventListener('change', (e) => {
        window.ShieldState.warrantRequired = e.target.checked;
        this.calculateScore();
        
        // Dynamic voice speak
        window.ShieldEvents.emit('voiceSpeak', e.target.checked 
          ? "Warrant protocol enforcement enabled. Digital authorizations required for face unmasks." 
          : "Warning. Warrant protocol disabled. Security unblurs bypassed.");

        // Log action to blockchain
        const logMsg = `Citizen Security Rule Alteration: Warrant requirement set to ${e.target.checked ? 'ENABLED' : 'DISABLED'}`;
        window.ShieldEvents.emit('logAuditBlock', {
          action: logMsg,
          validator: "CITIZEN_KEY_PAIR_AUTH"
        });

        this.addMockAccessLog(
          e.target.checked ? "SYSTEM COMPLIANCE UPDATE" : "SECURITY THREAT ELEVATION",
          `Warrant check set to ${e.target.checked ? 'MANDATORY' : 'BYPASSED'}`,
          "USER_SETTING",
          "VALID",
          "RULE_UPDATED"
        );
      });
    }

    if (analyticsToggle) {
      analyticsToggle.checked = !window.ShieldState.behavioralOptOut; // standard check
      analyticsToggle.addEventListener('change', (e) => {
        window.ShieldState.behavioralOptOut = !e.target.checked;
        this.calculateScore();
        
        // Dynamic voice speak
        window.ShieldEvents.emit('voiceSpeak', e.target.checked 
          ? "Behavioral analytics allowed. Local crowd density tracking active." 
          : "Behavioral tracking shield engaged. Anonymizing local crowd coordinates.");

        const logMsg = `Citizen Opt-out Policy: Behavioral Analytics is now ${e.target.checked ? 'ALLOWED' : 'BLOCKED'}`;
        window.ShieldEvents.emit('logAuditBlock', {
          action: logMsg,
          validator: "CITIZEN_KEY_PAIR_AUTH"
        });
      });
    }

    if (anonLevelSelect) {
      anonLevelSelect.value = window.ShieldState.anonymityLevel;
      anonLevelSelect.addEventListener('change', (e) => {
        window.ShieldState.anonymityLevel = e.target.value;
        this.calculateScore();
        
        // Dynamic voice speak
        window.ShieldEvents.emit('voiceSpeak', `Privacy mask strength configured to ${e.target.value.toLowerCase()} filter.`);

        const logMsg = `Anonymization Matrix Strength adjusted to: ${e.target.value}`;
        window.ShieldEvents.emit('logAuditBlock', {
          action: logMsg,
          validator: "CRYPTOGRAPHIC_ORACLE"
        });
      });
    }
  }

  calculateScore() {
    let score = 100;
    
    // Deduct points based on selected security configurations
    if (!window.ShieldState.warrantRequired) {
      score -= 25;
    }
    
    if (window.ShieldState.anonymityLevel === 'STANDARD') {
      score -= 15;
    } else if (window.ShieldState.anonymityLevel === 'STRICT') {
      score += 0; // standard maximum
    }

    if (!window.ShieldState.behavioralOptOut) {
      score -= 10;
    }

    // Adjust score based on active Privacy Wallet permission statuses
    const transitBtn = document.getElementById('wallet-btn-transit');
    const telemetryBtn = document.getElementById('wallet-btn-telemetry');
    const metadataBtn = document.getElementById('wallet-btn-metadata');

    if (transitBtn && transitBtn.innerText === 'REVOKED') score += 5;
    if (telemetryBtn && telemetryBtn.innerText === 'REVOKED') score += 5;
    if (metadataBtn && metadataBtn.innerText === 'REVOKED') score += 5;

    this.privacyScore = Math.max(0, Math.min(100, score));
    this.updateScoreUI();
  }

  initPrivacyWallet() {
    const transitBtn = document.getElementById('wallet-btn-transit');
    const telemetryBtn = document.getElementById('wallet-btn-telemetry');
    const metadataBtn = document.getElementById('wallet-btn-metadata');
    const revokeAllBtn = document.getElementById('wallet-btn-revoke-all');

    const toggleBtn = (btn, name) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        const isActive = btn.innerText === 'ACTIVE';
        if (isActive) {
          btn.innerText = 'REVOKED';
          btn.style.borderColor = 'var(--neon-red)';
          btn.style.color = 'var(--neon-red)';
          
          window.ShieldEvents.emit('voiceSpeak', `${name} registry revoked successfully on ZK wallet.`);
          window.ShieldEvents.emit('logAuditBlock', {
            action: `ZK_WALLET PRIVACY REVOCATION: Blocked municipal access to registry ${name}`,
            validator: "ZK_SNARKS_ORACLE"
          });
          
          this.addMockAccessLog(
            "ZK_PRIVACY_WALLET",
            `Revoked access signature for ${name}`,
            "MUNICIPAL_WALLET",
            "ZK_PROOF_VERIFIED",
            "REGISTRY_LOCKED"
          );
        } else {
          btn.innerText = 'ACTIVE';
          btn.style.borderColor = 'var(--neon-green)';
          btn.style.color = 'var(--neon-green)';
          
          window.ShieldEvents.emit('voiceSpeak', `${name} registry re-authorized on ZK wallet.`);
          window.ShieldEvents.emit('logAuditBlock', {
            action: `ZK_WALLET PRIVACY GRANT: Allowed municipal access to registry ${name}`,
            validator: "ZK_SNARKS_ORACLE"
          });

          this.addMockAccessLog(
            "ZK_PRIVACY_WALLET",
            `Granted access signature for ${name}`,
            "MUNICIPAL_WALLET",
            "ZK_PROOF_VERIFIED",
            "REGISTRY_ACTIVE"
          );
        }
        this.calculateScore();
      });
    };

    toggleBtn(transitBtn, "Transit Signature");
    toggleBtn(telemetryBtn, "Bio Telemetry");
    toggleBtn(metadataBtn, "Quantum Metadata");

    if (revokeAllBtn) {
      revokeAllBtn.addEventListener('click', () => {
        let revokedAny = false;
        [transitBtn, telemetryBtn, metadataBtn].forEach(btn => {
          if (btn && btn.innerText === 'ACTIVE') {
            btn.click();
            revokedAny = true;
          }
        });
        if (revokedAny) {
          window.ShieldEvents.emit('voiceSpeak', "Emergency revocation engaged. All ZK registry channels blocked.");
        }
      });
    }
  }

  updateScoreUI() {
    const numEl = document.getElementById('privacy-score-num');
    const labelEl = document.getElementById('privacy-score-label-text');
    const radialEl = document.getElementById('privacy-score-radial-fill');

    if (!numEl || !radialEl) return;

    numEl.innerText = this.privacyScore;
    
    // Radial calculation: circumference is 502 (2 * PI * 80)
    const offset = 502 - (502 * this.privacyScore) / 100;
    radialEl.style.strokeDashoffset = offset;

    // Color code and label text
    if (this.privacyScore >= 80) {
      numEl.style.color = 'var(--neon-green)';
      radialEl.style.stroke = 'var(--neon-green)';
      radialEl.style.filter = 'drop-shadow(0 0 6px var(--neon-green))';
      labelEl.innerText = "EXCELLENT - MATRIX PROTECTED";
      labelEl.style.color = 'var(--neon-green)';
    } else if (this.privacyScore >= 50) {
      numEl.style.color = 'var(--neon-yellow)';
      radialEl.style.stroke = 'var(--neon-yellow)';
      radialEl.style.filter = 'drop-shadow(0 0 6px var(--neon-yellow))';
      labelEl.innerText = "WARNING - REDUCED ANONYMITY";
      labelEl.style.color = 'var(--neon-yellow)';
    } else {
      numEl.style.color = 'var(--neon-red)';
      radialEl.style.stroke = 'var(--neon-red)';
      radialEl.style.filter = 'drop-shadow(0 0 6px var(--neon-red))';
      labelEl.innerText = "CRITICAL - EXPOSED TO OVERWATCH";
      labelEl.style.color = 'var(--neon-red)';
    }
  }

  addMockAccessLog(agency, request, target, warrant, status) {
    const log = {
      time: new Date().toLocaleTimeString(),
      agency: agency,
      request: request,
      target: target,
      warrant: warrant,
      status: status
    };
    this.accessLogs.unshift(log);
    this.renderAccessLogs();
  }

  renderAccessLogs() {
    const tbody = document.getElementById('privacy-audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.accessLogs.forEach(log => {
      const row = document.createElement('tr');
      const warrantClass = log.warrant === 'VALID' ? 'valid' : 'missing';
      
      row.innerHTML = `
        <td>${log.time}</td>
        <td>${log.agency}</td>
        <td>${log.request}</td>
        <td>${log.target}</td>
        <td><span class="warrant-badge ${warrantClass}">${log.warrant}</span></td>
        <td style="font-family: var(--font-hud); font-size: 11px; font-weight: bold; color: ${log.status.includes('INTERCEPTED') ? 'var(--neon-red)' : 'var(--neon-green)'}">${log.status}</td>
      `;
      tbody.appendChild(row);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.citizenPortal = new CitizenPrivacyPortal();

  // Listen for warrant overrides from admin panel
  window.ShieldEvents.on('blockchainOverrideCreated', (data) => {
    window.citizenPortal.addMockAccessLog(
      data.user,
      data.purpose,
      data.target,
      "VALIDATED OVERRIDE",
      "ALLOWED (UNMASKED)"
    );
  });
});
