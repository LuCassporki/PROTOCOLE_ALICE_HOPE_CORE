const { app, BrowserWindow } = require('electron');
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