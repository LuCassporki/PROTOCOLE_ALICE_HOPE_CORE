         const anchor = document.getElementById('hope-grid-anchor');
        const essence = document.getElementById('hope-essence');
        const bubble = document.getElementById('hope-bubble');
        const terminal = document.getElementById('hope-terminal');
        const stateText = document.getElementById('hope-state-text');
        const titleText = document.getElementById('sys-title');
        const outputText = document.getElementById('hope-output-text');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const netTag = document.getElementById('network-tag');

        let lastInteractionTime = Date.now();
        let currentMode = "idle";

        const autonomousQuotes = [
            "[HOPE] : Diagnostic autonome effectué. Tout est nominal, Alexander.",
            "[HOPE] : Les flux d'énergie de la matrice HDO sont stables.",
            "[HOPE] : Système en veille active. J'attends tes instructions.",
            "[HOPE] : Liaison synaptique stable. Capsule parée à l'exécution."
        ];

        function sethopeState(mode) {
            currentMode = mode;
            anchor.classList.remove('state-listening', 'state-thinking', 'state-speaking');
            essence.classList.remove('speaking');

            if (mode === "idle") {
                stateText.textContent = "SYSTEM // IDLE";
                stateText.style.color = "#00f0ff";
                titleText.style.color = "#00f0ff";
                netTag.textContent = "STABLE"; netTag.style.color = "#00f0ff";
            } 
            else if (mode === "listening") {
                anchor.classList.add('state-listening');
                stateText.textContent = "CORE // LISTENING";
                stateText.style.color = "#ff007f";
                titleText.style.color = "#ff007f";
            } 
            else if (mode === "thinking") {
                anchor.classList.add('state-thinking');
                stateText.textContent = "MATRIX // COMPILING";
                stateText.style.color = "#ffea00";
                titleText.style.color = "#ffea00";
                netTag.textContent = "PROCESSING"; netTag.style.color = "#ffea00";
            } 
            else if (mode === "speaking") {
                anchor.classList.add('state-speaking');
                essence.classList.add('speaking');
                stateText.textContent = "VOICE // TRANSMITTING";
                stateText.style.color = "#00bf33";
                titleText.style.color = "#00bf33";
                netTag.textContent = "LIVE"; netTag.style.color = "#00bf33";
            }
        }

        bubble.addEventListener('click', () => {
            const isOpen = terminal.classList.toggle('open');
            lastInteractionTime = Date.now();
            
            if (isOpen) {
                sethopeState("listening");
                outputText.textContent = "[HOPE] : Écoute active en ligne. J'analyse tes requêtes, MAJOR.";
            } else {
                sethopeState("idle");
                userInput.value = "";
            }
        });

        function triggerhopeResponse() {
            const cmd = userInput.value.trim();
            if (!cmd) return;

            lastInteractionTime = Date.now();
            userInput.value = "";

            sethopeState("thinking");
            outputText.textContent = `[Analyse] : Traitement de la commande en cours...`;

            setTimeout(() => {
                sethopeState("speaking");
                outputText.textContent = `[HOPE] : Commande "${cmd}" compilée. Le protocole répond parfaitement.`;

                setTimeout(() => {
                    if (terminal.classList.contains('open')) {
                        sethopeState("listening");
                    } else {
                        sethopeState("idle");
                    }
                }, 3500);
            }, 1200);
        }

        sendBtn.addEventListener('click', triggerhopeResponse);
        userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerhopeResponse(); });

        // Cycle autonome d'inactivité (Ping Émotionnel calibré à 15s)
        setInterval(() => {
            const timeSinceLastAction = Date.now() - lastInteractionTime;
            if (timeSinceLastAction > 15000 && currentMode === "idle") {
                lastInteractionTime = Date.now();
                sethopeState("speaking");
                const randomQuote = autonomousQuotes[Math.floor(Math.random() * autonomousQuotes.length)];
                outputText.textContent = randomQuote;

                setTimeout(() => {
                    if (currentMode === "speaking") sethopeState("idle");
                }, 4000);
            }
        }, 1000);