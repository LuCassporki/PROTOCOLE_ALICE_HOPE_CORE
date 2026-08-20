const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win; // Fenêtre unique globale

function createHopWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;
    const windowSize = 300;
    win = new BrowserWindow({
       width: windowSize + 100,
        height: windowSize + 50,
        x: Math.floor((width / 2) - (windowSize / 2)),
        y: 100,
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
    // LE FILTRE FANTÔME CORRIGÉ (Ignore le vide, capture les interactions)
    // =======================================================================
    win.webContents.on('dom-ready', () => { 
        win.webContents.executeJavaScript(`
            window.addEventListener('mousemove', (event) => {
                // On vérifie proprement si la souris survole uniquement le fond pur (body ou html)
                const isOverVoid = event.target === document.documentElement || 
                                   event.target === document.body;
                
                if (isOverVoid) {
                    // La souris passe À TRAVERS la fenêtre
                    window.electronAPI_setIgnore(true);
                } else {
                    // La souris CAPTURE les clics sur les éléments interactifs
                    window.electronAPI_setIgnore(false);
                }
            });
        `);
    });

    // Charge ton déploiement GitHub Pages
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
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

// ÉCOUTEUR IPC DE REDIMENSIONNEMENT
ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) {
        const [currentX, currentY] = win.getPosition();
        win.setSize(width, height);
        win.setPosition(currentX, currentY);
    }
});

// ÉCOUTEUR IPC DE DÉPLACEMENT DE FENÊTRE
ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
    if (win) {
        const [currentX, currentY] = win.getPosition();
        win.setPosition(currentX + deltaX, currentY + deltaY);
    }
});

// INITIALISATION DU SYSTÈME
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