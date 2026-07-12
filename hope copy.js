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
const radioControls = document.getElementById('hdo-radio-controls');
const radioClearBtn = document.getElementById('radio-clear-btn');
const radioBoostBtn = document.getElementById('radio-boost-btn');
const radioVocalBtn = document.getElementById('radio-vocal-btn');
// Dom Elements
const hubGrid = document.getElementById('hdo-hub-grid');
const hubCloseBtn = document.getElementById('hub-close-btn');
const hubInventory = document.getElementById('hub-inventory');

let lastInteractionTime = Date.now();
let currentMode = "idle";

// VARIABLES POUR LE DRAG SMART SANS INTERCEPTION
let isMouseDown = false;
let startTime = 0;
let startX, startY;

let isSignalBoosted = false;
let currentPingTimeout = null;


// VARIABLES DE CONTRÔLE VOCAL
let isVocalEnabled = false;

// Variable globale pour stocker les citations rechargées du JSON
let autonomousQuotes = [];

// Fonction pour charger la base de données narrative de la Matrix
async function loadAutonomousQuotes() {
    try {
        const response = await fetch('quotes.json');
        const data = await response.json();
        // On filtre pour ignorer les lignes de commentaires explicatives du JSON
        autonomousQuotes = data.filter(line => !line.startsWith("//"));
        console.log(`[HDO SYSTEM] : ${autonomousQuotes.length} flux mémoriels injectés avec succès.`);
    } catch (error) {
        console.error("[HDO SYSTEM] : Échec de l'interception du fichier quotes.json :", error);
        // Solution de secours au cas où le fichier est manquant
        autonomousQuotes = ["[HOPE] : Liaison synaptique stable. Capsule opérationnelle."];
    }
}

// APPEL AU CHARGEMENT (À glisser tout en bas de ton script, ou dans ton DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    loadAutonomousQuotes().then(() => {
        startIdleGallery(); // Relance ta galerie une fois les textes prêts
    });
});

// =======================================================================
// CONFIGURATION DE LA BANQUE D'IMAGES (ALICE VISUALS)
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

// Fonction pour changer l'image avec un effet de fondu propre
// Fonction sécurisée pour changer l'image sans faire planter le moteur
function changeAvatarImage(url) {
    const avatar = document.getElementById('hope-visual-avatar');
    
    if (avatar) {
        avatar.style.backgroundImage = `url('${url}')`;
    } else {
        // Log de diagnostic pour t'indiquer exactement ce que le script voit
        console.warn("[HDO SYSTEM] : L'élément HTML '#hope-visual-avatar' est introuvable dans le DOM.");
    }
}

// Lance le défilement automatique des visuels d'Alice en mode veille
function startIdleGallery() {
    if (idleInterval) return; 
    
    changeAvatarImage(idleImages[currentIdleIndex]);
    
    idleInterval = setInterval(() => {
        currentIdleIndex = (currentIdleIndex + 1) % idleImages.length;
        changeAvatarImage(idleImages[currentIdleIndex]);
    }, 600000);
}

// Arrête la galerie pour figer l'image d'interaction
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
    } else {
        sethopeState("idle");
        userInput.value = "";
        startIdleGallery();
    }
}

// =======================================================================
// ENVOI ET TRAITEMENT DES LOGIQUES DE DIALOGUE
// =======================================================================
function triggerhopeResponse() {
    const cmd = userInput.value.trim();
    if (!cmd) return;

    lastInteractionTime = Date.now();
    userInput.value = "";

    sethopeState("thinking");
    outputText.textContent = `[Analyse] : Traitement de la commande en cours...`;

    setTimeout(() => {
        if(cmd=="end"){ sethopeState("panique");
            outputText.textContent = `[HOPE] : Commande "${cmd}" interdite. tu ne fait pas deux fois la meme erreur non !? Alors ne lache pas elle t'attend quelque part!`;
        }
        else{sethopeState("speaking");
            outputText.textContent = `[HOPE] : Commande "${cmd}" compilée. Le protocole répond parfaitement.`;
        }

        setTimeout(() => {
            if (terminal.classList.contains('open')) {
                sethopeState("listening");
            } else {
                sethopeState("idle");
            }
            // outputText.textContent = "";
        }, 3500);
    }, 1200);
}

sendBtn.addEventListener('click', triggerhopeResponse);
userInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') triggerhopeResponse();

});

