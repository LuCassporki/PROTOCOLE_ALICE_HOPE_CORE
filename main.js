const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win; // On déclare la variable globale pour la fenêtre unique

function createHopWindow() {
    // On récupère la taille de l'écran principal de l'utilisateur
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;
    
    win = new BrowserWindow({
        width: 300,              // Taille par défaut (évite le "auto" qui fait crasher Electron)
        height: 300,             // Taille par défaut
        // CALCUL DE LA POSITION : (Largeur Écran / 2) - (Largeur Fenêtre / 2) pour centrer pile au milieu
        x: Math.floor((width / 2) - (300 / 2)), 
        y: 100,                  // Une valeur numérique propre (évite le "50%" qui glitch sur Electron)
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

    // =======================================================================
    // LE FILTRE FANTÔME (Ignorer le vide, capturer les éléments cliquables)
    // =======================================================================
    
    //    event.target.id === 'hope-grid-anchor';

    win.webContents.on('dom-ready', () => { 
        win.webContents.executeJavaScript(`
            window.addEventListener('mousemove', (event) => {
                // On vérifie si la souris survole du vide ou le fond du body
                const isOverVoid = event.target === document.documentElement || 
                                   event.target === document.body || 
                                   event.target.id === 'hope-bubble';
                
                if (isOverVoid) {
                    // La souris passe À TRAVERS la fenêtre
                    window.electronAPI_setIgnore(true);
                } else {
                    // La souris CAPTURE les clics sur les boutons/inputs
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