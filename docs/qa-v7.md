# In strada 07 — verifica

Versione 3.0, 25 ottobre 2026.

## Simulazione

La suite npm test passa con le nuove regole. La campagna completa a difficoltà normale usa soltanto comandi di movimento, salto, schivata, colpi agli oggetti e persuasione; nessun teletrasporto o modifica della salute durante il percorso. Arriva alla vittoria dopo 168 secondi simulati esclusi gli intermezzi, con 103 HP, 28 oggetti, 47 agenti persuasi una sola volta, 17 incontri e 7 soccorsi. Ogni fotogramma verifica l'assenza di danni agli agenti, massimo tre agenti presenti e massimo un aiutante temporaneo. Il tempo dimostra la percorribilità; la difficoltà per una persona richiede una prova giocata.

Test specifici verificano direzione della schivata, ricarica e obbligo di rilasciare il pulsante; colpi annunciati verso un'area fissa; aggressione senza vandalismo; passaggi senza alleati; benefici distinti degli incontri; soccorsi facoltativi e bonus. La macchina finale rimane l'unico bersaglio del finale, il Presidente è incolume.

Salvataggi schema3 ripristinati durante schivata e aiuto temporaneo, continuazione deterministica nelle tre difficoltà, riferimenti macchina/boss/civile, arresto e liberazione. Migrazione schema1 e schema2 all'inizio dell'atto con punti e salute conservati. Audio e dialoghi conservano le verifiche precedenti.

## Browser

Anteprima gestita con un contenitore temporaneo per viewport, rimosso prima della pubblicazione. Controlli visivi a 844×390 e 568×320 orizzontali, 390×844 verticale, senza overflow. La nuova salute occupa una sola barra; scompaiono coesione e numero di seguaci. Schivata touch osservata con spostamento di 132 unità e conto alla rovescia sul pulsante. Convinci interrompe due agenti, senza danni e senza aggiungere seguaci. Soccorso osservato con arresto risolto e nessun aiutante persistente. Musica in riproduzione, nessun errore dell'applicazione nel log del browser.

Le scene di controllo usano posizionamenti predisposti e protezione del protagonista per ispezionare l'interfaccia. La prova integrale del motore usa le regole normali. Gesti fisici su iOS/Android da verificare sul dispositivo.
