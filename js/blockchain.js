/* Immutable Blockchain Auditing Module for ShadowShield AI */

class Block {
  constructor(index, timestamp, action, prevHash, validator = 'SECURE_NODE_01') {
    this.index = index;
    this.timestamp = timestamp;
    this.action = action;
    this.prevHash = prevHash;
    this.validator = validator;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    // Basic deterministic hash simulation
    const seed = this.index + this.timestamp + this.action + this.prevHash + this.validator;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(8, '0') + Math.random().toString(36).substr(2, 6);
  }
}

class BlockchainLedger {
  constructor() {
    this.chain = [];
    this.createGenesisBlock();
    this.updateMerkleRootUI();
    
    // Setup event hook
    window.ShieldEvents.on('logAuditBlock', (eventData) => {
      this.createNewBlock(eventData.action, eventData.validator);
    });
  }

  createGenesisBlock() {
    const genesis = new Block(0, new Date().toLocaleTimeString(), "GENESIS_NODE_INITIALIZED", "00000000000000000000000000000000", "SHIELD_SECURE_ROOT");
    this.chain.push(genesis);
  }

  createNewBlock(action, validator = 'VALIDATOR_OVERSIGHT_COUNCIL') {
    const prevBlock = this.chain[this.chain.length - 1];
    const newBlock = new Block(
      this.chain.length,
      new Date().toLocaleTimeString(),
      action,
      prevBlock.hash,
      validator
    );
    this.chain.push(newBlock);
    
    // Trigger validator animation
    if (window.blockchainMap) {
      window.blockchainMap.triggerNetworkPulse();
    }
    
    // Refresh ledger lists
    this.renderLedger();
    
    // Push system log
    window.ShieldEvents.emit('newSystemLog', {
      time: new Date().toLocaleTimeString(),
      type: 'success',
      msg: `BLOCKCHAIN: Logged block #${newBlock.index} successfully [Hash: ${newBlock.hash.substring(0, 10)}...]`
    });

    // Update block metric total count
    const blkCount = document.getElementById('ledger-total-blocks-val');
    if (blkCount) {
      blkCount.innerText = this.chain.length;
    }

    this.updateMerkleRootUI();
  }

  calculateMerkleRoot() {
    if (this.chain.length === 0) return "0x00000000000000000000000000000000";
    let hashCombo = this.chain.map(b => b.hash).join("");
    let hash = 0;
    for (let i = 0; i < hashCombo.length; i++) {
      const char = hashCombo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padEnd(20, 'a').substring(0, 24);
  }

  updateMerkleRootUI() {
    const rootEl = document.getElementById('ledger-merkle-root');
    if (rootEl) {
      rootEl.innerText = this.calculateMerkleRoot();
    }
  }

  renderLedger(filteredChain = null) {
    const feed = document.getElementById('blocks-feed-viewport');
    if (!feed) return;
    
    feed.innerHTML = '';
    const list = filteredChain || [...this.chain].reverse();
    
    list.forEach(block => {
      const blockEl = document.createElement('div');
      blockEl.className = 'block-item';
      
      blockEl.innerHTML = `
        <div class="block-header-info">
          <span class="block-index">BLOCK #${block.index}</span>
          <span class="block-time">${block.timestamp}</span>
        </div>
        <div class="block-detail-row">
          <span class="block-detail-label">ACTION METADATA:</span>
          <span class="block-detail-value">${block.action}</span>
        </div>
        <div class="block-detail-row">
          <span class="block-detail-label">PREV HASH:</span>
          <span class="block-detail-value hash">${block.prevHash}</span>
        </div>
        <div class="block-detail-row">
          <span class="block-detail-label">BLOCK HASH:</span>
          <span class="block-detail-value hash">${block.hash}</span>
        </div>
        <div class="block-detail-row">
          <span class="block-detail-label">VALIDATOR SIG:</span>
          <span class="block-detail-value signature">${block.validator}</span>
        </div>
      `;
      feed.appendChild(blockEl);
    });
  }
}

// Canvas Validator Nodes Map
class ValidatorNetworkMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width = 680;
    this.height = this.canvas.height = 180;
    
    this.nodes = [];
    this.pulses = [];
    this.initNodes();
    this.startMapAnimation();
  }

  initNodes() {
    const nodeNames = ["Security Gateway", "Legal Oversight", "Citizen Board", "Admin Log", "Cryptographic Guard", "Local Cluster"];
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = 70;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.nodes.push({
        name: nodeNames[i],
        x: cx + radius * Math.cos(angle) * 2.5,
        y: cy + radius * Math.sin(angle) * 0.8,
        pulseWeight: 0,
        active: true
      });
    }
  }

  triggerNetworkPulse() {
    // Seed new pulses flowing from nodes
    this.nodes.forEach((n, idx) => {
      n.pulseWeight = 1.0;
      // Add connection flow lines
      const nextNode = this.nodes[(idx + 1) % this.nodes.length];
      this.pulses.push({
        x: n.x,
        y: n.y,
        tx: nextNode.x,
        ty: nextNode.y,
        progress: 0
      });
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw interconnect cables / meshes
    ctx.strokeStyle = 'rgba(177, 13, 201, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
        ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
        ctx.stroke();
      }
    }

    // Draw active pulse flow lines
    this.pulses.forEach((p, index) => {
      p.progress += 0.03;
      if (p.progress >= 1.0) {
        this.pulses.splice(index, 1);
        return;
      }
      
      const cx = p.x + (p.tx - p.x) * p.progress;
      const cy = p.y + (p.ty - p.y) * p.progress;
      
      ctx.fillStyle = 'var(--neon-purple)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Nodes
    this.nodes.forEach(n => {
      ctx.shadowBlur = n.pulseWeight * 15;
      ctx.shadowColor = 'var(--neon-purple)';
      
      // Node core
      ctx.fillStyle = n.pulseWeight > 0.1 ? 'var(--neon-purple)' : 'rgba(177, 13, 201, 0.3)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0; // reset
      
      // Decay node flash pulse
      n.pulseWeight -= 0.02;
      if (n.pulseWeight < 0) n.pulseWeight = 0;
      
      // Node name label
      ctx.fillStyle = varColorText();
      ctx.font = '8px var(--font-hud)';
      ctx.fillText(n.name, n.x - 30, n.y - 14);
    });
  }

  startMapAnimation() {
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

function varColorText() {
  return window.ShieldState.activeView === 'audit' ? 'var(--text-secondary)' : '#8f9cae';
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  window.blockchainLedger = new BlockchainLedger();
  window.blockchainMap = new ValidatorNetworkMap('blockchain-network-canvas');
  
  // Render Ledger first time
  window.blockchainLedger.renderLedger();
  
  // Hook search bar
  const searchBar = document.getElementById('blockchain-search-input');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        window.blockchainLedger.renderLedger();
        return;
      }
      
      const filtered = window.blockchainLedger.chain.filter(blk => {
        return blk.action.toLowerCase().includes(q) || 
               blk.hash.toLowerCase().includes(q) || 
               blk.validator.toLowerCase().includes(q);
      });
      window.blockchainLedger.renderLedger([...filtered].reverse());
    });
  }
});
