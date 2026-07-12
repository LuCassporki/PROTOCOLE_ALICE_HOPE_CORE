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

let lastInteractionTime = Date.now();
let currentMode = "idle";

// VARIABLES POUR LE DRAG SMART SANS INTERCEPTION
let isMouseDown = false;
let startTime = 0;
let startX, startY;

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
    // ÉTAPES PARAMÈTRES (Ajustables en millisecondes)
    const BASE_MIN_DELAY = 15000; // 15 secondes minimum obligatoires entre deux messages
    const RANDOM_BONUS_MAX = 20000; // Jusqu'à 20 secondes de bonus aléatoire (donc entre 15s et 35s d'écart)

    const timeSinceLastAction = Date.now() - lastInteractionTime;

    // Si le système est en veille et que le temps minimum depuis la dernière action (clic ou ping) est respecté
    if (timeSinceLastAction >= BASE_MIN_DELAY && currentMode === "idle" && autonomousQuotes.length > 0) {
        
        lastInteractionTime = Date.now();
        sethopeState("speaking");
        terminal.classList.add('open');

        // Extraction du flux radio
        const randomQuote = autonomousQuotes[Math.floor(Math.random() * autonomousQuotes.length)];
        outputText.textContent = randomQuote;

        // Temps d'affichage du message avant fermeture (3,5 secondes)
        setTimeout(() => {
            if (currentMode === "speaking") {
                sethopeState("idle");
            }
            terminal.classList.remove('open');
            
            // PROGRAMMATION DE LA PROCHAINE INTERCEPTION (Relance après la fermeture)
            planNextPing();
        }, 5000);

    } else {
        // Si les conditions n'étaient pas réunies, on revérifie un peu plus tard (boucle de garde courte)
        setTimeout(triggerAutonomousPing, 2000);
    }
}

// Fonction de calcul de la variance temporelle
function planNextPing() {
    const BASE_MIN_DELAY = 15000; 
    const RANDOM_BONUS_MAX = 20000; 

    // Calcul mathématique : 15000 + (0 à 1) * 20000
    const nextDynamicDelay = BASE_MIN_DELAY + Math.floor(Math.random() * RANDOM_BONUS_MAX);
    
    console.log(`[HDO SYSTEM] : Prochaine interception programmée dans ${(nextDynamicDelay / 1000).toFixed(1)} secondes.`);
    
    setTimeout(triggerAutonomousPing, nextDynamicDelay);
}

// INITIALISATION DU SYSTÈME AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    loadAutonomousQuotes().then(() => {
        startIdleGallery();
        
        // INITIALISATION DU MOTEUR TEMPOREL
        planNextPing(); 
    });
});