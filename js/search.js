let queryParams = new URLSearchParams(window.location.search);
let input = queryParams.get('search');

$(document).ready(init);
let rechercheAvancee = false;
async function init() {
  // Toggle on and off of advanced search
  let btAdvancedSearch = $('#bt-recherche-avancee');
  btAdvancedSearch.click(function () {
    let iconeRecherche = $('#i-recherche-avancee');
    if (rechercheAvancee) {
      iconeRecherche.toggleClass('active', false);
      $('#champs-recherche-avancee').toggleClass('active', false);
      rechercheAvancee = false;
    } else {
      iconeRecherche.toggleClass('active', true);
      $('#champs-recherche-avancee').toggleClass('active', true);
      rechercheAvancee = true;
    }
  });

  // Year select html
  let newDiv = document.createElement('div');
  let currYear = new Date().getFullYear();
  let selectHTML = '';
  selectHTML = "<select class='form-select' id='year'>";
  // We add an option for each year from 1970 to currentYear
  for (i = 1970; i < currYear; i = i + 1) {
    selectHTML += "<option value='" + i + "'>" + i + '</option>';
  }
  selectHTML +=
    "<option value='" + currYear + "' selected>" + currYear + '</option>';
  selectHTML += '</select>';
  newDiv.innerHTML = selectHTML;
  document.getElementById('year-container').appendChild(newDiv);

  // MangaType select html
  let select = "<select class='form-select' id='mangaType'>";
  select += "<option value=''></option>";
  const mangaTypes = ['Seinen', 'Shōnen', 'Shōjo', 'Male', 'Josei'];
  for (const mangaType of mangaTypes) {
    select += `<option value='${mangaType}'>${mangaType}</option>`;
  }
  select += '</select>';
  $('#mangaType-container').html(select);

  // Get url paramaters to pass on the search
  var author = queryParams.get('author');
  var year = queryParams.get('year');
  var filter = queryParams.get('filter');
  const mangaType = queryParams.get('mangaType');
  await mainSearch(input, author, year, filter, mangaType);
}

// Search function that redirects to search.html onclick
function search() {
  let name = $('#name');
  let author = $('#author');
  let year = $('#year');
  let filter = $('#filter');
  let filterText = filter.val().replace('\n', ';');
  let mangaType = $('#mangaType');
  let queryText = 'search.html?';
  if (!(name.val() === '')) queryText += 'search=' + name.val() + '&';
  if (rechercheAvancee) {
    if (author.val() !== '')
      queryText += 'author=' + author.val().replace(' ', '_') + '&';
    if (year.val() !== '')
      queryText += 'year=' + new Date(year.val()).getFullYear() + '&';
    if (filterText !== '') queryText += 'filter=' + filterText + '&';
    if (mangaType.val() !== '')
      queryText += 'mangaType=' + mangaType.val() + '&';
  }
  window.location.assign(queryText.substr(0, queryText.length - 1));
}

// Main search function called when we land on this page, it lauches a dbpedia request to get all the mangas
async function mainSearch(uInput, uAuthor, uYear, uFilter, uMangaType) {
  rechercheAvancee = uAuthor || uYear || uFilter || uMangaType;
  $('#displayResults tr').remove();
  $('#displayResults th').remove();
  $('#displayResults thead').remove();
  var input = uInput ? uInput.replace(' ', '_') : '';
  var author = '';
  var year = '';
  var filter = '';
  const mangaType = uMangaType || '';

  if (rechercheAvancee) {
    author = uAuthor;
    if (author !== null) {
      author = author.replace(' ', '_');
    }
    year = uYear;
    filter = uFilter;
    if (filter !== null) {
      filter = filter.replace(' ', '_');
    }
  }

  /*document.getElementById('search-terms').value = input;*/
  var urlSearch = 'http://dbpedia.org/sparql';
  var queryArray = [
    'SELECT DISTINCT ?manga',
    '(SAMPLE(?author) as ?mangaAuthor)',
    '(SAMPLE(?description) as ?mangaDescription)',
    '(SAMPLE(?demographic) as ?mangaDemographic)',
    'GROUP_CONCAT(DISTINCT ?genre; separator="|") as ?genres WHERE { ?manga dbo:type dbr:Manga ;',
    'rdfs:comment ?description ;',
    'dbo:firstPublicationDate ?startDate ;',
    'dbp:demographic ?demographic ;',
    'dbo:author ?author.',
    'OPTIONAL {?manga dbp:genre ?genre}.',
    'OPTIONAL {?manga dbp:numberOfVolumes ?numberOfVolumes}.',
    'FILTER( regex(?manga, "' + input + '","i") && lang(?description)="en"',
  ];

  // Add more filters depending on advanced search params
  // Checks both if not empty and not null
  if (author) {
    queryArray.push('&& regex(?author, "' + author + '","i")');
  }
  if (year) {
    queryArray.push(`&& ?startDate < "${year}"^^xsd:dateTime`);
  }
  if (filter) {
    queryArray.push('&& regex(?manga, "^((?!' + filter + ').)*$", "i")');
  }

  if (mangaType) {
    queryArray.push(`&& regex(?demographic,"${mangaType}")`);
  }
  queryArray.push(') } LIMIT 40');
  var query = queryArray.join(' ');

  console.log('Final query', query);

  var queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';
  // Ajax http request to dbpedia
  var data = await $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
  });
  console.log(query);

  // We create a grid where we'll display the results
  var grid = $('#displayResults');
  const bindings = data.results.bindings;

  // For each manga we create a cell where we display some manga information
  for (const row of bindings) {
    const manga = row.manga.value;
    const author = row.mangaAuthor.value;
    const demographic = row.mangaDemographic.value;
    const description = row.mangaDescription.value;
    const genres = row.genres.value === '' ? [] : row.genres.value.split('|');

    // Creating the cell and adding manga title as a link to manga.html page
    let cell = "<div class='cell'>";
    cell += "<div class='container'>";
    const mangaHtml =
      "<a class='mangaTitle' href='manga.html?manga=" +
      manga.split('resource/')[1] +
      "'>" +
      formatUri(manga) +
      '</a>';
    cell += mangaHtml;
    cell += '</br>';

    // Add image of the manga to the cell
    const mangaName = manga.split('resource/')[1];
    const imgUrl = await getWikipediaThumbnail(mangaName);
    cell += imgUrl;
    cell += '</br>';
    cell += '</div>';

    // Adding the author as a link to author.html page
    let authorHtml;
    if (author.split('resource/')[1] != undefined) {
      authorHtml =
        "<div class='author'>Author: " +
        "<a href='author.html?author=" +
        author.split('resource/')[1] +
        "'>" +
        formatUri(author) +
        '</a>' +
        '</div>';
    } else {
      authorHtml = formatUri(author);
    }
    cell += authorHtml;
    cell += '</br>';

    // Add mangaType and a short description
    cell += `<p class='demographic'>Manga type: ${formatUri(demographic)}</p>`;
    cell += `<p class='description'>${description}</p>`;

    cell += '</div>';

    // Add the cell to the final grid
    grid.append(cell);
  }
}
