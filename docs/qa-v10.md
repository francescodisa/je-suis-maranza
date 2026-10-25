# Insieme 10 — verifica

Sintassi, suite completa e controllo differenze superati. Le campagne complete con input normali attraversano tutti i sette atti, affrontano Trump e il Presidente e attendono entrambe le fughe. La campagna con distruzioni termina in 185 secondi simulati con 75/120 salute e 27 oggetti; quella senza distruzioni termina in 131 secondi con 99/120 salute e zero oggetti, compresa la macchina bellica intatta e disattivata. Nessun danno agli agenti e nessuna uccisione in entrambe. Le campagne non modificano artificialmente salute, posizione o risorse.

Alternanza verificata su tutti gli atti: Maranza nei dispari, Nora nei pari, stesso tipo player e identiche caratteristiche. Il personaggio opposto appare come aiutante. Test di movimento, attacco, protezione, persuasione, portata, costi e aiuto agli oggetti.

I colpi ai boss consumano la corazza, con suono metallico. A zero la sequenza passa a bossescape: posa in piedi per 1,1 secondi e corsa verso destra per 2,1 secondi, senza danni durante la fuga. Il boss resta vivo, non usa pose di caduta, esce dall’inquadratura e soltanto allora concede il passaggio o la vittoria. Test aggiuntivo per un boss attirato molto indietro: la camera continua a mostrare la fuga.

Schema 6 verificato con ripresa esatta di entrambi i boss e delle fughe, Trump senza macchina, cambio protagonista e supporto. I salvataggi 1–5 migrano all’inizio dell’atto corretto mantenendo risorse e progressi. Il menu e il salvataggio sono accessibili da telefono anche nella schermata di completamento dopo Trump.

Verifica browser nell’anteprima gestita: 844×390, 568×320, 390×844 e 1280×720. Controllati Nora protagonista con Maranza di supporto, corazza e fuga di Trump, fuga del Presidente, entrambe le scene successive e l’epilogo. La catena Trump → fuga illustrata → risultato → atto VII sceglie Maranza. La catena Presidente → fuga illustrata → epilogo → risultato funziona anche saltando le scene. Il messaggio «Un primo passo è fatto. C’è ancora molto da fare» resta intero su una pagina.

Illustrazioni e testi hanno spazi separati sui formati mobili; controllati Guarda la scena e Torna al dialogo. Nessun overflow orizzontale, risorsa mancante o errore console dell’app osservato. La galleria contiene dieci scene; l’introduzione di Trump è stata verificata su desktop. I gestori reali dell’interfaccia sono stati controllati anche con un DOM simulato per pausa/ripresa e salvataggio a metà fuga.

La pagina temporanea di QA disponeva di pulsanti visibili per preparare gli incontri e fermare l’animazione; è stata rimossa prima della pubblicazione. Anteprime: preview-v10-epilogue.jpg e preview-v10-nora.jpg. Le verifiche del layout non sostituiscono la prova dei gesti su un telefono fisico.
