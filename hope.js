// =======================================================================
// DOM ANCHORS & CORE VARIABLES
// =======================================================================
const anchor = document.getElementById('hope-grid-anchor');
const essence = document.getElementById('hope-essence');
const bubble = document.getElementById('hope-bubble');
const terminal = document.getElementById('hope-terminal');
const outputText = document.getElementById('hope-output-text');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const netTag = document.getElementById('network-tag');

// Éléments Radio Narratifs
const radioControls = document.getElementById('hdo-radio-controls');
const radioClearBtn = document.getElementById('radio-clear-btn');
const radioBoostBtn = document.getElementById('radio-boost-btn');
const radioVocalBtn = document.getElementById('radio-vocal-btn');

// Éléments du HUB Tactique
const hubGrid = document.getElementById('hdo-hub-grid');
const hubCloseBtn = document.getElementById('hub-close-btn');
const hubInventory = document.getElementById('hub-inventory');

// Variables d'état fondamentales
let lastInteractionTime = Date.now();
let currentMode = "idle";
let autonomousQuotes = [];

// Variables de contrôle Radio, Vocal & Minuterie
let isSignalBoosted = false;
let isVocalEnabled = false;
let currentPingTimeout = null;

// Variables pour le Drag Smart
let isMouseDown = false;
let startTime = 0;
let startX, startY;

// Check si environnement Electron existant
const isElectron = typeof require !== 'undefined';
const ipcRenderer = isElectron ? require('electron').ipcRenderer : null;

// Exposer la fonction de transparence au niveau global de la fenêtre
window.electronAPI_setIgnore = (ignore) => {
    if (isElectron) {
        ipcRenderer.send('set-ignore-mouse', ignore);
    }
};

// =======================================================================
// INITIALISATION DE LA BASE DE DONNÉES (MATRICE JSON)
// =======================================================================
async function loadAutonomousQuotes() {
    try {
        const response = await fetch('quotes.json');
        const data = await response.json();
        // On isole et ignore les lignes de commentaires explicatives du JSON
        autonomousQuotes = data.filter(line => !line.startsWith("//"));
        console.log(`[HDO SYSTEM] : ${autonomousQuotes.length} flux mémoriels injectés avec succès.`);
    } catch (error) {
        console.error("[HDO SYSTEM] : Échec de l'interception du fichier quotes.json :", error);
        autonomousQuotes = ["[HOPE] : Liaison synaptique stable. Capsule opérationnelle."];
    }
}

// Lancement global au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    loadAutonomousQuotes().then(() => {
        startIdleGallery();
        planNextPing(); // Amorce le moteur de délai organique
    });
});

// =======================================================================
// CONFIGURATION DE LA BANQUE D'IMAGES (ALICE & HOPE VISUALS)
// =======================================================================
const idleImages = [
    'media/alice/1-fragment.jpg', 'media/alice/2-fragment.jpg', 'media/alice/3-fragment.jpg',
    'media/alice/4-fragment.jpg', 'media/alice/5-fragment.jpg', 'media/alice/6-fragment.jpg',
    'media/alice/7-fragment.jpg', 'media/alice/8-fragment.jpg', 'media/alice/9-fragment.jpg',
    'media/alice/10-fragment.jpg', 'media/alice/11-fragment.jpg', 'media/alice/12-fragment.jpg',
    'media/alice/13-fragment.jpg', 'media/alice/14-fragment.jpg', 'media/alice/15-fragment.jpg',
    'media/alice/16-fragment.jpg', 'media/alice/17-fragment.jpg', 'media/alice/18-fragment.jpg',
    'media/alice/19-fragment.jpg', 'media/alice/20-fragment.jpg', 'media/alice/21-fragment.jpg',
    'media/alice/22-fragment.jpg'
];

const stateImages = {
    listening: 'media/hope/listening-hope.png',
    thinking: 'media/hope/thinking-hope.png',
    speaking: 'media/hope/speaking-hope.png',
    panique: 'media/hope/panique-hope.png' 
};

let idleInterval = null;
let currentIdleIndex = 1;

function changeAvatarImage(url) {
    const avatar = document.getElementById('hope-visual-avatar');
    if (avatar) {
        avatar.style.backgroundImage = `url('${url}')`;
    } else {
        console.warn("[HDO SYSTEM] : L'élément HTML '#hope-visual-avatar' est introuvable dans le DOM.");
    }
}

