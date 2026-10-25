// Fictional satirical dialogue; the simulation freezes during every interlude.
export const CHAPTERS = [
 {id:'piazza',number:'PROLOGO',title:'La strada si stringe',atlas:'story',scene:0,effect:'embers',location:'ORE 18:42 · QUARTIERE POPOLARE',lines:[
  {"speaker": "NARRATORE", "text": "Il corteo è contro gli affitti troppo alti e gli stipendi troppo bassi, ma dopo poco viene respinto dalla polizia."},
  {"speaker": "NORA", "text": "Aiutami a tirarlo su. Piano… così. Ce la fai a stare in piedi?"},
  {"speaker": "MANIFESTANTE", "text": "Sì. Ho perso gli altri quando hanno caricato. Eravamo ancora fermi."},
  {"speaker": "MARANZA", "text": "Li ritroviamo sul corso. Nora, aiutalo tu; io cerco un passaggio."}
 ]},
 {id:'corso',number:'ATTO II',title:'Quelli che restano',atlas:'storyNew',scene:0,effect:'embers',location:'ORE 19:05 · CORSO COMMERCIALE',lines:[
  {"speaker": "BARISTA", "text": "Tenete, un po’ d’acqua. Le bottiglie vuote lasciatele qui."},
  {"speaker": "NORA", "text": "Grazie. Da qui si passa ancora?"},
  {"speaker": "BARISTA", "text": "Per adesso sì. Più avanti stanno chiudendo tutto."},
  {"speaker": "MARANZA", "text": "Vai tu, Nora. Ti raggiungo appena gli altri si sono ripresi."}
 ]},
 {id:'vetrine',number:'ATTO III',title:'Priorità alle vetrine',atlas:'story',scene:1,effect:'glass',location:'ORE 19:36 · VIA DEL PRIVILEGIO',lines:[
  {"speaker": "MARANZA", "text": "Quella Tesla ha più personale del pronto soccorso sotto casa mia."},
  {"speaker": "NORA", "text": "Per sorvegliare una borsa hanno scomodato un’intera pattuglia."},
  {"speaker": "RADIO DELLA PATTUGLIA", "text": "Tutte le unità alla galleria. Proteggere le vetrine e i veicoli di pregio."},
  {"speaker": "MARANZA", "text": "Chissà se a fine turno gli fanno almeno lo sconto."}
 ]},
 {id:'hotel',number:'ATTO IV',title:'Ingresso riservato',atlas:'storyNew',scene:1,effect:'glass',location:'ORE 20:12 · GRAND HOTEL',lines:[
  {"speaker": "CAMERIERA", "text": "Quella suite costa quanto guadagno io in un anno. La pulisco io, mi godo almeno il panorama."},
  {"speaker": "NORA", "text": "E il Cybertruck davanti alla porta?"},
  {"speaker": "CAMERIERA", "text": "È di un ospite. Ha chiesto di spostare la fermata dell’autobus: gli copriva la macchina nelle foto."},
  {"speaker": "MARANZA", "text": "Nora, passa tu. Io aspetto che finisca il servizio e vi raggiungiamo."}
 ]},
 {id:'porto',number:'ATTO V',title:'Chi tiene tutto a galla',atlas:'storyNew',scene:2,effect:'water',location:'ORE 21:08 · PORTO PRIVATO',lines:[
  {"speaker": "OPERAIO DEL PORTO", "text": "Quello yacht lo puliamo in dodici. Il proprietario viene due settimane all’anno e ci chiama tutti “ragazzo”."},
  {"speaker": "MARANZA", "text": "Anche te?"},
  {"speaker": "OPERAIO DEL PORTO", "text": "Ho cinquantotto anni. La banchina, poi, l’ha rifatta il Comune. Adesso a mia moglie serve un pass per portarmi il pranzo."},
  {"speaker": "NORA", "text": "Riesci a farci passare?"},
  {"speaker": "OPERAIO DEL PORTO", "text": "Vi apro il cancello di servizio. Dopo il porto cominciano le banche."}
 ]},
 {id:'trump',number:'ATTO VI',title:'Il miglior affare',atlas:'storyEnd',scene:0,effect:'glass',location:'DISTRETTO FINANZIARIO',lines:[
  {"speaker": "TRUMP", "text": "Una strada fantastica. Potrei comprarla, metterci il mio nome e farvi pagare il passaggio."},
  {"speaker": "NORA", "text": "È la strada per andare al lavoro. Sposta quella roba dall’ingresso."},
  {"speaker": "TRUMP", "text": "È una corazza d’oro. Il miglior investimento della mia vita. Due anni di garanzia."},
  {"speaker": "MARANZA", "text": "Conserva lo scontrino. Nora, ti do una mano."}
 ]},
 {id:'palazzo',number:'ATTO VII',title:'Un altro mandato',atlas:'story',scene:3,effect:'broadcast',location:'TRASMISSIONE DAL PALAZZO · FINZIONE SATIRICA',lines:[
  {"speaker": "IL PRESIDENTE", "text": "Mi rivoteranno, vero? Ho mantenuto tutte le promesse. Anche quelle che era meglio dimenticare."},
  {"speaker": "IL CONSIGLIERE", "text": "I sondaggi sono incerti, Presidente. E continuano ad arrivare accuse di genocidio."},
  {"speaker": "IL PRESIDENTE", "text": "Nel dubbio, attacchiamo un altro Stato. I genocidi sono come le patatine: uno tira l’altro."},
  {"speaker": "IL CONSIGLIERE", "text": "Devo avvertire l’esercito o l’ufficio stampa?"},
  {"speaker": "NORA", "text": "Sta dando altri ordini di bombardare. Dobbiamo arrivare al palazzo."}
 ]}
];