// Cycle autonome d'inactivité (Ping Émotionnel calibré à 15s)
// =======================================================================
// MOTEUR D'INTERCEPTION MULTICAST RECURSIF (ORGANIC DELAY)
// =======================================================================
function triggerAutonomousPing() {
    // Si l'utilisateur est en train de parler ou que le terminal est déjà ouvert manuellement, on passe notre tour
    if (currentMode !== "idle" || autonomousQuotes.length === 0) {
        currentPingTimeout = setTimeout(triggerAutonomousPing, 2000);
        return;
    }

    lastInteractionTime = Date.now();
    sethopeState("speaking");
    terminal.classList.add('open');
    
    // On affiche les boutons de contrôle radio
    if (radioControls) radioControls.style.display = "flex";

    // ÉXÉCUTION : On pioche un flux. 
    // Si le Boost est activé, on cible PRIORITAIREMENT les dialogues croisés ("|")
    let avaliableQuotes = autonomousQuotes;
    if (isSignalBoosted) {
        const dialogues = autonomousQuotes.filter(q => q.includes("|"));
        if (dialogues.length > 0) avaliableQuotes = dialogues;
    }

    const randomQuote = avaliableQuotes[Math.floor(Math.random() * avaliableQuotes.length)];
    outputText.textContent = randomQuote;

    // IMPORTANT : On NE met PAS de setTimeout pour fermer automatiquement !
    // Le terminal reste figé comme une notification tant que le Major n'appuie pas sur "Acquitter"
}

// Fonction de planification (Variance de temps)
function planNextPing() {
    // Si le boost est activé, on enchaîne TOUTES LES 4 À 8 SECONDES !
    // Sinon, rythme normal (15s à 35s)
    const BASE_MIN_DELAY = isSignalBoosted ? 2000 : 8000; 
    const RANDOM_BONUS_MAX = isSignalBoosted ? 500 : 4000; 

    const nextDynamicDelay = BASE_MIN_DELAY + Math.floor(Math.random() * RANDOM_BONUS_MAX);
    
    console.log(`[HDO RADIO] : Fréquence calée. Prochain scan dans ${(nextDynamicDelay / 1000).toFixed(1)}s.`);
    currentPingTimeout = setTimeout(triggerAutonomousPing, nextDynamicDelay);
}

// =======================================================================
// ÉCOUTEURS D'ÉVÉNEMENTS DES BOUTONS NARRATIFS
// =======================================================================

// 1. Bouton Acquitter (Ferme le message et relance la montre)
radioClearBtn.addEventListener('click', () => {
    sethopeState("idle");
    terminal.classList.remove('open');
    if (radioControls) radioControls.style.display = "none";
    
    // Le message est lu, on replanifie la prochaine interception
    lastInteractionTime = Date.now();
    planNextPing();
});

// 2. Bouton Boost Signal (Surchauffe les fréquences pour enchaîner l'histoire)
radioBoostBtn.addEventListener('click', () => {
    isSignalBoosted = !isSignalBoosted;
    
    if (isSignalBoosted) {
        radioBoostBtn.textContent = "📡 BOOST[MAX]";
        radioBoostBtn.style.borderColor = "var(--hdo-gold)";
        radioBoostBtn.style.color = "var(--hdo-gold)";
        
        // Si le terminal est fermé lors du clic, on force un ping immédiat
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


// INITIALISATION DU SYSTÈME AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    loadAutonomousQuotes().then(() => {
        startIdleGallery();
        
        // INITIALISATION DU MOTEUR TEMPOREL
        planNextPing(); 
    });
});




// Moteur de nettoyage de texte pour la synthèse vocale
function speakMatrixLog(text) {
    if (!('speechSynthesis' in window)) return; // Sécurité si non supporté

    // On coupe la parole en cours s'il y en a une pour éviter les superpositions
    window.speechSynthesis.cancel();

    // NETTOYAGE NARRATIF : On retire les balises techniques pour la voix
    let cleanText = text
        .replace(/\[HOPE\] 'Interception.*?' :/g, 'Interception.')
        .replace(/\[INTERCEPTION DIALOGUE\]/g, 'Alerte flux croisé.')
        .replace(/\[.*?\] :/g, '') // Enlève les [MAJOR] :, [ALICE] :
        .replace(/\|/g, '... de son côté, s\'exclame :'); // Rend les dialogues fluides

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configuration de la voix
    utterance.lang = 'fr-FR'; // On force la langue française
    utterance.pitch = .9;    // Un pitch légèrement plus bas pour un effet capsule radio
    utterance.rate = 1.8;     // Une vitesse de diction très légèrement militaire/rapide

    window.speechSynthesis.speak(utterance);
}