function startIdleGallery() {
    if (idleInterval) return; 
    changeAvatarImage(idleImages[currentIdleIndex]);
    idleInterval = setInterval(() => {
        currentIdleIndex = (currentIdleIndex + 1) % idleImages.length;
        changeAvatarImage(idleImages[currentIdleIndex]);
    }, 30000); // 10 minutes par fragment d'avatar
}

function stopIdleGallery() {
    clearInterval(idleInterval);
    idleInterval = null;
}

// =======================================================================
// SYSTEM STATE MANAGER (MATRICE DES ÉTATS)
// =======================================================================
function sethopeState(mode) {
    currentMode = mode;
    anchor.classList.remove('state-listening', 'state-thinking', 'state-speaking', 'state-panique');
    essence.classList.remove('speaking');

    if (mode === "idle") {
        netTag.textContent = "STABLE"; netTag.style.color = "#00f0ff";
        startIdleGallery();
    } 
    else {
        stopIdleGallery();
        
        if (stateImages[mode]) {
            changeAvatarImage(stateImages[mode]);
        }

        if (mode === "listening") {
            anchor.classList.add('state-listening');
        } 
        else if (mode === "thinking") {
            anchor.classList.add('state-thinking');
            netTag.textContent = "PROCESSING"; netTag.style.color = "#ffea00";
        } 
        else if (mode === "speaking") {
            anchor.classList.add('state-speaking');
            essence.classList.add('speaking');
            netTag.textContent = "LIVE"; netTag.style.color = "#00bf33";
        }
        else if (mode === "panique") {
            anchor.classList.add('state-panique');
            netTag.textContent = "ALERT"; netTag.style.color = "#ff0000";
        }
    }
}

// =======================================================================
// GESTIONNAIRE D'ÉVÉNEMENTS SMART : CLIC VS GLISSER (DRAG)
// =======================================================================
bubble.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    startTime = Date.now();
    startX = e.screenX;
    startY = e.screenY;
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    startX = e.screenX;
    startY = e.screenY;
    window.moveBy(deltaX, deltaY); 
});

window.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    
    const clickDuration = Date.now() - startTime;
    if (clickDuration < 200) {
        triggerInteractionHop();
    }
});

function triggerInteractionHop() {
    const isOpen = terminal.classList.toggle('open');
    lastInteractionTime = Date.now();
    
    if (isOpen) {
        sethopeState("listening");
        outputText.textContent = "[HOPE] : Écoute active en ligne. J'analyse tes requêtes, MAJOR.";
        if (ipcRenderer) ipcRenderer.send('resize-window', { width: 350, height: 450 });
    } else {
        sethopeState("idle");
        userInput.value = "";
        if (hubGrid) hubGrid.style.display = "none";
        if (radioControls) radioControls.style.display = "auto";
        if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
        startIdleGallery();
    }
}

// =======================================================================
// SYNTHÈSE VOCALE (MOTEUR WEB SPEECH API)
// =======================================================================
function speakMatrixLog(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Nettoyage des balises pour une lecture fluide
    let cleanText = text
        .replace(/\[HOPE\] 'Interception.*?' :/g, 'Interception.')
        .replace(/\[INTERCEPTION DIALOGUE\]/g, 'Alerte flux croisé.')
        .replace(/\[.*?\] :/g, '') 
        .replace(/\|/g, '... de son côté, s\'exclame :'); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR'; 
    utterance.pitch = 1;    
    utterance.rate = 1.8;     

    window.speechSynthesis.speak(utterance);
}

// =======================================================================
// MOTEUR D'INTERCEPTION MULTICAST RÉCURSIF (VARIANCE TEMPORELLE)
// =======================================================================
function triggerAutonomousPing() {
    if (currentMode !== "idle" || autonomousQuotes.length === 0) {
        currentPingTimeout = setTimeout(triggerAutonomousPing, 2000);
        return;
    }

    lastInteractionTime = Date.now();
    sethopeState("speaking");
    terminal.classList.add('open');
    
    if (radioControls) radioControls.style.display = "flex";
    if (ipcRenderer) ipcRenderer.send('resize-window', { width: 350, height: 450 });

    let avaliableQuotes = autonomousQuotes;
    if (isSignalBoosted) {
        const dialogues = autonomousQuotes.filter(q => q.includes("|"));
        if (dialogues.length > 0) avaliableQuotes = dialogues;
    }

    const randomQuote = avaliableQuotes[Math.floor(Math.random() * avaliableQuotes.length)];
    outputText.textContent = randomQuote;

    if (isVocalEnabled) {
        speakMatrixLog(randomQuote);
    }
}

