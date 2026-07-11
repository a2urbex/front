import * as THREE from 'three';

/**
 * Génère une texture de bruit pour le grain (asphalte, béton)
 */
const createNoiseCanvas = (width, height, opacity = 0.2) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        data[i] = val;
        data[i+1] = val;
        data[i+2] = val;
        data[i+3] = opacity * 255;
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
};

/**
 * Génère une texture de bâtiment style soviétique/brutaliste
 */
export const generateBuildingTexture = (index) => {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Fond (Béton/Brique)
    const baseHue = [0, 20, 200, 0][index % 4] || 0; // Gris, Brun, Bleu gris, Gris
    const baseSat = index % 2 === 0 ? 0 : 10;
    const baseLig = 30 + Math.random() * 20;
    
    ctx.fillStyle = `hsl(${baseHue}, ${baseSat}%, ${baseLig}%)`;
    ctx.fillRect(0, 0, width, height);

    // Ajout de bruit/saleté
    ctx.drawImage(createNoiseCanvas(width, height, 0.1), 0, 0);

    // 2. Structure des fenêtres
    const rows = 10 + Math.floor(Math.random() * 10);
    const cols = 4 + Math.floor(Math.random() * 4);
    
    const winW = (width / cols) * 0.6;
    const winH = (height / rows) * 0.6;
    const gapX = (width - (cols * winW)) / (cols + 1);
    const gapY = (height - (rows * winH)) / (rows + 1);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const posX = gapX + x * (winW + gapX);
            const posY = gapY + y * (winH + gapY);

            // Cadre de fenêtre
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(posX, posY, winW, winH);

            // Vitre (éteinte ou allumée)
            const isLit = Math.random() > 0.95; // Peu de lumières
            if (isLit) {
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(posX + 2, posY + 2, winW - 4, winH - 4);
            } else {
                ctx.fillStyle = '#050505';
                ctx.fillRect(posX + 2, posY + 2, winW - 4, winH - 4);
                
                // Reflet vitre
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.beginPath();
                ctx.moveTo(posX + 2, posY + winH - 2);
                ctx.lineTo(posX + winW - 2, posY + 2);
                ctx.lineTo(posX + winW - 2, posY + winH - 2);
                ctx.fill();
            }
        }
    }

    // 3. Coulures / Salissures verticales
    ctx.globalCompositeOperation = 'multiply';
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

/**
 * Génère une texture de bâtiment style "Plattenbau" (Panneaux de béton préfabriqués)
 */
export const generateSovietPanelTexture = () => {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fond béton sale
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(createNoiseCanvas(width, height, 0.15), 0, 0);

    // Grille de panneaux
    const rows = 16;
    const cols = 8;
    const panelW = width / cols;
    const panelH = height / rows;

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const px = x * panelW;
            const py = y * panelH;

            // Jointure des panneaux
            ctx.strokeRect(px, py, panelW, panelH);

            // Fenêtre au centre du panneau
            const winW = panelW * 0.5;
            const winH = panelH * 0.6;
            const wx = px + (panelW - winW) / 2;
            const wy = py + (panelH - winH) / 2;

            ctx.fillStyle = '#111111';
            ctx.fillRect(wx, wy, winW, winH);

            // Détails fenêtre (cadre blanc sale)
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.strokeRect(wx, wy, winW, winH);
            
            // Barre centrale fenêtre
            ctx.beginPath();
            ctx.moveTo(wx + winW/2, wy);
            ctx.lineTo(wx + winW/2, wy + winH);
            ctx.stroke();

            // Quelques fenêtres cassées ou condamnées
            if (Math.random() > 0.9) {
                ctx.fillStyle = '#2a2a2a'; // Planche
                ctx.fillRect(wx, wy, winW, winH);
            }
        }
    }

    // Coulures de rouille/crasse sous les fenêtres
    ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (Math.random() > 0.3) {
                const px = x * panelW + panelW/2;
                const py = y * panelH + panelH/2 + panelH*0.3;
                const grad = ctx.createLinearGradient(px, py, px, py + panelH);
                grad.addColorStop(0, 'rgba(50, 30, 20, 0.8)');
                grad.addColorStop(1, 'rgba(50, 30, 20, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px - 10, py, 20, panelH);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

/**
 * Génère une texture de bâtiment en briques sales
 */
export const generateSovietBrickTexture = () => {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fond brique rouge/brun terne
    ctx.fillStyle = '#5a3a30';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(createNoiseCanvas(width, height, 0.2), 0, 0);

    // Motif briques
    const brickH = 10;
    const brickW = 20;
    
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = 0; y < height; y += brickH) {
        const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
        for (let x = -brickW; x < width; x += brickW) {
            if (Math.random() > 0.1) {
                ctx.fillRect(x + offset, y, brickW - 2, brickH - 2);
            }
        }
    }

    // Fenêtres étroites
    const rows = 12;
    const cols = 6;
    const winW = 40;
    const winH = 60;
    const gapX = (width - (cols * winW)) / (cols + 1);
    const gapY = (height - (rows * winH)) / (rows + 1);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const wx = gapX + x * (winW + gapX);
            const wy = gapY + y * (winH + gapY);

            ctx.fillStyle = '#000000';
            ctx.fillRect(wx, wy, winW, winH);
            
            // Rebord fenêtre
            ctx.fillStyle = '#444444';
            ctx.fillRect(wx - 2, wy + winH, winW + 4, 5);
        }
    }

    // Salissures massives (bas des murs)
    const grad = ctx.createLinearGradient(0, height, 0, height - 300);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

