// Variable globale qui stockera les commandes récupérées du Sheets au démarrage
const SHEET_CMD_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmKXQY8TtwC-9W8rmYqrTJgIfPp1oFuWCMsxunCk4XdJtPFxTtmphav0mjzUTFuH34YychmCG_A8y/pub?gid=1674704311&single=true&output=csv";
let dictionnaireCommandes = []; 

async function chargerOpsCmdDepuisSheets() {
    try {
        const response = await fetch(SHEET_CMD_URL);
        const text = await response.text();
        
        // Si tu as exporté en CSV (séparé par des virgules) :
        dictionnaireCommandes = parseCSVToCommandes(text);
        
        console.log(`[HDO CLOUD] : ${dictionnaireCommandes.length} commandes d'action synchronisées.`);
    } catch (error) {
        console.error("[ERREUR CLOUD] : Impossible de charger l'onglet Ops_CMD :", error);
    }
}

// Petit moteur ultra-léger pour découper ton CSV ligne par ligne
function parseCSVToCommandes(csvText) {
    const lignes = csvText.split('\n');
    const resultat = [];
    
    // On commence à 1 pour sauter la ligne des entêtes (Keyword, Type, etc.)
    for (let i = 1; i < lignes.length; i++) {
        if (!lignes[i].trim()) continue;
        
        // Découpage par les virgules (en gérant les éventuels espaces)
        const colonnes = lignes[i].split(',');
        
        resultat.push({
            keyword: colonnes[0]?.trim().toLowerCase(),
            type: colonnes[1]?.trim().toLowerCase(),
            payload: colonnes[2]?.trim(),
            responseText: colonnes[3]?.trim(),
            state_hop: colonnes[4]?.trim().toLowerCase() // Ta nouvelle colonne d'état émotionnel !
        });
    }
    return resultat;
}