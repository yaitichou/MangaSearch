const main = async () => {
  // Get character's name from current window url paramaters
  const characterUnformatted = window.location.search.split('=')[1];

  //Add a \ just before parenthese to have a correct query after
  let character = formatSpecialCharacters(characterUnformatted);
  console.log('finalCharacter', character);

  const urlSearch = 'http://dbpedia.org/sparql';

  const query = `SELECT ?uri ?name ?description ?firstAppearance GROUP_CONCAT (DISTINCT ?manga; separator="|") as ?mangas GROUP_CONCAT (DISTINCT ?voice; separator="|") as ?voiceActors WHERE { 
    ?uri rdfs:label ?name; 
    rdfs:comment ?description; 
    dbo:firstAppearance ?firstAppearance; 
    dbo:series ?manga.
    OPTIONAL{?uri dbo:voice ?voice. }
    FILTER(?uri=dbr:${character}
    && lang(?name)="en" 
    && lang(?description)="en" 
    ) }  `;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';

  // Ajax http request to dbpedia
  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      console.log('basicInfos data', data);

      const name = data.results.bindings[0].name.value;
      const description = data.results.bindings[0].description.value;
      const firstAppearance = data.results.bindings[0].firstAppearance.value;
      const mangas = data.results.bindings[0].mangas.value.split('|');
      const voiceActors = data.results.bindings[0].voiceActors.value.split('|');

      // Change page title to show the character's name
      document.title = name;

      // Inject the informations into the html page dynamically
      $('#name').text(name);
      $('#description').text(description);
      $('#firstAppearance').text(firstAppearance);

      // Voice actors of the character, we link them to voice_actor.html page
      let vaHtml = '<ul>';
      voiceActors.forEach((voiceActURI) => {
        vaHtml += '<li>';
        vaHtml += `<a href="voice_actor.html?va=${
          voiceActURI.split('resource/')[1]
        }">`;
        vaHtml += formatUri(voiceActURI);
        vaHtml += '</a>';
        vaHtml += '</li>';
      });
      vaHtml += '</ul>';

      $('#voiceActors').html(vaHtml);

      // Mangas where the character is in we link it to the page manga.html
      let mangasHtml = '<ul>';
      mangas.forEach((mangaUri) => {
        mangasHtml += '<li>';
        mangasHtml += `<a href="manga.html?manga=${
          mangaUri.split('resource/')[1]
        }">`;
        mangasHtml += formatUri(mangaUri);
        mangasHtml += '</a>';
        mangasHtml += '</li>';
      });
      mangasHtml += '</ul>';

      $('#mangas').html(mangasHtml);
    },
  });

  // Get character's image and add it to the html page
  const img = await getWikipediaThumbnail(characterUnformatted);
  $('#image').html(img);
};

// launching the script when the document is ready
$(document).ready(main);
