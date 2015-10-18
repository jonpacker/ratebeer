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
  }
};
