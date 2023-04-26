// Formats the uri to not have dbpedia link and _ in it
const formatUri = (uri) => {
  if (uri.split('resource/')[1] != undefined) {
    return uri.split('resource/')[1].replaceAll('_', ' ');
  } else {
    return uri;
  }
};

// Converts array of ressources into html list of items
const arrayToHtml = (array) => {
  let html = '<ul>';
  for (const uri of array) {
    html += '<li>';
    html += formatUri(uri);
    html += '</li>';
  }
  html += '</ul>';

  return html;
};

// Get the thumbnail image from the ressource's wikipedia page
async function getWikipediaThumbnail(resourceName) {
  var url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&pilicense=any&formatversion=2&prop=pageimages|pageterms&piprop=original&titles=' +
    resourceName;

  var data = await $.ajax({
    dataType: 'jsonp',
    url: url,
  });

  try {
    return (
      "<img alt='Image not found' src=" +
      data['query']['pages'][0]['original']['source'] +
      '></img>'
    );
  } catch (error) {
    return "<img src='' alt='Image not found'></img>";
  }
}

// Add a \ just before special characters like () or ' to have a correct SPARQL query
const formatSpecialCharacters = (name) => {
  let finalName = '';
  for (let i = 0; i < name.length; i++) {
    if (['(', ')', '!'].includes(name[i])) {
      finalName += '\\';
    }
    finalName += name[i];
  }
  return finalName;
};
