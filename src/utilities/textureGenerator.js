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
