const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win; // On déclare la variable globale pour la fenêtre unique

function createHopWindow() {
         // On récupère la taille de l'écran principal de l'utilisateur
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;
    win = new BrowserWindow({
   
        width: 270,             // Taille de départ
        height: 270,
        // CALCUL DE LA POSITION : (Largeur Écran / 2) - (Largeur Fenêtre / 2) pour centrer pile au milieu
        x: Math.floor((width / 2) - (270 / 2)), 
        y: 20, // 20 pixels par rapport au haut de l'écran
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

    win.loadURL('https://lucassporki.github.io/PROTOCOLE_ALICE_HOPE_CORE/');

    // =======================================================================
    // LE FILTRE FANTÔME (Ignorer le vide, capturer les éléments cliquables)
    // =======================================================================
    win.webContents.on('dom-ready', () => {
        win.webContents.executeJavaScript(`
            window.addEventListener('mousemove', (event) => {
                // On vérifie si la souris survole du vide ou le fond du body
                const isOverVoid = event.target === document.documentElement || 
                                   event.target === document.body || 
                                   event.target.id === 'hope-grid-anchor';
                
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
    // Toute modification poussée sur GitHub sera visible instantanément sur ton PC !
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
        // L'option { forward: true } est indispensable : elle permet à Electron de continuer
        // à envoyer les événements de souris (comme le mousemove) au HTML même quand on clique à travers !
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

// Ton écouteur de redimensionnement classique qui reste inchangé
ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) win.setSize(width, height);
});

// =======================================================================
// ÉCOUTEUR IPC (Redimensionnement Dynamique de la Vitre Invisible)
// =======================================================================
ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) {
        win.setSize(width, height);
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