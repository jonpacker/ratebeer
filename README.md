# ratebeer

Tools for scraping ratebeer data.

## usage

```
npm install --save ratebeer
```

```javascript
require('ratebeer').search('7 Fjell Ulriken', function(err, result) {
  
})
```

## methods

### `ratebeer.search(query, callback)`

Search for a single beer. `callback` sends an `err` and `result` argument. If
there are no matches, `result` will be `undefined`. Returns only one result: if 
ratebeer gave more than one result, the one with the closest levenshtein distance
is returned.

Returns an object like this:
```
{ name: 'Nøgne Ø Imperial Stout (Whisky barrel edition)',
    url: '/beer/nogne-o-imperial-stout-whisky-barrel-edition/333945/' }
```

### `ratebeer.searchAll(query, callback)`

Like `ratebeer.search`, but it returns all of the matching beers, rather than just
one. If `err` is undefined, `result` will always be an array.

### `ratebeer.getBeer(query, callback)`

Get all the information for a particular beer that ratebeer has available. This
will search the name of the beer first, so you may be unspecific.

**Note: ratebeer's page formatting is really oldschool and uses almost no CSS
selectors or element IDs, so a ton of this scraping is very dependent on their
layout staying exactly the same. It is not very resistant to change. It should
give you a good error if things don't look right, but that's not certain. Use
this function defensively.**

Example result:

```
{ name: 'Bells Hopslam',
  ratingsCount: 2763,
  ratingsWeightedAverage: 4.2,
  ratingOverall: 100,
  ratingStyle: 100,
  brewery: 'Bells Brewery',
  style: 'Imperial IPA',
  ibu: 70,
  abv: 10,
  desc: 'Starting with six different hop varietals added to the brew kettle &  culminating with a massive dry-hop addition of Simcoe hops, Bells Hopslam Ale  possesses the most complex hopping schedule in the Bells repetoire. Selected specifically because of their aromatic qualities, these Pacific Northwest varieties contribute a pungent blend of grapefruit, stone fruit, and floral notes. A generous malt bill and a solid dollop of honey provide just enough body to keep the balance in check, resulting in a remarkably drinkable rendition of the Double India Pale Ale style.',
  image: 'http://res.cloudinary.com/ratebeer/image/upload/w_250,c_limit,q_85,d_beer_def.gif/beer_35488.jpg' }
```

### `ratebeer.getBeerByUrl(url, callback)`

Fetches the same data as `getBeer`, but with a path relative to ratebeer.com,
such as those returned by the `search` and `searchAll` functions.
