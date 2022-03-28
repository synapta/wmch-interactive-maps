# Manuale utente

Questo manuale esplora l'uso dell'interfaccia di amministrazione delle mappe interattive WMCH.

## Accesso

I percorsi amministrativi sono protetti da una coppia nome utente / password.

Le mappe pubblicate sono invece visibili a tutti, mentre quelle non pubblicate appariranno solo in modifica.

## Amministra contenuti

La schermata *Amministra contenuti* è raggiungibile all'indirizzo:

- [map.wikimedia.swiss/admin](https://map.wikimedia.swiss/admin)

Tramite la quale è possibile:

1. Elencare, aggiungere, modificare le categorie;
2. Elencare le mappe pubblicate sul sito;
3. Modificare le mappe esistenti cliccando il titolo;
4. Riordinare l'ordine di apparizione delle mappe e delle categorie nella pagina principale tramite trascinamento;
5. Abilitare la funzionalità cronologia;
6. Pubblicare o nascondere le mappe (bozze).

Dopo aver modificato gli elementi bisognerà premere Salva.

![Amministra contenuti](/wizard/man/_media/admin-01.png)

## Creare una mappa

È possibile creare una mappa visitando il percorso:

- [map.wikimedia.swiss/wizard](https://map.wikimedia.swiss/wizard)

Verrà visualizzato un modulo diviso nei seguenti passaggi.

![Wizard](/wizard/man/_media/wizard-01.png)

### 1. Nome

- Titolo: il titolo della mappa
- Percorso: il percorso che apparirà nell'url nella forma /v/il-mio-percorso. La /v/ iniziale viene aggiunta automaticamente e non va specificata.

### 2. Categoria

È necessario assegnare ogni mappa ad una categoria.

Le categorie hanno sempre nomi in lingua inglese su modello di Wikimedia Commons.

### 3. Dati

La query SPARQL che popolerà la mappa va inserita qui.

### 4. Aspetto

I dati della query SPARQL sono visualizzati in anteprima. Da qui è possibile scegliere:

4.1. Lo stile della mappa
4.2. L'icona del segnaposto
4.3. Modalità e livelli di zoom
4.4. Le coordinate selezionabili da latitudine e longitudine
4.5. L'interruttore per disabilitare l'aggregazione (facoltativi)
4.6. Valori minimi e massimi di zoom (facoltativi)
4.7. Le coordinate tramite una mappa
4.8. Pubblica o salva bozza 


#### 4.2. Icona segnaposto

È possibile scegliere l'icona da visualizzare in cima al segnaposto che comparirà sulla mappa digitando il nome in inglese dell'icona da visualizzare. 

Digitando ad esempio *university* verrà visualizzata la relativa icona, digitando *arrow* verranno visualizzate diverse icone freccia fra cui scegliere.

L'elenco completo delle icone è su https://semantic-ui.com/elements/icon.html.

#### 4.4 e 4.7. Coordinate

Usando il campo zoom o i pulsanti `+` e `-` sulla mappa si potrà visualizzare una porzione specifica di territorio.

Premendo il pulsante *Coordinate sulla posizione attuale* in cima alla mappa la latitudine e longitudine verrà calcolata sul centro della mappa attualmente visibile nell'anteprima.

Considerare che l'anteprima ha una cornice ristretta rispetto alla mappa che verrà pubblicata a tutto schermo per cui è consigliabile mantenere un livello di zoom un po' più alto tenendo gli elementi a margine anche lievemente fuori dalla cornice dell'anteprima.

#### 4.3. Modalità e livelli di zoom

Si può specificare un livello di zoom (fra 1 e 18) o si può evitare scegliendo la modalità *Auto* .

In questa modalità la mappa verrà zoomata e centrata per far vedere tutti i segnaposto.

Tuttavia, la modalità Auto può anche essere usata per prendere una sola porzione di mappa dopo averla vista tutta o per centrare la mappa sui dati per scegliere poi un livello di zoom differente seguendo questi passaggi:

1. Selezionare la modalità *Auto*
2. Premere *Coordinate sulla posizione attuale*
3. Selezionare nuovamente la modalità *Manuale*

A questo punto si potrà usare lo zoom e trascinare la mappa usando sempre *Coordinate sulla posizione attuale* quando si vedrà la porzione desiderata.

#### 4.5. Interruttore per disabilitare l'aggregazione

Selezionando un gruppo la mappa si porterà al livello di zoom tale da comprendere tutti gli elementi del gruppo.

È caldamente consigliato lasciare armato l'interruttore. Una volta disarmato l'interruttore ci sarà un degrado sensibile delle prestazioni della mappa interattiva.


#### 4.6. Valori minimi e massimi di zoom

Questi parametri solitamente si possono lasciare inalterati e stabiliscono quanto l'utente può zoomare indietro (zoom minimo) e quanto avanti (zoom massimo).

I valori devono essere interi ed è preferibile non superare i valori che compaiono come predefiniti (minimo 1, massimo 18).

#### 5. Pubblica o salva bozza

Pubblicando la mappa verrà immediatamente resa visibile a tutti.

Salvando come bozza, la mappa potrà essere ancora modificata in seguito senza renderla visibile.

Se si esce dal configuratore prima di aver salvato o pubblicato, il lavoro andrà perso.

## Modificare una mappa

Nella schermata di modifica della singola mappa è possibile cambiare quanto già inserito nella mappa.

Verrà riproposto il configuratore già spiegato in *Creare una mappa*. Si potranno cambiare sia la query che i parametri di visualizzazione della mappa.

Eventualmente si può rimuovere dalla pubblicazione una mappa già pubblicata.