function planNextPing() {
    const BASE_MIN_DELAY = isSignalBoosted ? 2000 : 60000; 
    const RANDOM_BONUS_MAX = isSignalBoosted ? 3000 : 120000; 

    const nextDynamicDelay = BASE_MIN_DELAY + Math.floor(Math.random() * RANDOM_BONUS_MAX);
    console.log(`[HDO RADIO] : Fréquence calée. Prochain scan dans ${(nextDynamicDelay / 1000).toFixed(1)}s.`);
    currentPingTimeout = setTimeout(triggerAutonomousPing, nextDynamicDelay);
}

// Écouteurs de la barre de contrôle radio
radioClearBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    sethopeState("idle");
    terminal.classList.remove('open');
    if (radioControls) radioControls.style.display = "none";
    if (hubGrid) hubGrid.style.display = "none";
    if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
    
    lastInteractionTime = Date.now();
    planNextPing();
});

radioBoostBtn.addEventListener('click', () => {
    isSignalBoosted = !isSignalBoosted;
    if (isSignalBoosted) {
        radioBoostBtn.textContent = "📡 BOOST[MAX]";
        radioBoostBtn.style.borderColor = "var(--hdo-gold)";
        radioBoostBtn.style.color = "var(--hdo-gold)";
        if (!terminal.classList.contains('open')) {
            clearTimeout(currentPingTimeout);
            triggerAutonomousPing();
        }
    } else {
        radioBoostBtn.textContent = "📡 BOOST[OFF]";
        radioBoostBtn.style.borderColor = "";
        radioBoostBtn.style.color = "";
    }
});

radioVocalBtn.addEventListener('click', () => {
    isVocalEnabled = !isVocalEnabled;
    if (isVocalEnabled) {
        radioVocalBtn.textContent = "🔊[ON  ]";
        radioVocalBtn.style.borderColor = "#00bf33"; 
        radioVocalBtn.style.color = "#00bf33";
        speakMatrixLog(outputText.textContent);
    } else {
        radioVocalBtn.textContent = "🔊[OFF]";
        radioVocalBtn.style.borderColor = "";
        radioVocalBtn.style.color = "";
        window.speechSynthesis.cancel(); 
    }
});

outputText.style.cursor = "pointer";
outputText.addEventListener('click', () => {
    speakMatrixLog(outputText.textContent);
});

// =======================================================================
// INTERPRÉTEUR DE COMMANDES HDO & DIALOGUES UTILISATEUR
// =======================================================================
async function processCommand(rawInput) {
    const command = rawInput.trim();
    if (!command) return;

    lastInteractionTime = Date.now();
    const cleanCmd = command.toLowerCase();
    
    // Récupération des 4 grilles HTML
    const grids = {
        1: document.getElementById('hdo-hub-grid-1'),
        2: document.getElementById('hdo-hub-grid-2'),
        3: document.getElementById('hdo-hub-grid-3'),
        4: document.getElementById('hdo-hub-grid-4')
    };

    // 1. DÉTECTION DES COMMANDES SYSTÈMES ET REFRESH DE LA DATA SHEETS
    if (cleanCmd.startsWith('hub') || cleanCmd === 'hub') {
        sethopeState("thinking");
        outputText.textContent = "[HDO CLOUD] : Synchronisation des fréquences avec le Sheets maître...";
        
        // L'action magique : on force la relecture des 36 boutons avant l'affichage
        await syncFlowerFromSheets();
    }

// 1. GESTION DES COMMANDES SYSTÈMES
    switch(cleanCmd) {
        case 'hub1': case 'hub2': case 'hub3': case 'hub4':
            const targetIndex = cleanCmd.replace('hub', '');
            sethopeState("speaking");
            outputText.textContent = `[HOPE] : Activation du quadrant tactique ${targetIndex}.`;
            
            // Masque tout et affiche uniquement le quadrant demandé
            Object.keys(grids).forEach(key => grids[key].style.display = "none");
            if (grids[targetIndex]) grids[targetIndex].style.display = "grid";
            
            if (ipcRenderer) ipcRenderer.send('resize-window', { width: 350, height: 720 });
            return;

        case 'hub':
            // COMMANDE MAÎTRESSE : Déploiement simultané des 4 quadrants
            sethopeState("speaking");
            outputText.textContent = "[HOPE] : MATRICE HUB INITIALISÉE. Déploiement global de la structure géométrique.";
            
            // Affiche les 4 grilles en même temps
            Object.keys(grids).forEach(key => grids[key].style.display = "grid");
            
            // On élargit massivement la vitre Electron pour afficher la fleur complète sans coupure
            if (ipcRenderer) ipcRenderer.send('resize-window', { width: 700, height: 950 });
            return;
            
        case 'end':
            sethopeState("panique");
            outputText.textContent = `[HOPE] : Commande "${command}" interdite. Tu ne fais pas deux fois la même erreur, non !? Alors ne lâche pas, elle t'attend quelque part !`;
            return;
            
        case 'clear':
            outputText.textContent = "[HOPE] : Réinitialisation. Fermeture des quadrants.";
            Object.keys(grids).forEach(key => grids[key].style.display = "none");
            if (ipcRenderer) ipcRenderer.send('resize-window', { width: 350, height: 450 });
            return;
    }


    // 2. Traitement d'un texte classique (Simulateur de compilation)
    sethopeState("thinking");
    outputText.textContent = `[Analyse] : Traitement de la commande en cours...`;

    setTimeout(() => {
        sethopeState("speaking");
        outputText.textContent = `[HOPE] : Commande "${command}" compilée. Le protocole répond parfaitement.`;

      setTimeout(() => {
            sethopeState(terminal.classList.contains('open') ? "listening" : "idle");
        }, 3500);
    }, 1200);
}

