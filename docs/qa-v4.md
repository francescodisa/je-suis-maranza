# Verifiche Arcade 04

- Sintassi dei sei moduli applicativi verificata con `npm run check`.
- Suite `npm test` superata: simulazione completa, ondate, prossimità delle pattuglie, alleati, arresti, liberazione colpendo la scorta e tramite solidarietà, scadenza del fermo, fumetti, narrazione e gestione audio.
- Percorso deterministico a difficoltà normale con soli input di movimento/combattimento: vittoria in 12.551 frame, 209,08 secondi simulati esclusi gli intermezzi, 6 passaggi di livello, 27 oggetti distrutti, 75 avversari sconfitti, 56 agenti convinti, 7 liberazioni, 72 punti vita finali. La precedente versione richiedeva circa 78 secondi nello stesso tipo di prova automatica. Il tempo di un giocatore umano varia.
- Sette atti, quattro settori per atto, 127 avversari di base comprese le ondate previste e il boss; ulteriori scorte e rinforzi sono finiti.
- Valore massimo delle auto per atto: 500, 1800, 2800, 5200, 8750, 10500, 12000.
- Browser: caricamento di tutti gli asset senza immagini mancanti, galleria completa, intermezzi, conto alla rovescia del fermo, liberazione e arresto completato. Ispezione visiva di corso commerciale, Grand Hotel, porto privato e fumetti.
- Viste 390×844 e 844×390 verificate tramite iframe della vera applicazione. Titolo, controlli audio e dialogo lungo del Presidente leggibili; nessuna sovrapposizione tra Continua e i controlli audio.
- Le due tracce MP3 decodificate dal browser: stereo, durata 60,029 secondi ciascuna. Riproduzione effettiva delle due musiche verificata tramite stato del lettore; musica spenta con effetti attivi e musica attiva con effetti spenti verificate nell’applicazione reale.
- Sintesi degli effetti verificata anche con OfflineAudioContext: impatti, vetri, carrozzerie ed esplosioni producono segnali distinti, non silenziosi e senza clipping nella prova. Il mix finale riduce il livello della musica a 0,19 e a 0,08 durante la narrazione.
- Nessun errore applicativo nei log del browser durante le verifiche finali. La pagina temporanea di QA è stata rimossa prima del confezionamento.
