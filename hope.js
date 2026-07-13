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

// Force la fonction à être visible partout dans l'application
window.startIdleGallery = function() {
    if (idleInterval) return; 
    changeAvatarImage(idleImages[currentIdleIndex]);
    idleInterval = setInterval(() => {
        currentIdleIndex = (currentIdleIndex + 1) % idleImages.length;
        changeAvatarImage(idleImages[currentIdleIndex]);
    }, 30000);
};

function stopIdleGallery() {
    clearInterval(idleInterval);
    idleInterval = null;
}

// Check si environnement Electron existant
const isElectron = typeof window !== 'undefined' && typeof window.process !== 'undefined' && window.process.versions && window.process.versions.electron && typeof require !== 'undefined';
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
        autonomousQuotes = data.filter(line => !line.startsWith("//"));
        console.log(`[HDO SYSTEM] : ${autonomousQuotes.length} flux mémoriels injectés avec succès.`);
    } catch (error) {
        console.error("[HDO SYSTEM] : Échec de l'interception du fichier quotes.json :", error);
        autonomousQuotes = ["[HOPE] : Liaison synaptique stable. Capsule opérationnelle."];
    }
}

// Lancement global au chargement du DOM CORRIGÉ (avec async)
document.addEventListener('DOMContentLoaded', () => {
    loadAutonomousQuotes().then(async () => {
        window.startIdleGallery();
        planNextPing(); // Amorce le moteur de délai organique
        
        // --- SYNCHRONISATION INITIALE DES DEUX ONGLETS ---
        await Promise.all([
            chargerOpsCmdDepuisSheets(),   // Charge l'onglet des commandes
            chargerOpsStatesDepuisSheets() // OBLIGATOIRE : Charge ton onglet des états visuels !
        ]);
    });
});

