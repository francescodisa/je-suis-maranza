# Je suis Maranza

**Il privilegio ha i vetri fragili.**

Je suis Maranza è un arcade satirico in pixel art per browser. Maranza e Nora attraversano sette atti, dal quartiere popolare ai palazzi del potere, fra cortei, inseguimenti e incontri con chi può dare una mano. La città cambia strada dopo strada: cambiano le vetrine, le automobili e il modo in cui il potere si difende.

<p align="center"><img src="docs/instagram/cover.png" alt="Copertina di Je suis Maranza" width="680"></p>

<p align="center">
  <img src="docs/instagram/gameplay-strada.png" alt="Maranza attraversa il quartiere popolare" width="48%">
  <img src="docs/instagram/gameplay-convinci.png" alt="Nora usa Convinci per aprirsi un passaggio" width="48%">
</p>

## Il gioco

Raggiungi la fine di ogni scenario evitando manganellate e arresti. Puoi rompere gli oggetti per recuperare motivazione, proteggerti o usare **Convinci** per aprire un passaggio fra gli agenti. La distruzione è facoltativa: il percorso può essere completato anche senza rompere nulla.

- Sette atti con Maranza e Nora alternati, scene narrative e incontri finali.
- Tre difficoltà: Facile, Normale e Difficile.
- Comandi da tastiera e controlli touch per telefono e tablet.
- Salvataggio della partita nel browser.
- Musica ed effetti sonori regolabili dal menu.

Personaggi, dialoghi e situazioni appartengono a una finzione satirica.

## Comandi

| Azione | Tastiera |
| --- | --- |
| Muoversi | WASD oppure frecce |
| Colpire gli oggetti | J |
| Proteggersi | K tenuto premuto |
| Saltare | Spazio |
| Convinci | L |
| Pausa / menu | Esc |
| Proseguire nei dialoghi | Invio oppure Spazio |

Su schermo touch sono disponibili joystick e pulsanti. Su telefono è consigliato l’orientamento orizzontale.

I salvataggi sono legati al browser e all’indirizzo da cui si gioca. Per riprendere una partita, usa lo stesso browser sullo stesso sito.

## Avvio locale

Richiede **Node.js 20 o successivo**.

```sh
git clone https://github.com/francescodisa/je-suis-maranza.git
cd je-suis-maranza
npm start
```

Apri [http://127.0.0.1:8080](http://127.0.0.1:8080) nel browser. Il progetto non ha dipendenze runtime e non richiede installazione di pacchetti o compilazione: `dist/` contiene già il gioco completo.

Il gioco usa moduli JavaScript e va aperto attraverso un server HTTP, come quello avviato da `npm start`.

## Sviluppo

Il gioco è realizzato in JavaScript con rendering su canvas, grafica e audio inclusi nel repository.

| Percorso | Contenuto |
| --- | --- |
| `dist/` | Gioco completo, codice e asset |
| `tests/` | Test automatici |
| `docs/` | Documentazione, provenienza degli asset e anteprime |
| `scripts/serve.mjs` | Server per l’avvio locale |

Per controllare la sintassi ed eseguire i test:

```sh
npm run check
npm test
```

La suite comprende regole di gioco, bilanciamento, audio, controlli mobile, dialoghi e salvataggi.

## Crediti e licenza

Le immagini sono state create per il progetto; le due musiche sono state fornite dall’autore. La documentazione sulla provenienza degli asset è in [art-v3](docs/art-v3.md), [art-v4](docs/art-v4.md) e [art-v10](docs/art-v10.md).

Il progetto è distribuito con **Apache License 2.0**. Il testo integrale è nel file [LICENSE](LICENSE).
