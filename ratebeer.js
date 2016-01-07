var cheerio = require('cheerio');
var similarity = require('string-similarity');
var _ = require('underscore');
var request = require('request');
var iconv = require('iconv');
var utf8 = require('utf8');

var ic = new iconv.Iconv('iso-8859-1', 'utf-8');

function decodePage(html) {
  var buf = ic.convert(html);
  return utf8.decode(buf.toString())
}

function extractRating($, ratingType) {
  return $('span:contains("' + ratingType + '")').parent().contents().filter(function() {
    if (this.nodeType === 3) {
      var parseResult = parseInt(this.nodeValue);
      return !isNaN(parseResult) && parseResult >= 0 && parseResult <= 100;
    }
    return false;
  });
}

var scrapeConfusionMessage = "This could be indicative that RateBeer has changed their layout and that this library needs an update. Please leave an issue on github!";

var rb = module.exports = {
  searchAll: function(q, cb) {
    var q = escape(q.replace(' ', '+'))
    request.post({
      url: 'http://www.ratebeer.com/findbeer.asp',
      headers: { 'Content-Type':'application/x-www-form-urlencoded' },
      body: 'beername=' + q,
      encoding: 'binary'
    }, function(err, response, html) {
      if (err) return cb(err);
      var $ = cheerio.load(decodePage(html));
      var result = $('table').first().find('td:first-child a').map(function() {
        var beer = $(this);
        return {
          name: beer.text().trim(),
          url: beer.attr('href')
        };
      });
      result = [].slice.apply(result)
      cb(null, result);
    });
  },
  search: function(q, cb) {
    rb.searchAll(q, function(e, result) {
      if (e) return cb(e);
      if (!result || result.length == 0) return cb();
      var sorted = _.sortBy(result, function(beer) {
        return similarity.compareTwoStrings(q, beer.name);
      }).reverse();
      cb(null, sorted[0]);
    });
  },
  getBeer: function(q, cb) {
    rb.search(q, function(e, beer) {
      if (e) return cb(e);
      else if (beer == null) return cb();
      else rb.getBeerByUrl(beer.url, cb);
    });
  },
  getBeerByUrl: function(url, cb) {
    request({
      url: 'http://www.ratebeer.com' + url,
      encoding: 'binary'
    }, function(err, response, html) {
      if (err) return cb(err);
      var $ = cheerio.load(decodePage(html));

      // Parse basic beer information
      var beerInfo = {
        name: $('[itemprop=name]').text(),
        ratingsCount: parseInt($('[itemprop=reviewCount]').text()),
        ratingsWeightedAverage: parseFloat($('[name="real average"] big strong').text())
      };

      // Parse overall and style rating
      beerInfo.ratingOverall = parseInt(extractRating($, 'overall').text());
      beerInfo.ratingStyle = parseInt(extractRating($, 'style').text());

      var titlePlate = $('big').first()
      
      if (!titlePlate.text().match(/brewed (by|at)/i)) {
        return cb(new Error("Page consistency check failed. " + scrapeConfusionMessage));
      }

      titlePlate = titlePlate.parent();
      beerInfo.brewery = titlePlate.find('big b a').text();
      var brewedAt = titlePlate.find('big > a').text();
      if (brewedAt) beerInfo.brewedAt = brewedAt;
      beerInfo.style = titlePlate.children('a').first().text();
      try { beerInfo.location = titlePlate.find('br:last-child')[0].nextSibling.data.trim() } catch(e){}

      var ibus = $('[title~=Bittering]').next('big').text();
      if (ibus) beerInfo.ibu = parseInt(ibus);

      var abv = $('[title~=Alcohol]').next('big').text();
      if (abv) beerInfo.abv = parseFloat(abv);

      var desc = $('[itemprop=reviewCount]').parents('div').first().next().text();
      if (desc) beerInfo.desc = desc.replace(/^COMMERCIAL DESCRIPTION/, '');

      var img = $('#beerImg').parent().attr('href');
      if (!img.match(/post\.asp/)) beerInfo.image = img;

      cb(null, beerInfo);
    })
  }
};

var google = require('google');
var url = require('url');
var _googleFallbackSearch = function(q, cb) {
  google.resultsPerPage = 1;
  google(q + ' site:ratebeer.com', function(err, next, links) {
    if (err) return cb(err);
    if (!links.length) return cb();
    if (!links[0].link.match(/com\/beer\//)) return cb();
    var urlComponents = url.parse(links[0].link);
    cb(null, { name: q, url: urlComponents.path });
  });
};
