// =======================================================================
// DOM ANCHORS & CORE VARIABLES
// ======================================================================= 
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

// Variables d'état fondamentales
let lastInteractionTime = Date.now();
let currentMode = "idle";
let autonomousQuotes = [];

// Variables de contrôle Radio, Vocal & Minuterie
let isSignalBoosted = false;
let isVocalEnabled = false;
let currentPingTimeout = null;

// Variables pour le Drag Smart & Clic unifié
let isMouseDown = false;
let startTime = 0;
let startX, startY;
let hasMoved = false;

// Check si environnement Electron existant
const isElectron = typeof window !== 'undefined' && typeof window.process !== 'undefined' && window.process.versions && window.process.versions.electron && typeof require !== 'undefined';
const ipcRenderer = isElectron ? require('electron').ipcRenderer : null;

// Exposer la fonction de transparence au niveau global de la fenêtre
window.electronAPI_setIgnore = (ignore) => {
    if (isElectron && ipcRenderer) {
        ipcRenderer.send('set-ignore-mouse', ignore);
    }
};

// =======================================================================
// CONFIGURATION DE LA BANQUE D'IMAGES (ALICE & HOPE VISUALS)
// =======================================================================
let idleInterval = null;
let id = 1;

function changeAvatarImage(url) {
    const avatar = document.getElementById('hope-visual-avatar');
    id = Math.floor(Math.random() * 110) + 1;
    if (avatar) {
        avatar.style.backgroundImage = `url('${url}')`;
    } else {
        console.warn("[HDO WARNING] : L'élément HTML '#hope-visual-avatar' est introuvable dans le DOM.");
    }
}

window.startIdleGallery = function() {
    if (idleInterval) return; 
    changeAvatarImage(`media/alice/${id}-fragment.png`);
    idleInterval = setInterval(() => {
        changeAvatarImage(`media/alice/${id}-fragment.png`);
    }, 5000);
};

function stopIdleGallery() {
    if (idleInterval) {
        clearInterval(idleInterval);
        idleInterval = null;
    }
}

// =======================================================================
// GESTIONNAIRE UNIFIÉ : DRAG FENÊTRE & CLIC BULLE (SOURIS & TACTILE)
// =======================================================================
if (bubble) {
    bubble.style.cursor = 'grab';
    bubble.style.touchAction = 'none'; // Empêche les conflits de scroll natif sur mobile

    function startDragOrClick(clientX, clientY) {
        isMouseDown = true;
        startTime = Date.now();
        hasMoved = false;
        startX = clientX;
        startY = clientY;
    }

    function onDragMove(clientX, clientY) {
        if (!isMouseDown) return;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            hasMoved = true;
            if (isElectron && ipcRenderer) {
                // Déplacement natif de la fenêtre Electron d'un écran à l'autre
                ipcRenderer.send('move-window', { deltaX, deltaY });
            }
            startX = clientX;
            startY = clientY;
        }
    }

    function endDragOrClick() {
        if (!isMouseDown) return;
        isMouseDown = false;

        const clickDuration = Date.now() - startTime;
        
        // Si le clic a duré moins de 250ms et qu'on n'a pas bougé la fenêtre : VRAI CLIC !
        if (clickDuration < 250 && !hasMoved) {
            triggerInteractionHop();
        }
    }

    // Événements Souris
    bubble.addEventListener('mousedown', (e) => startDragOrClick(e.screenX, e.screenY));
    window.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            // Pour le déplacement global de la fenêtre via IPC, on privilégie screenX/Y
            // Mais pour une fluidité web pure si hors electron, delta screenX/Y fonctionne aussi
            onDragMove(e.screenX, e.screenY);
        }
    });
    window.addEventListener('mouseup', endDragOrClick);

    // Événements Tactiles (Mobile / Tablettes)
    bubble.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            startDragOrClick(e.touches[0].screenX, e.touches[0].screenY);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (isMouseDown && e.touches.length === 1) {
            onDragMove(e.touches[0].screenX, e.touches[0].screenY);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', endDragOrClick);
}

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

// Lancement global au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    if (isElectron && ipcRenderer) {
        ipcRenderer.send('resize-window', { width: 250, height: 250 }); // Mode veille par défaut
    }
    loadAutonomousQuotes().then(async () => {
        window.startIdleGallery();
        planNextPing();
        
        await Promise.all([
            chargerOpsCmdDepuisSheets(),
            chargerOpsStatesDepuisSheets()
        ]);
    });
});

