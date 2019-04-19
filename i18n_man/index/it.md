# Manuale utente delle mappe interattive WMCH

Questo manuale esplora l'uso dell'interfaccia di amministrazione delle mappe interattive.

## Accessi

I percorsi amministrativi sono protetti da una coppia nome utente / password.

Il frontend è invece esposto e visibile a chiunque.

## Creare una mappa

È possibile creare una mappa visitando il path:

- [map.wikimedia.swiss/wizard](https://map.wikimedia.swiss/wizard)

Verrà visualizzato un modulo diviso in vari passaggi in cui è possibile:

### 1. Scegliere un titolo ed un percorso nel quale verrà visualizzata la mappa, es. /v/nome-percorso

![Passo 1](/wizard/man/_media/wizard-01.png)

### 2. Inserire la query SPARQL che popolerà la mappa

![Passo 2](/wizard/man/_media/wizard-02.png)

### 3. Scegliere l'aspetto della mappa

![Passo 3](/wizard/man/_media/wizard-03.png)

I dati della query SPARQL sono visualizzati in anteprima. Da qui è possibile scegliere:

- Lo stile della mappa
- L'icona del segnaposto
- Le coordinate
- Le modalità di raggruppamento
- I livelli di zoom

#### Icona segnaposto

È possibile scegliere l'icona da visualizzare in cima al segnaposto che comparirà sulla mappa digitando il nome in inglese dell'icona da visualizzare. Digitando ad esempio *university* verrà visualizzata la relativa icona, digitando *arrow* verranno visualizzate diverse icone freccia fra cui scegliere.

#### Zoom e coordinate

Usando il campo zoom o i pulsanti `+` e `-` sulla mappa si potrà visualizzare una porzione specifica di territorio.

Premendo il pulsante *Coordinate sulla posizione attuale* in cima alla mappa la latitudine e longitudine verrà calcolata sul centro della mappa attualmente visibile nell'anteprima.

Considerare che l'anteprima ha una cornice ristretta rispetto alla mappa che verrà pubblicata a tutto schermo per cui è consigliabile mantenere un livello di zoom un po' più alto tenendo gli elementi a margine anche lievemente fuori dalla cornice dell'anteprima.

#### Auto vs. Manual

Si può evitare di specificare un livello di zoom selezionando la modalità *Auto*.

In questa modalità la mappa verrà zoomata e centrata in base a tutti i dati ricevuti.

Tuttavia, la modalità Auto può anche essere usata per prendere una sola porzione di mappa dopo averla vista tutta o per centrare la mappa sui dati per scegliere poi un livello di zoom differente seguendo questi passaggi:

1. Selezionare la modalità *Auto*
2. Premere *Coordinate sulla posizione attuale*
3. Selezionare nuovamente la modalità *Manuale*

A questo punto si potrà usare lo zoom e trascinare la mappa usando sempre *Coordinate sulla posizione attuale* quando si vedrà la porzione desiderata.


#### Raggruppamento

Il campo *raggio di aggregazione massimo* può essere usato per raggruppare insieme elementi geograficamente adiacenti. Maggiore è il valore inserito, maggiori saranno il numero di elementi raggruppati insieme.

In visualizzazione, selezionando un gruppo la mappa si porterà al livello di zoom tale da comprendere tutti gli elementi del gruppo.


#### Zoom minimo e massimo

Questi parametri solitamente si possono lasciare inalterati e stabiliscono quanto l'utente può zoomare indietro (zoom minimo) e quanto avanti (zoom massimo).

I valori devono essere interi ed è preferibile non superare i valori che compaiono come predefiniti (massimo 18 e almeno 1).


### 4. Rivedere quanto fatto e modificare la mappa prima di pubblicare

![Passo 4](/wizard/man/_media/wizard-04.png)

Non possono esserci due mappe con lo stesso percorso e ne verrà suggerito uno, modificabile, basato sul titolo.

## Cruscotto di amministrazione

Il cruscotto di amministrazione è raggiungibile all'indirizzo:

- [map.wikimedia.swiss/admin](https://map.wikimedia.swiss/admin)

![Il cruscotto di amministrazione](/wizard/man/_media/admin-01.png)

Tramite il cruscotto di amministrazione è possibile:

1. elencare le mappe pubblicate sul sito
2. modificare le singole mappe
3. riordinare l'ordine di apparizione delle mappe nella pagina principale
4. aggiungere l'icona "preferito" (stella) ad una mappa
5. cancellare le mappe

Al click sul titolo della mappa si verrà rimandati alla pagina di modifica.

Selezionando le operazioni di cancellazione o l'assegnazione preferito / non preferito bisognerà premere uno dei pulsanti Salva.

## Modificare una mappa

Nella schermata di modifica della singola mappa è possibile cambiare quanto già inserito nella mappa.

Verrà riproposto il modulo wizard già spiegato in *Creare una mappa*. Si potranno cambiare sia la query che i parametri di visualizzazione della mappa.

## EN/IT

- cruscotto di amministrazione: admin dashboard
- pagina principale: landing page
- percorsi di amministrazione: admin paths
- percorso: path
- modulo: form
- Coordinate sulla posizione attuale: Coordinates on current position
- raggio di aggregazione massimo: max cluster radius
