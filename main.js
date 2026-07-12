const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win; // On déclare la variable globale pour la fenêtre unique

function createHopWindow() {
    win = new BrowserWindow({
        width: 450,            // Taille initiale réduite pour la bulle en mode Idle
        height: 450,
        frame: false,          // Désactive les bordures Windows (Pas de bandeau classique)
        transparent: true,      // Fond 100% transparent pour intégration sur l'écran
        alwaysOnTop: true,      // Force la bulle à flotter au-dessus de TOUTES les applications
        resizable: false,       // Évite que l'utilisateur déforme la bulle manuellement
        skipTaskbar: false,     // Laisse l'icône dans la barre des tâches pour pouvoir la fermer au besoin
        webPreferences: {
            nodeIntegration: true,   // Activé pour permettre l'IPC direct (redimensionnement)
            contextIsolation: false  // Permet à hope.js d'envoyer des messages à main.js facilement
        }
    });

    // ARCHITECTURE SYNCHRONE : Charge ton déploiement GitHub Pages direct.
    // Toute modification poussée sur GitHub sera visible instantanément sur ton PC !
    win.loadURL('https://lucassporki.github.io/PROTOCOLE_ALICE_HOPE_CORE/');

    // Gestion du focus pour s'assurer que la bulle reste au-dessus des jeux ou de VS Code
    win.on('focus', () => {
        win.setAlwaysOnTop(true, 'screen-saver');
    });

    // Sécurité si la fenêtre est fermée
    win.on('closed', () => {
        win = null;
    });
}

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