$(document).ready(function () {
  // Year select html
  let newDiv = document.createElement('div');
  let currYear = new Date().getFullYear();
  let selectHTML = "<select class='form-select' id='year'>";
  for (let i = 1970; i < currYear; i = i + 1) {
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

  let btSearch = $('#valider');
  let btAdvancedSearch = $('#bt-recherche-avancee');
  let inputTitle = $('#name');
  let rechercheAvancee = false;

  // Prepare url paramaters to send to the search.html page
  function sendSearch() {
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

  // Launch search on button click
  btSearch.click(function () {
    sendSearch();
  });

  // Launch search when we press enter on keyboard
  inputTitle.on('keydown', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      sendSearch();
    }
  });

  // Advanced search button toggle on and off onclick
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

  // Auto-complete
  inputTitle.on('input', function () {
    let inputText = $(this).val().replaceAll(' ', '_');
    let contenu_requete =
      'SELECT DISTINCT ?manga WHERE {?manga dbo:type dbr:Manga. FILTER(regex(?manga, "' +
      inputText +
      '","i"))} LIMIT 20';
    let url =
      'https://dbpedia.org/sparql?query=' +
      encodeURIComponent(contenu_requete) +
      '&format=json';
    $('#titles')[0].innerHTML = '';
    $.ajax({
      dataType: 'jsonp',
      url: url,
      success: function (data) {
        data.results.bindings.forEach((manga) => {
          // console.log(manga.manga.value);
          let filteredTitle = manga.manga.value
            .replaceAll('_', ' ')
            .replace('http://dbpedia.org/resource/', '');
          $('#titles').append(`<option value="${filteredTitle}"/>`);
        });
      },
    });
  });
});
