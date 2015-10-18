var cheerio = require('cheerio');
var similarity = require('string-similarity');
var _ = require('underscore');
var request = require('request');
var iconv = require('iconv');
var utf8 = require('utf8');

var map = Array.prototype.map;

var ic = new iconv.Iconv('iso-8859-1', 'utf-8');
function decodePage(html) {
  var buf = ic.convert(html);
  return utf8.decode(buf.toString())
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
      var beerInfo = {
        name: $('[itemprop=itemreviewed]').text()
      }

      var ratings = _.chain($('span[itemprop=rating] span')).map(function(span) {
        return parseInt($(span).text())
      }).filter(function(parseResult) {
        return !isNaN(parseResult) && parseResult >= 0 && parseResult <= 100
      }).value();

      if (ratings.length != 2) {
        return cb(new Error("Ambiguous result when parsing ratings: [" + ratings.join(', ') + "]." + scrapeConfusionMessage));
      }

      beerInfo.ratingOverall = ratings[0];
      beerInfo.ratingStyle = ratings[1];

      var titlePlate = $('big').first()
      
      if (!titlePlate.text().match(/^Brewed by/)) {
        return cb(new Error("Page consistency check failed. " + scrapeConfusionMessage));
      }

      titlePlate = titlePlate.parent();
      beerInfo.brewery = titlePlate.find('big b a').text();
      beerInfo.style = titlePlate.children('a').first().text();
      try { beerInfo.location = titlePlate.find('br:last-child')[0].nextSibling.data.trim() } catch(e){}

      cb(null, beerInfo);
    })
  }
};