/**
 * Génère une texture de mousse pour le sol
 */
export const generateMossTexture = () => {
    const width = 256;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fond transparent
    ctx.clearRect(0, 0, width, height);

    // Taches de mousse
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 10 + Math.random() * 30;
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${40 + Math.random()*40}, ${60 + Math.random()*40}, 30, 0.8)`);
        grad.addColorStop(0.5, `rgba(${30 + Math.random()*30}, ${50 + Math.random()*30}, 20, 0.4)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Bruit pour le détail
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(createNoiseCanvas(width, height, 0.3), 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

/**
 * Génère une texture de route asphaltée avec détails
 */
export const generateRoadTexture = () => {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Asphalte de base
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, width, height);

    // Bruit fort pour le grain
    ctx.drawImage(createNoiseCanvas(width, height, 0.15), 0, 0);

    // Fissures (lignes aléatoires)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10); // Répétition le long de la route
    return texture;
};

const overlayNoise = (ctx, width, height, opacity = 0.08) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(createNoiseCanvas(width, height, 1), 0, 0);
    ctx.restore();
};

const addDrips = (ctx, width, height, count = 20, color = 'rgba(10,8,6,') => {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const w = 3 + Math.random() * 14;
        const len = height * (0.2 + Math.random() * 0.7);
        const startY = Math.random() * height * 0.4;
        const grad = ctx.createLinearGradient(x, startY, x, startY + len);
        grad.addColorStop(0, color + (0.3 + Math.random() * 0.35) + ')');
        grad.addColorStop(1, color + '0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, startY, w, len);
    }
};