// =======================================================================
// SYSTEM STATE MANAGER (MATRICE DES ÉTATS)
// =======================================================================
function sethopeState(mode) {
    currentMode = mode;
    
    // 1. GESTION DU MODE IDLE NATIF (Géré par le code)
    if (mode === "idle") {
        netTag.textContent = "STABLE"; 
        netTag.style.color = "#00f0ff";
        
        // Réinitialisation des variables CSS aux valeurs de veille
        document.documentElement.style.setProperty('--essence-bg', 'linear-gradient(135deg, #00f0ff 0%, #440099 100%)');
        document.documentElement.style.setProperty('--essence-shadow', '0 0 30px rgba(0, 240, 255, 0.2)');
        document.documentElement.style.setProperty('--essence-morph-speed', '3s');
        document.documentElement.style.setProperty('--essence-scale', 'scale(1)');
        document.documentElement.style.setProperty('--ring-color', '');
        document.documentElement.style.setProperty('--ring-filter', 'drop-shadow(0 0 15px transparent)');
        document.documentElement.style.setProperty('--avatar-opacity', '1');
        document.documentElement.style.setProperty('--avatar-filter', 'drop-shadow(0 0 0px transparent)');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(1)');

        // Nettoyage des styles forcés sur les anneaux pour revenir aux valeurs de ring.css
        for (let i = 1; i <= 4; i++) {
            const ring = document.querySelector(`.hope-ring${i}`);
            if (ring) ring.style.animationDuration = "12s, 15s";
        }
        
        essence.classList.remove('active-signal');
        window.startIdleGallery();
        return;
    }

    // 2. GESTION DES ÉTATS DYNAMIQUES VIA GOOGLE SHEETS
    stopIdleGallery();
    
    // Sécurité au cas où dictionnaireEtats n'est pas encore initialisé
    if (typeof dictionnaireEtats === 'undefined' || dictionnaireEtats.length === 0) {
        console.warn(`[HDO SYSTEM] : Matrice indisponible. Repli temporaire sur l'état "${mode}".`);
        document.documentElement.style.setProperty('--ring-color', '#00f0ff');
        return;
    }

    const config = dictionnaireEtats.find(e => e.name === mode.trim().toLowerCase());

    if (!config) {
        console.warn(`[HDO SYSTEM] : L'état "${mode}" n'est pas encore disponible dans le dictionnaire.`);
        document.documentElement.style.setProperty('--ring-color', '#00f0ff');
        return;
    }

    // --- MISE À JOUR VISUELLE (CORE & ANNEAUX) ---
    document.documentElement.style.setProperty('--ring-color', config.ringColor);
    document.documentElement.style.setProperty('--ring-filter', `drop-shadow(0 0 25px ${config.ringColor})`);
    
    document.documentElement.style.setProperty('--essence-bg', `linear-gradient(135deg, ${config.auraColor} 0%, #100020 100%)`);
    document.documentElement.style.setProperty('--essence-shadow', `0 0 40px ${config.auraColor}`);
    document.documentElement.style.setProperty('--essence-morph-speed', config.pulseSpeed);

    // 🔥 LE CORRECTIF : Application de la vitesse de rotation aux 4 anneaux
    for (let i = 1; i <= 4; i++) {
        const ring = document.querySelector(`.hope-ring${i}`);
        if (ring && config.ringRotation) {
            // Ton CSS utilise deux animations (corePulse et ringRotationZ).
            // La deuxième valeur (ex: 4s, 5s) gère la vitesse de rotation sur l'axe Z.
            // On conserve la pulsation de l'index et on injecte ta vitesse dynamique du Sheets !
            const pulseDuration = (i % 2 === 0) ? "2s" : "4s";
            ring.style.animationDuration = `${pulseDuration}, ${config.ringRotation}`;
        }
    }

    // --- INTERFACE AUDIO SPECTRUM ---
    if (mode === "speaking") {
        essence.classList.add('speaking');
    } else {
        essence.classList.remove('speaking');
    }

    // --- CONFIGURATION DU TEXTE D'ALERTE LATÉRAL (netTag) ---
    if (config.alertStyle) {
        netTag.textContent = config.alertStyle.toUpperCase();
    }
    if (config.alertColor) {
        netTag.style.color = config.alertColor;
    }

    // --- GESTION DU VISAGE D'ALICE (AVATAR) ---
    if (config.imageName) {
        changeAvatarImage(`media/hope/${config.imageName}`);
    }

    // Application des micro-ajustements d'échelle basés sur l'état
    if (mode === "listening") {
        document.documentElement.style.setProperty('--avatar-opacity', '0.75');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(1.02)');
        document.documentElement.style.setProperty('--essence-scale', 'scale(1.08)');
    } else if (mode === "thinking") {
        document.documentElement.style.setProperty('--avatar-opacity', '0.85');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(0.98)');
        document.documentElement.style.setProperty('--essence-scale', 'scale(1)');
    } else if (mode === "speaking") {
        document.documentElement.style.setProperty('--avatar-opacity', '0.85');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(1.05)');
        document.documentElement.style.setProperty('--essence-scale', 'scale(1)');
    } else if (mode === "panique") {
        document.documentElement.style.setProperty('--avatar-opacity', '1');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(1.1)');
        document.documentElement.style.setProperty('--essence-scale', 'scale(0.95)');
    }

    console.log(`[HDO MATRIX] : Statut réorienté vers [${mode.toUpperCase()}] depuis le Cloud.`);
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
        if (ipcRenderer) ipcRenderer.send('resize-window', { width: 400, height: 450 });
    } else {
        sethopeState("idle");
        userInput.value = "";
        if (hubGrid) hubGrid.style.display = "none";
        if (radioControls) radioControls.style.display = "auto";
        if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
        window.startIdleGallery();
    }
}

