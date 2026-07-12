const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createHopWindow() {
    const win = new BrowserWindow({
        width: 450,
        height: 500,
        frame: false,          // Désactive les bordures Windows/Mac (Pas de bouton fermer/réduire classique)
        transparent: true,      // Rend le fond de la fenêtre 100% transparent pour laisser voir ton fond d'écran
        alwaysOnTop: true,      // FORCE la bulle à flotter au-dessus de TOUTES les autres applications (VS Code, jeux, etc.)
        resizable: true,
        skipTaskbar: false,     // Laisse l'icône visible dans la barre des tâches pour pouvoir la fermer si besoin
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // ARCHITECTURE STABLE D'ACTUALISATION SYNCHRONE :
    // Au lieu de charger le fichier local, on charge ton lien de déploiement GitHub Pages direct.
    // Ainsi, chaque mise à jour poussée sur Git se reflète instantanément à l'ouverture de l'app PC !
    win.loadURL('https://lucassporki.github.io/PROTOCOLE_ALICE_HOPE_CORE/');

    // Dans ton fichier main.js, juste après win.loadURL(...) :

win.webContents.on('dom-ready', () => {
    // On envoie une commande à Electron à chaque fois que la souris bouge
    win.webContents.executeJavaScript(`
        window.addEventListener('mousemove', (event) => {
            // Si la souris survole du vide (pas de bulle, pas de terminal ouvert)
            if (event.target === document.documentElement || event.target.id === 'hop-grid-anchor') {
                // On dit à Electron d'ignorer le clic (transpercer la fenêtre)
                window.electronAPI.setIgnore(true);
            } else {
                // On capture le clic car on survole un élément de Hop
                window.electronAPI.setIgnore(false);
            }
        });
    `);
});

// Pour faire la liaison, expose cette API dans ton main.js via IPC :
const { ipcMain } = require('electron');
// (Il faudra configurer un preload script pour un projet de prod, 
// mais pour ta R&D immédiate tu peux utiliser win.setIgnoreMouseEvents directement selon tes préférences)

    // Optionnel : Éviter que la fenêtre sorte de l'écran lors du drag
    win.on('focus', () => {
        win.setAlwaysOnTop(true, 'screen-saver');
    });
}

app.whenReady().then(() => {
    createHopWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createHopWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});



let win;

function createWindow () {
    win = new BrowserWindow({
        width: 250,        // Taille initiale réduite pour la bulle en mode Idle
        height: 250,
        frame: false,
        transparent: true,
        alwaysOnTop: true, // Pour que Hop reste visible au-dessus de tes fenêtres
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Permet d'utiliser window.moveBy et IPC directement pour tes tests
        }
    });

    win.loadFile('index.html');
}

// L'ÉCOUTEUR MAGIQUE : Reçoit l'ordre de l'interface et ajuste la taille du verre invisible
ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) {
        win.setSize(width, height);
    }
});

app.whenReady().then(createWindow);