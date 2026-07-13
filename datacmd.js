// Variable globale qui stockera les commandes récupérées du Sheets au démarrage
let dictionnaireCommandes = []; 

function interpreterCommande(inputUtilisateur) {
    const commandeNettoyee = inputUtilisateur.trim().toLowerCase();

    // 1. Recherche du mot-clé dans le dictionnaire Sheets
    const commandeTrouvee = dictionnaireCommandes.find(cmd => cmd.keyword === commandeNettoyee);

    if (!commandeTrouvee) {
        afficherDansTerminal("Commande inconnue au bataillon.");
        return;
    }

    // 2. Traitement si c'est un LIEN
    if (commandeTrouvee.type === 'link') {
        afficherDansTerminal(commandeTrouvee.responseText);
        window.open(commandeTrouvee.payload, '_blank');
    } 
    
    // 3. Traitement si c'est une FONCTION
    else if (commandeTrouvee.type === 'function') {
        afficherDansTerminal(commandeTrouvee.responseText);
        
        // Magie JavaScript : appelle la fonction globale portant ce nom précis
        if (typeof window[commandeTrouvee.payload] === "function") {
            window[commandeTrouvee.payload]();
        } else {
            afficherDansTerminal(`Erreur : La fonction '${commandeTrouvee.payload}' n'est pas codée dans le script.`);
        }
    }
}

// --- Exemples de fonctions locales appelables par le Sheets ---
function executerShutdown() {
    // Si on est sur Electron, on peut envoyer un signal IPC pour éteindre
    console.log("Exécution de la routine d'extinction...");
}

function nettoyerConsole() {
    document.getElementById('terminal-content').innerHTML = '';
}