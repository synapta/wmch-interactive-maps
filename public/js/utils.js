var dictItems = function (Ogg) {
    // ottieni valori dell'oggetto (dizionario)
    var els = [];
    for (var k in Ogg) {
        if (Ogg.hasOwnProperty(k)) {
            els.push(Ogg[k]);
        }
    };
    return els;
};
var arrSum = function (arr) {
    // somma elementi di un Array numerico
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    return arr.reduce(reducer);
};
////

var isWikipediaURL = function (record) {
    // Verifica se un link appartiene a Commons
    return record.indexOf('wikipedia.org') > -1;
};
var getWikipediaLang = function (record) {
    return record.split('://')[1].split('.')[0];
};
var getWikipediaPageName = function (record) {
    try {
        els = record.split('/wiki/');
        return decodeURI(els[els.length - 1].replace(/[_]/g, " "));
    }
    catch (err) {
        return 'Wikipedia article';
    }
};

var openModal = function (ev) {
    if (window.isMobile != 'undefined') {
        if (window.isMobile()) {
            openModalOnMobile(ev);
        }
    }
};

var openModalOnMobile = function (ev) {
    console.log('Chiudi la finestra che fa freddo!');
    // console.log(ev);
    // console.log(y);
    // ev.sourceTarget = il layer
    // popp = ev.sourceTarget.getPopup() = il popup
    // popp.getContent() = l'HTML del popup
    // console.log(ev.sourceTarget.getPopup());
    // console.log(ev.sourceTarget.getContent());
    let popp = ev.sourceTarget.getPopup();
    let html_content = popp.getContent();
    // chiudo il baloon per il mobile
    ev.sourceTarget.closePopup()
    // Popup per mobile
    // @see https://github.com/w8r/Leaflet.Modal
    window.map.fire('modal', {

      content: html_content,        // HTML string

      closeTitle: 'close',                 // alt title of the close button
      zIndex: 10000,                       // needs to stay on top of the things
      transitionDuration: 0,             // expected transition duration (ms)

      template: '{content}',               // modal body template, this doesn't include close button and wrappers

      // callbacks for convenience,
      // you can set up you handlers here for the contents
      // onShow: function(evt){ var modal = evt.modal; ...},
      // onHide: function(evt){ var modal = evt.modal; ...},
      // change at your own risk
      // OVERLAY_CLS: 'overlay',              // overlay(backdrop) CSS class
      // MODAL_CLS: 'modal',                  // all modal blocks wrapper CSS class
      // MODAL_CONTENT_CLS: 'modal-content',  // modal window CSS class
      // INNER_CONTENT_CLS: 'modal-inner',    // inner content wrapper
      // SHOW_CLS: 'show',                    // `modal open` CSS class, here go your transitions
      // CLOSE_CLS: 'close'                   // `x` button CSS class
    });
};

var wikidataImageUrl2proxyPath = function (kwargs) {
    parser = document.createElement('a');
    parser.href = kwargs['url'];
    var prefix2replace = '/wiki/Special:FilePath/';
    var localThumbPrefix = '/thumb/';
    // Elabora path locale thumb
    return parser.pathname.replace(prefix2replace, localThumbPrefix);;
};

var prettify = function(text, color, totcounter) {
    // input: text
    // output: html
    // Label degli pseudolivelli da visualizzare
    var layersLabelsPattern = '<span class="legenda-label" style="background-color: {{bg}};">{{text}} ({{count}})</span>';
    var count = 0;
    return layersLabelsPattern.replace(/{{bg}}/g, color)
                              .replace(/{{text}}/g, text)
                              .replace(/{{count}}/g, count.toString())
                              // totcounter
};
