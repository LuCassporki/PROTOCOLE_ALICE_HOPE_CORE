// https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmKXQY8TtwC-9W8rmYqrTJgIfPp1oFuWCMsxunCk4XdJtPFxTtmphav0mjzUTFuH34YychmCG_A8y/pub?output=csv

// =======================================================================
// ANCRAGE DE L'ONGLET MAÎTRE GOOGLE SHEETS (EXPORT CSV DE L'ONGLET FLOWER)
// =======================================================================
// Remplace cette URL par le lien CSV spécifique à ton onglet "Boutons_Flower"
const SHEET_FLOWER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmKXQY8TtwC-9W8rmYqrTJgIfPp1oFuWCMsxunCk4XdJtPFxTtmphav0mjzUTFuH34YychmCG_A8y/pub?gid=757852763&single=true&output=csv";

// Fonction de parsing CSV sécurisée (gère les colonnes, les espaces et les sauts de ligne)
async function fetchAndParseSheet(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Découpage des lignes en évitant les retours à la ligne parasites
        const lines = text.split(/\r?\n/).map(line => line.split(','));
        const headers = lines[0].map(h => h.trim());
        
        return lines.slice(1).map(line => {
            let rowObj = {};
            headers.forEach((header, index) => {
                rowObj[header] = line[index] ? line[index].trim() : "";
            });
            return rowObj;
        });
    } catch (error) {
        console.error("[HDO NETWORK] : Échec d'interception de l'axe Sheets :", error);
        return [];
    }
}

// =======================================================================
// INJECTION DYNAMIQUE & RESPECT DU CODE NATIF
// =======================================================================
async function syncFlowerFromSheets() {
    console.log("[HDO SYSTEM] : Synchronisation des quadrants en cours...");
    const sheetData = await fetchAndParseSheet(SHEET_FLOWER_URL);
    
    if (sheetData.length === 0) {
        console.warn("[HDO SYSTEM] : Flux Sheets vide ou inaccessible. Conservation du code natif.");
        return;
    }

    sheetData.forEach(row => {
        // Validation des coordonnées spatiales
        if (!row.Quadrant || !row.Position) return;

        const gridId = `hdo-hub-grid-${row.Quadrant}`;
        const gridContainer = document.getElementById(gridId);
        if (!gridContainer) return;

        // Récupération de tous les modules (hub-item et hub-close) du pétale
        const items = gridContainer.querySelectorAll('.hub-item, .hub-close');
        const targetIndex = parseInt(row.Position) - 1;
        const targetItem = items[targetIndex];

        if (targetItem) {
            // Règle 1 : Si le Sheets fournit un Label, on met à jour l'affichage visuel
            if (row.Label) {
                targetItem.textContent = row.Label;
            }

            // Règle 2 : Gestion comportementale (Lien externe vs Fonction native)
            if (row.Type.toUpperCase() === "LIEN" && row.Action) {
                // Si c'est un lien valide, on configure le redirect au clic
                targetItem.style.cursor = "pointer";
                targetItem.onclick = () => {
                    window.open(row.Action, '_blank');
                };
            } else {
                // Si c'est marqué "FONCTION" ou que la case Action est vide :
                // On NE réécrit PAS le onclick. Le comportement ou l'écouteur codé en local dans hope.js reste intact.
                console.log(`[HDO CORE] : Quadrant ${row.Quadrant} | Position ${row.Position} configuré en natif.`);
            }
        }
    });
    
    console.log("[HDO SYSTEM] : Matrice de la fleur mise à jour avec succès depuis le cloud.");
}

// =======================================================================
// INITIALISATION GLOBALE AU CHARGEMENT DE LA CAPSULE
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // On charge le Sheets dès que l'interface HTML est prête
    syncFlowerFromSheets().then(() => {
        startIdleGallery();
        planNextPing();
    });
});

