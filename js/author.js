$(document).ready(() => {
  // Get author name from current window url paramaters
  const author = window.location.search.split('=')[1];
  const urlSearch = 'http://dbpedia.org/sparql';

  const query = `SELECT DISTINCT ?name 
                  (SAMPLE(?description) as ?descriptionAuteur)  
                  (SAMPLE(?birthDate) as ?birthDateAuteur) 
                  (SAMPLE(?birthPlace) as ?birthPlaceAuteur) 
                  (SAMPLE(?debut) as ?debutAuteur)  
                  (SAMPLE(?uri) as ?uriAuteur)  
                  GROUP_CONCAT(DISTINCT ?work; separator="|") as ?works  
                  GROUP_CONCAT(DISTINCT ?award; separator="|") as ?awards WHERE { 
                    ?uri  rdfs:label ?name; 
                    a foaf:Person; 
                    rdfs:comment ?description. 
                    {?uri dbp:birthDate ?birthDate.}
                    UNION
                    {?uri dbo:birthDate ?birthDate.} 
                    {?uri dbp:birthPlace ?birthPlace.}
                    UNION
                    {?uri dbo:birthPlace ?birthPlace.} 
                    OPTIONAL{
                    {?uri dbp:notableWorks ?work.} 
                    UNION
                    {?uri dbo:knownFor ?work.}
                    UNION
                    {?uri dbo:notableWork ?work.}
                    ?work dbo:type dbr:Manga.
                    }
                    OPTIONAL{?uri dbp:yearsActive ?debut .} 
                    OPTIONAL{?uri dbp:awards ?award.} 
                    FILTER(?uri = dbr:${author}
                      && lang(?description)="en" 
                      && lang(?name)="en" 
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
      const description = data.results.bindings[0].descriptionAuteur.value;
      const dateBirth = data.results.bindings[0].birthDateAuteur.value;
      const placeBirth = data.results.bindings[0].birthPlaceAuteur.value;
      const works = data.results.bindings[0].works.value.split('|');
      let debut = 'unknown';
      let awards = 'no awards';

      // Make links of the author's mangas to manga.html
      let worksHtml = '<ul>';
      for (const work of works) {
        let workForm = formatUri(work);
        worksHtml += '<li>';
        worksHtml +=
          "<a href='manga.html?manga=" +
          workForm.replaceAll(' ', '_') +
          "'>" +
          formatUri(workForm) +
          '</a>';
        worksHtml += '</li>';
      }
      worksHtml += '</ul>';

      if (data.results.bindings[0].debutAuteur != undefined) {
        debut = data.results.bindings[0].debutAuteur.value;
      }

      let awardsHtml = awards;
      if (data.results.bindings[0].awards != undefined) {
        awards = data.results.bindings[0].awards.value.split('|');
        awardsHtml = '<ul>';
        for (const award of awards) {
          awardsHtml += '<li>';
          awardsHtml += formatUri(award);
          awardsHtml += '</li>';
        }
        awardsHtml += '</ul>';
      }

      // Change page title to show the author's name
      document.title = name;

      // Inject the informations into the html page dynamically
      $('#name').text(name);
      $('#description').text(description);
      $('#birthDate').text(dateBirth);
      $('#birthPlace').text(placeBirth);
      $('#debut').text(debut);

      $('#works').html(worksHtml);

      $('#awards').html(awardsHtml);
    },
  });
});
