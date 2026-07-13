// Initialisation de la reconnaissance vocale de Google
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (Recognition) {
    const microHop = new Recognition();
    microHop.lang = 'fr-FR'; // Configuration en Français
    microHop.continuous = false; // S'arrête dès que tu as fini ta phrase
    microHop.interimResults = false; // Ne renvoie que le résultat final

    // Événement : Quand tu as fini de parler
    microHop.onresult = function(event) {
        const texteVoix = event.results[0][0].transcript;
        console.log("Hop a entendu :", texteVoix);
        
        // Magie : on envoie le texte dicté directement à ton processeur de commande !
        processCommand(texteVoix);
    };

    microHop.onerror = function(e) {
        console.error("Erreur de capture vocale :", e.error);
    };

    // Fonction pour allumer le micro (liable à un bouton ou un raccourci)
    function ecouterAlexander() {
        microHop.start();
        changerEtatHop('listening'); // Change l'état visuel de Hop pour montrer qu'elle écoute
    }
} else {
    console.log("La reconnaissance vocale n'est pas supportée sur cette machine.");
}