// =======================================================================
// SYNTHÈSE VOCALE (MOTEUR WEB SPEECH API)
// =======================================================================
function speakMatrixLog(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let cleanText = text
        .replace(/\[HOPE\] 'Interception.*?' :/g, 'Interception.')
        .replace(/\[INTERCEPTION DIALOGUE\]/g, 'Alerte flux croisé.')
        .replace(/\[.*?\] :/g, '') 
        .replace(/\|/g, '... de son côté, s\'exclame :'); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR'; 
    utterance.pitch = 1;    
    utterance.rate = 1.8;  
    
    // 🔥 CONNEXION AU FLUX SENSORIEL REEL
    const essenceCentrale = document.getElementById('hope-essence');

    // Dès que le son sort des haut-parleurs : on active les barres
    utterance.onstart = () => {
        if (essenceCentrale) essenceCentrale.classList.add('active-signal');
    };

    // Dès que la phrase est finie ou coupée : on fige les barres
    utterance.onend = () => {
        if (essenceCentrale) essenceCentrale.classList.remove('active-signal');
    };

    // Sécurité si la synthèse vocale rencontre une erreur ou est interrompue abruptement
    utterance.onerror = () => {
        if (essenceCentrale) essenceCentrale.classList.remove('active-signal');
    };

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
    if (radioControls) radioControls.style.display = "auto";
    if (hubGrid) hubGrid.style.display = "none";
    if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
    
    lastInteractionTime = Date.now();
    planNextPing();
});

radioBoostBtn.addEventListener('click', () => {
    isSignalBoosted = !isSignalBoosted;
    if (isSignalBoosted) {
        radioBoostBtn.textContent = "📡[MAX]";
        radioBoostBtn.style.borderColor = "var(--hdo-gold)";
        radioBoostBtn.style.color = "var(--hdo-gold)";
        if (!terminal.classList.contains('open')) {
            clearTimeout(currentPingTimeout);
            triggerAutonomousPing();
        }
    } else {
        radioBoostBtn.textContent = "📡[OFF]";
        radioBoostBtn.style.borderColor = "";
        radioBoostBtn.style.color = "#ff0000";
    }
});