export const generateHospitalWallTexture = () => {
    const w = 512, h = 512;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const bc = document.createElement('canvas'); bc.width = w; bc.height = h;
    const bctx = bc.getContext('2d');

    const uppers = ['#cdccc0', '#c6cec4', '#c8cccd', '#d0cabf'];
    const dados = ['#6f847c', '#6d7b84', '#7c8a72', '#7f8f96'];
    const stripes = ['#9c3b44', '#3a6ea5', '#c8952a', '#4a8a6a'];
    const upper = uppers[Math.floor(Math.random() * uppers.length)];
    const dado = dados[Math.floor(Math.random() * dados.length)];
    const dadoTop = Math.floor(h * 0.62);

    bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, w, h);

    ctx.fillStyle = upper; ctx.fillRect(0, 0, w, dadoTop);
    ctx.fillStyle = dado; ctx.fillRect(0, dadoTop, w, h - dadoTop);

    ctx.fillStyle = stripes[Math.floor(Math.random() * stripes.length)];
    ctx.fillRect(0, dadoTop - 6, w, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, dadoTop, w, 2);

    let g = ctx.createLinearGradient(0, h, 0, h - 130);
    g.addColorStop(0, 'rgba(18,16,12,0.6)'); g.addColorStop(1, 'rgba(18,16,12,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    g = ctx.createLinearGradient(0, 0, 0, 90);
    g.addColorStop(0, 'rgba(25,22,16,0.4)'); g.addColorStop(1, 'rgba(25,22,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    addDrips(ctx, w, dadoTop, 9, 'rgba(60,45,25,');

    for (let i = 0; i < 11; i++) {
        const px = Math.random() * w, py = Math.random() * dadoTop;
        const pr = 22 + Math.random() * 55;
        ctx.beginPath();
        const pts = 9;
        for (let a = 0; a <= pts; a++) {
            const ang = (a / pts) * Math.PI * 2;
            const rr = pr * (0.55 + Math.random() * 0.55);
            const xx = px + Math.cos(ang) * rr, yy = py + Math.sin(ang) * rr;
            if (a === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(120,110,95,0.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(30,25,20,0.35)';
        ctx.lineWidth = 1.5; ctx.stroke();
        bctx.fillStyle = '#6a6a6a';
        bctx.beginPath(); bctx.arc(px, py, pr * 0.7, 0, Math.PI * 2); bctx.fill();
    }

    ctx.strokeStyle = 'rgba(20,20,20,0.22)';
    for (let i = 0; i < 14; i++) {
        ctx.lineWidth = 2 + Math.random() * 4;
        const yy = dadoTop + Math.random() * (h - dadoTop);
        const xx = Math.random() * w, len = 20 + Math.random() * 70;
        ctx.beginPath(); ctx.moveTo(xx, yy);
        ctx.lineTo(xx + len, yy + (Math.random() - 0.5) * 6); ctx.stroke();
    }

    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 6; i++) {
        const x = Math.random() * w, y = Math.random() * dadoTop, r = 30 + Math.random() * 70;
        const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
        gg.addColorStop(0, 'rgba(70,60,35,0.45)'); gg.addColorStop(1, 'rgba(70,60,35,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    overlayNoise(ctx, w, h, 0.04);
    overlayNoise(bctx, w, h, 0.08);

    const map = new THREE.CanvasTexture(c);
    const bump = new THREE.CanvasTexture(bc);
    [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    return { map, bump };
};

export const generateLinoleumTexture = () => {
    const w = 512, h = 512;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const bc = document.createElement('canvas'); bc.width = w; bc.height = h;
    const bctx = bc.getContext('2d');

    ctx.fillStyle = '#a9a89c'; ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#888'; bctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 9000; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const s = 0.6 + Math.random() * 1.6;
        const v = Math.random();
        ctx.fillStyle = v < 0.4 ? 'rgba(120,118,108,0.5)'
            : v < 0.7 ? 'rgba(150,148,138,0.5)'
            : v < 0.9 ? 'rgba(90,88,80,0.5)'
            : 'rgba(70,80,75,0.4)';
        ctx.fillRect(x, y, s, s);
    }

    const tile = 128;
    ctx.strokeStyle = 'rgba(40,40,38,0.5)'; ctx.lineWidth = 2;
    bctx.strokeStyle = '#3a3a3a'; bctx.lineWidth = 2;
    for (let x = 0; x <= w; x += tile) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, h); bctx.stroke();
    }
    for (let y = 0; y <= h; y += tile) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(w, y); bctx.stroke();
    }

    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 24; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = 25 + Math.random() * 80;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const wet = Math.random() > 0.5;
        g.addColorStop(0, wet ? 'rgba(25,25,22,0.5)' : 'rgba(60,55,45,0.35)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,20,18,0.3)';
    for (let i = 0; i < 10; i++) {
        ctx.lineWidth = 1 + Math.random() * 3;
        const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 60, a0 = Math.random() * 6;
        ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + 1 + Math.random() * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    overlayNoise(ctx, w, h, 0.05);

    const map = new THREE.CanvasTexture(c);
    const bump = new THREE.CanvasTexture(bc);
    [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    return { map, bump };
};

export const generateCeilingTileTexture = () => {
    const w = 512, h = 512;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const bc = document.createElement('canvas'); bc.width = w; bc.height = h;
    const bctx = bc.getContext('2d');

    const tiles = 4, ts = w / tiles;
    ctx.fillStyle = '#3a3a38'; ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#555'; bctx.fillRect(0, 0, w, h);

    for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
            const x = tx * ts, y = ty * ts, inset = 3;
            const base = 205 + Math.random() * 22;
            ctx.fillStyle = `rgb(${base},${base - 4},${base - 14})`;
            ctx.fillRect(x + inset, y + inset, ts - inset * 2, ts - inset * 2);

            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            for (let p = 0; p < 55; p++) {
                ctx.fillRect(x + inset + Math.random() * (ts - 6), y + inset + Math.random() * (ts - 6), 1, 1);
            }
            if (Math.random() > 0.7) {
                const sx = x + ts * (0.3 + Math.random() * 0.4), sy = y + ts * (0.3 + Math.random() * 0.4);
                const r = ts * (0.2 + Math.random() * 0.3);
                const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                g.addColorStop(0, 'rgba(110,80,40,0.55)');
                g.addColorStop(0.7, 'rgba(130,95,50,0.25)');
                g.addColorStop(1, 'rgba(130,95,50,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
            }
            if (Math.random() > 0.85) {
                ctx.fillStyle = 'rgba(20,18,12,0.4)';
                ctx.fillRect(x + inset, y + inset, ts - inset * 2, ts - inset * 2);
            }
            bctx.fillStyle = '#c0c0c0';
            bctx.fillRect(x + inset, y + inset, ts - inset * 2, ts - inset * 2);
        }
    }
    overlayNoise(ctx, w, h, 0.03);

    const map = new THREE.CanvasTexture(c);
    const bump = new THREE.CanvasTexture(bc);
    [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    return { map, bump };
};

/**
 * Génère une texture de trottoir (dalles béton)
 */
export const generateSidewalkTexture = () => {
    const width = 256;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Béton base
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, width, height);
    
    // Bruit
    ctx.drawImage(createNoiseCanvas(width, height, 0.1), 0, 0);

    // Dalles
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    const tileSize = 64;
    
    for (let x = 0; x < width; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let y = 0; y < height; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 20);
    return texture;
};
