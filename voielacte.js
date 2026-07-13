// =======================================================================
// MODULE VOIE LACTÉE : MOTEUR VOCAL EN CONTINU (BILINGUE & COUPLAGE SWITCH)
// =======================================================================

class VoieLacteeEngine {
    constructor() {
        this.recognition = null;
        this.isActive = false;         // Mode écoute ON/OFF
        this.isEnglishStrict = false;  // Faux = Bilingue automatique, Vrai = Anglais Strict
        this.silenceTimeout = null;
        this.silenceDelay = 1500;
        
        this.toggleBtn = document.getElementById('radio-vocal-input-btn');
        this.langBtn = document.getElementById('radio-lang-switch-btn'); // Notre nouveau bouton
        this.userInput = document.getElementById('user-input');

        this.initSpeechRecognition();
        this.bindEvents();
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("[VOIE LACTÉE] : L'API de reconnaissance vocale est indisponible sur cette plateforme.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        // Configuration par défaut de l'écoute bilingue (Essai de capture des deux flux)
        this.recognition.lang = 'fr-FR'; 

        this.recognition.onstart = () => console.log("[VOIE LACTÉE] : Capteurs acoustiques en ligne.");
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();
    }

    bindEvents() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                this.isActive = !this.isActive;
                if (this.isActive) {
                    this.toggleBtn.textContent = "🎙️[LIVE]";
                    this.toggleBtn.style.borderColor = "var(--hdo-code, #2bff00)";
                    this.toggleBtn.style.background = "#006d0fbb";
                    this.toggleBtn.style.color = "var(--hdo-cyan, #00f0ff)";
                    this.startEngine();
                } else {
                    this.toggleBtn.textContent = "🎙️[OFF]";
                    this.toggleBtn.style.borderColor = " #000000";
                    this.toggleBtn.style.background = "#500000da";
                    this.toggleBtn.style.color = "#ff3939";
                    this.stopEngine();
                }
            });
        }

        // 🔥 GESTION DU 5ÈME BOUTON : INTERRUPTEUR DE FRÉQUENCE LINGUISTIQUE
        if (this.langBtn) {
            this.langBtn.addEventListener('click', () => {
                this.isEnglishStrict = !this.isEnglishStrict;
                
                if (this.isEnglishStrict) {
                    this.langBtn.textContent = "🇺🇸 LANG[EN]";
                    this.langBtn.style.borderColor = "var(--hdo-gold, #ffb700)";
                    this.langBtn.style.color = "#ffffff";
                } else {
                    this.langBtn.textContent = "🌍 LANG[FR]";
                    this.langBtn.style.borderColor = "";
                    this.langBtn.style.color = "#0014c7";
                }

                // Si le micro est déjà en train d'écouter, on le redémarre à chaud 
                // pour appliquer instantanément la nouvelle configuration de langue
                if (this.isActive) {
                    console.log("[VOIE LACTÉE] : Changement de langue détecté en direct. Re-calibrage des capteurs...");
                    this.recognition.stop(); // handleEnd s'occupera de la relancer avec le bon paramètre
                }
            });
        }

        if (this.userInput) {
            this.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.isActive) {
                    clearTimeout(this.silenceTimeout);
                }
            });
        }
    }

    startEngine() {
        if (!this.recognition) return;
        try {
            // 🔥 ALLOCATION CONFIGURATION LANGUE AVANT DÉMARRAGE
            if (this.isEnglishStrict) {
                this.recognition.lang = 'en-US'; // Anglais pur sans compromis
                console.log("[VOIE LACTÉE] : Canal verrouillé sur ANGLAIS STRICT (en-US).");
            } else {
                // Tente d'écouter le français d'abord mais accepte l'anglais via le moteur Chromium bilingue
                this.recognition.lang = 'fr-FR'; 
                console.log("[VOIE LACTÉE] : Canal configuré en HYBRIDE AUTOMATIQUE (Priorité fr-FR).");
            }

            this.recognition.start();
            if (typeof window.sethopeState === "function") {
                window.sethopeState("listening");
            }
        } catch (error) {
            console.error("[VOIE LACTÉE] : Erreur d'initialisation du flux d'écoute :", error);
        }
    }

    stopEngine() {
        if (!this.recognition) return;
        clearTimeout(this.silenceTimeout);
        this.recognition.stop();
        if (typeof window.sethopeState === "function") {
            window.sethopeState("idle");
        }
    }

    handleResult(event) {
        clearTimeout(this.silenceTimeout);
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal || event.results[i][0].confidence > 0.15) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (this.userInput && finalTranscript.trim()) {
            this.userInput.value = finalTranscript.trim();
        }

        this.silenceTimeout = setTimeout(() => {
            const commandToSend = this.userInput.value.trim();
            if (commandToSend && typeof window.processCommand === "function") {
                console.log(`[VOIE LACTÉE] : Envoi automatique de la directive : "${commandToSend}"`);
                window.processCommand(commandToSend);
                
                setTimeout(() => {
                    if (this.userInput) this.userInput.value = "";
                }, 100);
            }
        }, this.silenceDelay);
    }

    handleError(event) {
        if (event.error !== 'no-speech') {
            console.warn(`[VOIE LACTÉE] : Interruption de liaison acoustique (${event.error})`);
        }
    }

    handleEnd() {
        // Redémarrage automatique si le scan est toujours actif
        if (this.isActive) {
            this.startEngine(); // Utilise startEngine pour ré-allouer la bonne langue si elle a changé
        }
    }
}

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.hdoVoieLactee = new VoieLacteeEngine();
});