$(document).ready(() => {
  // Get voice actor name from current window url paramaters
  const voiceActor = window.location.search.split('=')[1];
  const urlSearch = 'http://dbpedia.org/sparql';

  const query = `SELECT DISTINCT ?name 
    (SAMPLE(?description) as ?descriptionVoiceAct)  
    (SAMPLE(?birthDate) as ?birthDateVoiceAct) 
    (SAMPLE(?birthPlace) as ?birthPlaceVoiceAct) 
    (SAMPLE(?debut) as ?debutVoiceAct)  
    (SAMPLE(?uri) as ?uriVoiceAct)
    GROUP_CONCAT(DISTINCT ?voicing; separator="|") as ?voices WHERE { 
    ?uri  rdfs:label ?name; 
    a foaf:Person; 
    rdfs:comment ?description.
    OPTIONAL{?voicing dbo:voice ?uri;
    a dbo:FictionalCharacter;
    rdfs:comment ?fromManga}  
    OPTIONAL{{?uri dbp:birthDate ?birthDate.}
    UNION
    {?uri dbo:birthDate ?birthDate.}}  
    OPTIONAL{{?uri dbp:birthPlace ?birthPlace.}
    UNION
    {?uri dbo:birthPlace ?birthPlace.}}
    OPTIONAL{?uri dbp:yearsActive ?debut .} 
    FILTER(?uri=dbr:${voiceActor} 
    && regex(?fromManga,"manga","i")
    && lang(?name)="en" 
    &&( lang(?description)="en") 
    ) 
    }  `;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';
  console.log(queryUrl);

  // Ajax http request to dbpedia
  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      console.log(data);

      const name = data.results.bindings[0].name.value;
      const description = data.results.bindings[0].descriptionVoiceAct.value;
      let dateBirth = 'unknown';
      let placeBirth = 'unkown';
      let debut = 'unknown';
      let voices = 'no character found';

      if (data.results.bindings[0].birthDateVoiceAct != undefined) {
        dateBirth = data.results.bindings[0].birthDateVoiceAct.value;
      }

      if (data.results.bindings[0].birthPlaceVoiceAct != undefined) {
        placeBirth = data.results.bindings[0].birthPlaceVoiceAct.value;
      }

      if (data.results.bindings[0].debutVoiceAct != undefined) {
        debut = data.results.bindings[0].debutVoiceAct.value;
      }

      // Characters that he voices, we link them to character.html page
      let voicesHtml = voices;
      if (data.results.bindings[0].voices != undefined) {
        voices = data.results.bindings[0].voices.value.split('|');
        voicesHtml = '<ul>';
        for (const voice of voices) {
          voicesHtml += '<li>';
          voicesHtml +=
            "<a href='character.html?character=" +
            voice.split('resource/')[1] +
            "'>" +
            formatUri(voice) +
            '</a>';
          voicesHtml += '</li>';
        }
        voicesHtml += '</ul>';
      }

      // Change page title to show the manga's name
      document.title = name;

      // Inject the informations into the html page dynamically
      $('#name').text(name);
      $('#description').text(description);
      $('#birthDate').text(formatUri(dateBirth));
      $('#birthPlace').text(formatUri(placeBirth));
      $('#debut').text(debut);
      $('#voices').html(voicesHtml);
    },
  });
});