// After each boss the escape is shown in play first, then in these interludes.
export const AFTERMATH = {
 trump:[{id:'trump-fuga',number:'DOPO L’ATTO VI',title:'L’uscita di servizio',atlas:'storyEnd',scene:1,effect:'glass',musicLevel:5,location:'LA LIMOUSINE È GIÀ ACCESA',lines:[
  {"speaker": "TRUMP", "text": "Era in garanzia! Telefonate al produttore. Io intanto mi lamento su Truth."},
  {"speaker": "NORA", "text": "È già in macchina. Lasciamolo andare, gli altri ci aspettano."}
 ]}],
 president:[{id:'presidente-fuga',number:'DOPO L’ATTO VII',title:'La fuga dal palazzo',atlas:'storyEnd',scene:2,effect:'embers',musicLevel:6,location:'IL PRESIDENTE LASCIA IL PALAZZO · FINZIONE SATIRICA',lines:[
  {"speaker": "IL CONSIGLIERE", "text": "Da questa parte, Presidente. L’autista ha già acceso il motore."},
  {"speaker": "IL PRESIDENTE", "text": "Diremo che era una visita all’estero. Preparate un comunicato."},
  {"speaker": "MARANZA", "text": "Le bombe si sono fermate. Nora, fai passare gli altri."}
 ]},{id:'epilogo',number:'EPILOGO',title:'Un primo passo',atlas:'storyEnd',scene:3,effect:'water',musicLevel:6,location:'IL GIORNO DOPO',lines:[
  {"speaker": "NORA", "text": "Un primo passo è fatto. C’è ancora molto da fare."},
  {"speaker": "MARANZA", "text": "Intanto cerchiamo gli altri. Di qui in avanti ci andiamo insieme."}
 ]}]
};
export const GALLERY_CHAPTERS=[...CHAPTERS,...AFTERMATH.trump,...AFTERMATH.president];

// Break at words, preferring sentence ends. Rejoining pages preserves every word.
export function paginateLines(lines,maxChars=Infinity){
 return lines.flatMap((line,sourceIndex)=>{
  const pages=[];let text=line.text.trim();
  while(text.length>maxChars){
   let cut=text.lastIndexOf(' ',maxChars);
   if(cut<1)cut=text.indexOf(' ',maxChars);
   if(cut<1)break;
   const sentence=[...text.slice(0,cut).matchAll(/[.!?;]\s/g)].at(-1);
   if(sentence&&sentence.index>maxChars*.45)cut=sentence.index+1;
   // Keep short grammatical links with the words they introduce on the next page.
   while(cut>maxChars*.5&&/\b(?:e|o|ma|che|non|il|lo|la|i|gli|le|un|uno|una|di|a|da|in|con|su|per|tra|fra)$/i.test(text.slice(0,cut))){
    const previous=text.lastIndexOf(' ',cut-1);if(previous<maxChars*.45)break;cut=previous;
   }
   pages.push({...line,text:text.slice(0,cut).trim(),sourceIndex});text=text.slice(cut).trim();
  }
  pages.push({...line,text,sourceIndex});return pages;
 });
}
export class StoryPlayer {
 constructor(){this.active=false;this.chapter=null;this.index=0;this.elapsed=0;this.revealed=0;this.onDone=null;}
 start(chapter,onDone=()=>{},maxChars=Infinity){this.chapter=typeof chapter==='number'?CHAPTERS[chapter]:chapter;this.pages=paginateLines(this.chapter?.lines||[],maxChars);this.index=0;this.elapsed=0;this.revealed=0;this.onDone=onDone;this.active=!!this.chapter;}
 get line(){return this.pages?.[this.index];}
 get lineCount(){return this.pages?.length||0;}
 get complete(){return !this.line||this.revealed>=this.line.text.length;}
 get text(){return this.line?.text.slice(0,Math.floor(this.revealed))||'';}
 update(dt){if(!this.active)return;this.elapsed+=dt;this.revealed=Math.min(this.line.text.length,this.revealed+dt*48);}
 next(){if(!this.active)return;if(!this.complete){this.revealed=this.line.text.length;return;}if(this.index<this.lineCount-1){this.index++;this.revealed=0;return;}this.finish();}
 finish(){if(!this.active)return;const done=this.onDone;this.active=false;this.onDone=null;done?.();}
 cancel(){this.active=false;this.onDone=null;}
}
