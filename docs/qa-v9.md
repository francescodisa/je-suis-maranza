# Motivazione 09 — verifica

Sintassi, suite completa e controllo differenze superati. I test coprono risorsa unica, costi di guardia/persuasione/fuga, ricarica tramite oggetti/incontri, assenza di ricarica passiva, appello e risposta in sequenza, fine dell'esitazione, immunità della polizia, arresti, inseguimento e due accessi al boss finale.

Due campagne complete con input normali raggiungono la vittoria. La prima dura 178 secondi simulati e distrugge 28 oggetti; la seconda dura 120 secondi e mantiene zero oggetti distrutti, compresa la macchina finale rimasta intatta e disattivata. Entrambe terminano con 96/120 salute e zero danni agli agenti. Nessuna modifica artificiale a salute, posizione, invulnerabilità o risorse nella campagna di verifica.

Schema 5: ripristino esatto e deterministico della motivazione, guardia, arresti, inseguimento, dialogo di persuasione e fase finale. Test delle migrazioni 1–4 e del rifiuto dei dati invalidi prima di alterare la partita. Una battuta può terminare dopo il cambio di zona anche se il parlante è uscito dalla scena.

Verifica browser tramite anteprima gestita a 844×390, 568×320 e 390×844. Appello di Maranza e risposta dell'agente leggibili, uno per volta; motivazione da 100 a 60 con un uso di Convinci. Punti interrogativi animati e agenti fermi durante l'esitazione. Il nuovo avviso di arresto ha priorità sui dialoghi; il pulsante Convinci usa la soglia effettiva 40, senza arrotondamento anticipato.

Scene: immagine separata dal pannello del dialogo, pagine circa 72 caratteri, pulsanti accessibili sul formato 568×320. Verificati Guarda la scena e il ritorno al dialogo. Corretto un conflitto CSS che ritagliava ancora l'immagine in verticale; vista 390×844 nuovamente controllata e immagine intera. Prologo e scena finale ispezionati. Nessun overflow orizzontale o errore console dell'app osservato.

La pagina temporanea di verifica usava pulsanti visibili per predisporre gli incontri e avanzare la sequenza; rimossa prima della pubblicazione. Anteprime in preview-v9-scene.jpg e preview-v9-persuasion.jpg. La comodità dei gesti simultanei richiede una prova su telefono fisico.
