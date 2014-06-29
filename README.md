quick-api-mock
==============

Quickly mock a json REST API from a directory structure

```
dir/
---test/
-------get.json # JSON response for GET /test
-------{id}/
-----------get.json # JSON response for GET /test/:id
---state/
--------get.js # Javascript file to execute for GET /state
```

```
var apimock = require('apimock');
apimock.build('dir');
```