// Gestionnaire d'actions natives appelées depuis les boutons du HUB
function processNativeAction(actionName) {
    if (actionName === "force_cloud_sync") {
        sethopeState("thinking");
        outputText.textContent = "[HDO SYSTEM] : Re-calibrage manuel des flux en cours...";
        
        syncFlowerFromSheets().then(() => {
            sethopeState("speaking");
            outputText.textContent = "[HDO SYSTEM] : Alignement terminé. Tous les quadrants sont à jour.";
        });
    }
    // Tu pourras rajouter tes autres fonctions ici (lancer de la musique, lever les boucliers...)
}
// =======================================================================
// ÉCOUTEURS DES BOUTONS DE FERMETURE DES PÉTALES
// =======================================================================
for (let i = 1; i <= 4; i++) {
    const closeBtn = document.getElementById(`hub-close-btn-${i}`);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const grid = document.getElementById(`hdo-hub-grid-${i}`);
            if (grid) grid.style.display = "none";
            outputText.textContent = `[HOPE] : Déconnexion du quadrant ${i}.`;
            
            // Si toutes les grilles sont fermées, on repasse en mode minimal
            const anyOpen = Object.keys([1,2,3,4]).some(k => document.getElementById(`hdo-hub-grid-${parseInt(k)+1}`).style.display === "grid");
            if (!anyOpen) {
                sethopeState("idle");
                if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
            }
        });
    }
}

// Écouteurs pour la validation de saisie du Major
sendBtn.addEventListener('click', () => {
    processCommand(userInput.value);
    userInput.value = "";
});

userInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') {
        processCommand(userInput.value);
        userInput.value = "";
    }
});

// =======================================================================
// ACTIONS DES TOUCHES DU HUB TACTIQUE
// =======================================================================
if (hubCloseBtn) {
    hubCloseBtn.addEventListener('click', () => {
        if (hubGrid) hubGrid.style.display = "none";
        outputText.textContent = "[HOPE] : HUB déconnecté. Retour en veille.";
        sethopeState("idle");
        if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
    });
}

if (hubInventory) {
    hubInventory.addEventListener('click', () => {
        outputText.textContent = "[MAJOR] : Inventaire tactique indisponible. Redirection via le lien d'ancrage.";
    });
}

// =======================================================================
// AJUSTEMENT CYBERNÉTIQUE DE LA VITRE (AUTO-RESIZE TO CONTENT)
// =======================================================================
function syncWindowSizeToContent() {
    if (!isElectron) return;

    // Petite temporisation pour laisser le temps au DOM et au CSS de se positionner
    setTimeout(() => {
        // On récupère les dimensions réelles du contenu du body
        // On ajoute une petite marge de sécurité de 20px pour éviter les barres de défilement
        const currentWidth = document.body.scrollWidth + 20;
        const currentHeight = document.body.scrollHeight + 20;

        console.log(`[HDO AUTO-RESIZE] : Ajustement de la capsule -> ${currentWidth}x${currentHeight}px`);
        
        // On envoie les dimensions exactes à main.js
        ipcRenderer.send('resize-window', { width: currentWidth, height: currentHeight });
    }, 50);
}