radioVocalBtn.addEventListener('click', () => {
    isVocalEnabled = !isVocalEnabled;
    if (isVocalEnabled) {
        radioVocalBtn.textContent = "🔊[ON  ]";
        radioVocalBtn.style.borderColor = "#00bf33"; 
        radioVocalBtn.style.color = "#0a5800";
        speakMatrixLog(outputText.textContent);
    } else {
        radioVocalBtn.textContent = "🔊[OFF]";
        radioVocalBtn.style.borderColor = "";
        radioVocalBtn.style.color = "#ff0000";
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
    
    const grids = {
        1: document.getElementById('hdo-hub-grid-1'),
        2: document.getElementById('hdo-hub-grid-2'),
        3: document.getElementById('hdo-hub-grid-3'),
        4: document.getElementById('hdo-hub-grid-4')
    };

    if (cleanCmd.startsWith('hub') || cleanCmd === 'hub') {
        sethopeState("thinking");
        outputText.textContent = "[HDO CLOUD] : Synchronisation des fréquences avec le Sheets maître...";
        
        await Promise.all([
            syncFlowerFromSheets(),
            chargerOpsCmdDepuisSheets(),
            chargerOpsStatesDepuisSheets()
        ]);
        await syncFlowerFromSheets(); 
    }

    switch(cleanCmd) {
        case 'hub1': case 'hub2': case 'hub3': case 'hub4':
            const targetIndex = cleanCmd.replace('hub', '');
            sethopeState("speaking");
            outputText.textContent = `[HOPE] : Activation du quadrant tactique ${targetIndex}.`;
            
            Object.keys(grids).forEach(key => grids[key].style.display = "none");
            if (grids[targetIndex]) grids[targetIndex].style.display = "grid";
            
            if (ipcRenderer) ipcRenderer.send('resize-window', { width: 350, height: 720 });
            return;

        case 'hub':
            sethopeState("speaking");
            outputText.textContent = "[HOPE] : MATRICE HUB INITIALISÉE. Déploiement global de la structure géométrique.";
            Object.keys(grids).forEach(key => grids[key].style.display = "grid");
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

    if (typeof dictionnaireCommandes !== 'undefined') {
        const cmdSheets = dictionnaireCommandes.find(c => c.keyword === cleanCmd);

        if (cmdSheets) {
            sethopeState("thinking");
            outputText.textContent = `[Analyse] : Traitement de la directive "${command}"...`;

            setTimeout(() => {
             if (cmdSheets.state_hop) {
                sethopeState(cmdSheets.state_hop);
            } else {
                sethopeState("speaking");
            }
            
            const texteReponse = cmdSheets.responseText || `[HOPE] : Directive validée.`;
            outputText.textContent = texteReponse;

            // 🔥 LE CORRECTIF : Si le bouton vocal 🔊 est sur ON, elle te parle !
            if (isVocalEnabled) {
                speakMatrixLog(texteReponse);
            }

                setTimeout(() => {
                    if (cmdSheets.type === 'link') {
                        window.open(cmdSheets.payload, '_blank');
                    } 
                    else if (cmdSheets.type === 'function') {
                        if (typeof window[cmdSheets.payload] === "function") {
                            window[cmdSheets.payload]();
                        } else {
                            outputText.textContent = `[ERREUR] : La fonction "${cmdSheets.payload}" est introuvable.`;
                        }
                    }

                    setTimeout(() => {
                        sethopeState(terminal.classList.contains('open') ? "listening" : "idle");
                    }, 2000);

                }, 2200);

            }, 1200);

            return;
        }
    }

    sethopeState("thinking");
    outputText.textContent = `[Analyse] : Traitement de la commande en cours...`;

   setTimeout(() => {
        sethopeState("speaking");
        const reponseGenerique = `[HOPE] : Commande "${command}" compilée. Le protocole répond parfaitement.`;
        outputText.textContent = reponseGenerique;

        // 🔥 LE CORRECTIF : Validation vocale sur le texte de repli
        if (isVocalEnabled) {
            speakMatrixLog(reponseGenerique);
        }

        setTimeout(() => {
            sethopeState(terminal.classList.contains('open') ? "listening" : "idle");
        }, 3500);
    }, 1200);
}

function processNativeAction(actionName) {
    if (actionName === "force_cloud_sync") {
        sethopeState("thinking");
        outputText.textContent = "[HDO SYSTEM] : Re-calibrage manuel des flux en cours...";
        
        syncFlowerFromSheets().then(() => {
            sethopeState("speaking");
            outputText.textContent = "[HDO SYSTEM] : Alignement terminé. Tous les quadrants sont à jour.";
        });
    }
}

for (let i = 1; i <= 4; i++) {
    const closeBtn = document.getElementById(`hub-close-btn-${i}`);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const grid = document.getElementById(`hdo-hub-grid-${i}`);
            if (grid) grid.style.display = "none";
            outputText.textContent = `[HOPE] : Déconnexion du quadrant ${i}.`;
            
            const anyOpen = Object.keys([1,2,3,4]).some(k => document.getElementById(`hdo-hub-grid-${parseInt(k)+1}`).style.display === "grid");
            if (!anyOpen) {
                sethopeState("idle");
                if (ipcRenderer) ipcRenderer.send('resize-window', { width: 250, height: 250 });
            }
        });
    }
}

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

function syncWindowSizeToContent() {
    if (!isElectron) {
        console.log("[HDO MOBILE] : Mode web actif. Redimensionnement Electron ignoré.");
        return; 
    }

    setTimeout(() => {
        const currentWidth = document.body.scrollWidth + 20;
        const currentHeight = document.body.scrollHeight + 20;
        console.log(`[HDO AUTO-RESIZE] : Ajustement de la capsule -> ${currentWidth}x${currentHeight}px`);
        if (typeof ipcRenderer !== 'undefined') {
            ipcRenderer.send('resize-window', { width: currentWidth, height: currentHeight });
        }
    }, 50);
}