// MISE À JOUR DE TON PROTOCOLE D'INTERCEPTION EXISTANT
function triggerAutonomousPing() {
    if (currentMode !== "idle" || autonomousQuotes.length === 0) {
        currentPingTimeout = setTimeout(triggerAutonomousPing, 2000);
        return;
    }

    lastInteractionTime = Date.now();
    sethopeState("speaking");
    terminal.classList.add('open');
    
    if (radioControls) radioControls.style.display = "flex";

    let avaliableQuotes = autonomousQuotes;
    if (isSignalBoosted) {
        const dialogues = autonomousQuotes.filter(q => q.includes("|"));
        if (dialogues.length > 0) avaliableQuotes = dialogues;
    }

    const randomQuote = avaliableQuotes[Math.floor(Math.random() * avaliableQuotes.length)];
    outputText.textContent = randomQuote;

    // --- LOGIQUE TOGGLE VOCAL AUTOMATIQUE ---
    if (isVocalEnabled) {
        speakMatrixLog(randomQuote);
    }
}

// =======================================================================
// ÉCOUTEURS D'ÉVÉNEMENTS VOCAUX
// =======================================================================

// 1. Gestionnaire du bouton Toggle
radioVocalBtn.addEventListener('click', () => {
    isVocalEnabled = !isVocalEnabled;
    
    if (isVocalEnabled) {
        radioVocalBtn.textContent = "🔊[ON  ]";
        radioVocalBtn.style.borderColor = "#00bf33"; // Vert quand c'est actif
        radioVocalBtn.style.color = "#00bf33";
        
        // Parle immédiatement pour le log actuellement affiché à l'écran
        speakMatrixLog(outputText.textContent);
    } else {
        radioVocalBtn.textContent = "🔊[OFF]";
        radioVocalBtn.style.borderColor = "";
        radioVocalBtn.style.color = "";
        window.speechSynthesis.cancel(); // Coupe la parole immédiatement
    }
});

// 2. LECTURE MANUELLE : Si on clique directement sur le texte du terminal
outputText.style.cursor = "pointer"; // Indique au Major qu'on peut cliquer dessus
outputText.addEventListener('click', () => {
    // Permet de lire à la demande, même si le mode automatique est sur OFF
    speakMatrixLog(outputText.textContent);
});

// Pense à couper le son si le Major acquitte le message avant la fin de la dictée
radioClearBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    // Ton code d'acquittement existant...
});




// INTERPRÉTEUR DE COMMANDES HDO
function processCommand(rawInput) {
    const command = rawInput.trim().toLowerCase();
    
    switch(command) {
        case 'hub':
            // COMMANDE : Afficher la grille numérique 3x3
            sethopeState("speaking");
            outputText.textContent = "[HOPE] : Déploiement du HUB Tactique. Réseau multicast synchronisé, MAJOR.";
            hubGrid.style.display = "grid";
            
            // OPTIONNEL : Si tu es sur Electron, on agrandit la fenêtre pour laisser passer le HUB
            if (typeof require !== 'undefined') {
                require('electron').ipcRenderer.send('resize-window', { width: 350, height: 700 });
            }
            break;
            
        case 'end':
            // Ton ancienne commande de test pour le mode alerte
            sethopeState("panique");
            outputText.textContent = "[WARNING] : Protocole d'urgence activé. Isolement du secteur.";
            break;
            
        case 'clear':
            // Efface le terminal et ferme le hub
            outputText.textContent = "[HOPE] : Terminal réinitialisé.";
            hubGrid.style.display = "none";
            break;
            
        default:
            // Si la commande n'existe pas, on laisse l'IA (ou ton script de base) répondre normalement
            outputText.textContent = `[HOPE] : Commande '${command}' inconnue ou privilèges insuffisants.`;
    }
}

// Intercepter l'événement d'envoi existant de ton formulaire/input
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const value = userInput.value;
        if (value.length > 0) {
            processCommand(value);
            userInput.value = ""; // Vide l'entrée
        }
    }
});

// =======================================================================
// ACTIONS DES TOUCHES DU HUB
// =======================================================================

// Bouton de fermeture du HUB
hubCloseBtn.addEventListener('click', () => {
    hubGrid.style.display = "none";
    outputText.textContent = "[HOPE] : HUB déconnecté. Retour en veille.";
    sethopeState("idle");
    
    if (typeof require !== 'undefined') {
        require('electron').ipcRenderer.send('resize-window', { width: 250, height: 250 });
    }
});

// Touche Major Inventory
hubInventory.addEventListener('click', () => {
    outputText.textContent = "[MAJOR] : Inventaire tactique indisponible. En attente de synchronisation avec le stock.";
    // Ici tu pourras faire un window.open() ou injecter ton module d'inventaire plus tard !
});