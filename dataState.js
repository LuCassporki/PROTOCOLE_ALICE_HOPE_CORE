// Variable globale pour stocker la configuration des états
const STATES_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmKXQY8TtwC-9W8rmYqrTJgIfPp1oFuWCMsxunCk4XdJtPFxTtmphav0mjzUTFuH34YychmCG_A8y/pub?gid=1201070346&single=true&output=csv";
let dictionnaireEtats = [];

window.chargerOpsStatesDepuisSheets = async function() {
    try {
        const response = await fetch(STATES_SHEET_URL);
        const text = await response.text();
        dictionnaireEtats = parseCSVToEtats(text);
        console.log(`[HDO MATRICE] : ${dictionnaireEtats.length} états visuels synchronisés.`);
    } catch (error) {
        console.error("[ERREUR MATRICE] : Impossible de charger l'onglet Ops_States :", error);
    }
};


function parseCSVToEtats(csvText) {
    const lignes = csvText.split('\n');
    const resultat = [];
    
    for (let i = 1; i < lignes.length; i++) {
        if (!lignes[i].trim()) continue;
        
        // Découpage et nettoyage de sécurité
        const col = lignes[i].split(',').map(cellule => cellule.replace(/["']/g, "").trim());
        
        // LE MOUCHARD : Il va t'afficher l'index exact de chaque colonne pour l'état en cours
        if (i === 1) {
            console.log("[HDO SENSOR] Analyse de la ligne 1 du Sheets :", col);
        }

        // Configuration dynamique basée sur les logs d'erreurs précédents
        // Si '5s' ou '1s' arrive dans col[3] ou col[4], on réaligne l'image là où elle est vraiment.
        // On cherche automatiquement quelle case contient l'extension d'image '.png' ou '.jpg'
        const indiceImage = col.findIndex(c => c.includes('.png') || c.includes('.jpg'));
        
        resultat.push({
            name: col[0]?.toLowerCase(),
            ringColor: col[1],
            auraColor: col[2],
            pulseSpeed: col[3],
            ringRotation: col[4],
            alertStyle: col[5],
            alertColor: col[6],
            // Si on trouve une case avec .png/.jpg, on la prend, sinon on se rabat sur l'index 7
            imageName: indiceImage !== -1 ? col[indiceImage] : col[7]
        });
    }
    return resultat;
}