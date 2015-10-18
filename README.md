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

### `ratebeer.searchAll(query, callback)`

Like `ratebeer.search`, but it returns all of the matching beers, rather than just
one. If `err` is undefined, `result` will always be an array.

