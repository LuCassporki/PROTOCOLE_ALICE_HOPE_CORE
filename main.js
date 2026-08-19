const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win; // On déclare la variable globale pour la fenêtre unique

function createHopWindow() {
    // On récupère la taille de l'écran principal de l'utilisateur
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    win = new BrowserWindow({
        width: 250,                    // Taille initiale correspondant au mode veille défini dans hope.js
        height: 250,                   
        x: Math.floor((width / 2) - (250 / 2)), 
        y: Math.floor((height / 2) - (250 / 2)), // Centrage vertical initial plus propre
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Force le centrage absolu de la fenêtre par l'OS au spawn pour éviter tout décalage visuel
    win.center();

    // =======================================================================
    // LE FILTRE FANTÔME (Ignorer le vide, capturer les éléments cliquables)
    // =======================================================================
    win.webContents.on('dom-ready', () => { 
        win.webContents.executeJavaScript(`
            window.addEventListener('mousemove', (event) => {
                // On vérifie si la souris survole du vide ou le fond du body
                const isOverVoid = event.target === document.documentElement || 
                                   event.target === document.body;
                
                if (isOverVoid) {
                    // La souris passe À TRAVERS la fenêtre
                    window.electronAPI_setIgnore(true);
                } else {
                    // La souris CAPTURE les clics sur la bulle et les éléments interactifs
                    window.electronAPI_setIgnore(false);
                }
            });
        `);
    });

    // ARCHITECTURE SYNCHRONE : Charge ton déploiement GitHub Pages direct.
    win.loadURL('https://lucassporki.github.io/PROTOCOLE_ALICE_HOPE_CORE/');

    win.on('focus', () => {
        win.setAlwaysOnTop(true, 'screen-saver');
    });

    win.on('closed', () => {
        win = null;
    });
}

// Liaison IPC pour le commutateur de transparence aux clics
ipcMain.on('set-ignore-mouse', (event, ignore) => {
    if (win) {
        // L'option { forward: true } permet à Electron de continuer à envoyer les mousemove
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

// =======================================================================
// ÉCOUTEUR IPC DE REDIMENSIONNEMENT DOUBLEMENT SÉCURISÉ (UNIFIÉ)
// =======================================================================
ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) {
        // 1. On intercepte la position exacte de Hop AVANT le changement de taille
        const [currentX, currentY] = win.getPosition();

        // 2. On applique la nouvelle taille exigée par le state HTML
        win.setSize(width, height);

        // 3. On repositionne immédiatement la fenêtre à ses coordonnées d'origine
        win.setPosition(currentX, currentY);
    }
});

// =======================================================================
// ÉCOUTEUR IPC POUR LE DÉPLACEMENT GLOBAL DE LA FÉNETRE (DRAG GLOBAL)
// =======================================================================
ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
    if (win) {
        const [currentX, currentY] = win.getPosition();
        win.setPosition(currentX + deltaX, currentY + deltaY);
    }
});

// INITIALISATION DU SYSTÈME (Une seule fois)
app.whenReady().then(() => {
    createHopWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createHopWindow();
    });
});

// GESTION DE LA FERMETURE
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});