// =======================================================================
// SYSTEM STATE MANAGER (MATRICE DES ÉTATS)
// =======================================================================
function sethopeState(mode) {
    currentMode = mode;
    
    if (mode === "idle") {
        netTag.textContent = "STABLE"; 
        netTag.style.color = "#00f0ff";
        
        document.documentElement.style.setProperty('--essence-bg', 'linear-gradient(135deg, #00f0ff 0%, #440099 100%)');
        document.documentElement.style.setProperty('--essence-shadow', '0 0 30px rgba(0, 240, 255, 0.2)');
        document.documentElement.style.setProperty('--essence-morph-speed', '3s');
        document.documentElement.style.setProperty('--essence-scale', 'scale(1)');
        document.documentElement.style.setProperty('--ring-color', '');
        document.documentElement.style.setProperty('--ring-filter', 'drop-shadow(0 0 15px transparent)');
        document.documentElement.style.setProperty('--avatar-opacity', '1');
        document.documentElement.style.setProperty('--avatar-filter', 'drop-shadow(0 0 0px transparent)');
        document.documentElement.style.setProperty('--avatar-scale', 'scale(1)');

        for (let i = 1; i <= 4; i++) {
            const ring = document.querySelector(`.hope-ring${i}`);
            if (ring) ring.style.animationDuration = "12s, 15s";
        }
        
        essence.classList.remove('active-signal');
        window.startIdleGallery();
        return;
    }

    stopIdleGallery();
    
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

    document.documentElement.style.setProperty('--ring-color', config.ringColor);
    document.documentElement.style.setProperty('--ring-filter', `drop-shadow(0 0 25px ${config.ringColor})`);
    
    document.documentElement.style.setProperty('--essence-bg', `linear-gradient(135deg, ${config.auraColor} 0%, #100020 100%)`);
    document.documentElement.style.setProperty('--essence-shadow', `0 0 40px ${config.auraColor}`);
    document.documentElement.style.setProperty('--essence-morph-speed', config.pulseSpeed);

    for (let i = 1; i <= 4; i++) {
        const ring = document.querySelector(`.hope-ring${i}`);
        if (ring && config.ringRotation) {
            const pulseDuration = (i % 2 === 0) ? "2s" : "4s";
            ring.style.animationDuration = `${pulseDuration}, ${config.ringRotation}`;
        }
    }

    if (mode === "speaking") {
        essence.classList.add('speaking');
    } else {
        essence.classList.remove('speaking');
    }

    if (config.alertStyle) {
        netTag.textContent = config.alertStyle.toUpperCase();
    }
    if (config.alertColor) {
        netTag.style.color = config.alertColor;
    }

    if (config.imageName) {
        changeAvatarImage(`media/hope/${config.imageName}`);
    }

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

function triggerInteractionHop() {
    const isOpen = terminal.classList.toggle('open');
    lastInteractionTime = Date.now();
    
    if (isOpen) {
        sethopeState("listening");
        outputText.textContent = "[HOPE] : Écoute active en ligne. J'analyse tes requêtes, MAJOR.";
        if (isElectron && ipcRenderer) ipcRenderer.send('resize-window', { width: 300, height: 500 });
    } else {
        sethopeState("idle");
        userInput.value = "";
        if (radioControls) radioControls.style.display = "flex";
        if (isElectron && ipcRenderer) ipcRenderer.send('resize-window', { width: 200, height: 200 });
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
    
    const essenceCentrale = document.getElementById('hope-essence');

    utterance.onstart = () => {
        if (essenceCentrale) essenceCentrale.classList.add('active-signal');
    };

    utterance.onend = () => {
        if (essenceCentrale) essenceCentrale.classList.remove('active-signal');
    };

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
    if (isElectron && ipcRenderer) ipcRenderer.send('resize-window', { width: 300, height: 500 });

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
    currentPingTimeout = setTimeout(triggerAutonomousPing, nextDynamicDelay);
}

// Écouteurs de la barre de contrôle radio
radioClearBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    sethopeState("idle");
    terminal.classList.remove('open');
    if (radioControls) radioControls.style.display = "flex";
    if (isElectron && ipcRenderer) ipcRenderer.send('resize-window', { width: 300, height: 500 });
    
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

    switch(cleanCmd) {
        case 'end':
            sethopeState("panique");
            outputText.textContent = `[HOPE] : Commande "${command}" interdite. Tu ne fais pas deux fois la même erreur, non !? Alors ne lâche pas, elle t'attend quelque part !`;
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


function syncWindowSizeToContent() {
    if (!isElectron) {
        console.log("[HDO MOBILE] : Mode web actif. Redimensionnement Electron ignoré.");
        return; 
    }

    setTimeout(() => {
        const currentWidth = document.body.scrollWidth + 20;
        const currentHeight = document.body.scrollHeight + 20;
        console.log(`[HDO AUTO-RESIZE] : Ajustement de la capsule -> ${currentWidth}x${currentHeight}px`);
        if (ipcRenderer) {
            ipcRenderer.send('resize-window', { width: currentWidth, height: currentHeight });
        }
    }, 50);
}