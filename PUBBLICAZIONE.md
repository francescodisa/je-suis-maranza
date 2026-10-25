# Pubblicare il gioco senza collegare GitHub

Il gioco è interamente statico. La cartella dist contiene tutto ciò che serve, comprese immagini e musiche. Nessuna chiave API, nessun server applicativo e nessun accesso ChatGPT sono richiesti per giocare alla copia esportata.

## Cloudflare Pages — sito indipendente

1. Crea un account Cloudflare con email e scegli il piano gratuito.
2. Nel pannello apri Workers & Pages, quindi Create application e la sezione Pages.
3. Scegli Direct Upload / Drag and drop your files.
4. Assegna un nome al progetto e carica Je-suis-Maranza-web.zip, fornito separatamente. In alternativa, trascina la cartella dist estratta dal pacchetto sorgente.
5. Premi Deploy site e apri l’indirizzo pages.dev assegnato.

Il nome dipende dalla disponibilità; il dominio pages.dev è incluso. Non serve acquistare un dominio. L’hosting non richiede un collegamento a GitHub; per aggiornare il gioco userai un nuovo caricamento.

Il caricamento da pannello accetta fino a 1.000 file, ciascuno entro 25 MiB. Questa esportazione contiene 33 file; il maggiore è circa 3,20 MiB, quindi rientra nei limiti. Il peso totale non va confuso con il limite per singolo file.

Documentazione verificata il 25 ottobre 2026:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/platform/limits/
- https://www.cloudflare.com/products/pages/

## itch.io — pagina dedicata al gioco

È una seconda possibilità gratuita, anch’essa utilizzabile senza GitHub.

1. Crea un account itch.io e aggiungi un progetto.
2. Come tipo scegli HTML Game e carica Je-suis-Maranza-web.zip.
3. Imposta il file come giocabile nel browser, se viene richiesto.
4. Attiva Mobile Friendly; per questo gioco scegli Click to launch in fullscreen.
5. Aggiungi copertina e descrizione. Lascia l’accesso gratuito, controlla l’anteprima e infine rendi pubblica la pagina.

Lo ZIP ha index.html alla radice e percorsi relativi, come richiesto. Su telefono è preferibile ruotare lo schermo.

Documentazione:
- https://itch.io/docs/creators/html5
- https://itch.io/docs/creators/faq

## Quale archivio usare

Je-suis-Maranza-GitHub.zip contiene sorgenti, test, documentazione e strumenti locali. Estrailo per lavorare al progetto o caricarlo in un repository.

Je-suis-Maranza-web.zip contiene soltanto il gioco pubblicabile, con index.html subito visibile all’interno dello ZIP. Usa questo per l’hosting. Non caricare lo ZIP sorgente al suo posto.

## Verifica dopo il caricamento

Apri la pagina da computer e telefono. Avvia una partita, controlla il caricamento delle immagini e prova l’audio dopo il primo tocco. Controlla il menu, una scena narrativa e il salvataggio. Il nuovo indirizzo avrà i propri salvataggi locali: quelli del sito precedente restano sul vecchio dominio.

Essere indipendente da GitHub riguarda l’hosting e il collegamento al repository; la pubblicazione non garantisce anonimato. I normali file HTML, JavaScript e gli asset di un gioco web possono essere scaricati dal browser.
