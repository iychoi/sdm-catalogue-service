# SDM Catalogue Service CLI

This module provides command line interface to SDM Catalogue Service.

Run
---

Make sure that Syndicate HTTP Server is running.

Use command-line programs for controlling the server.
- `sdm-cs-add-dataset`: Add a new dataset
- `sdm-cs-remove-dataset`: Remove a dataset
- `sdm-cs-list-dataset`: List datasets



Examples
--------

```
node ./list_datasets.js
```

```
node ./add_dataset.js -n user_rest@syndicate.org -k user_rest.pkey -d pov -m http://syndicate-ms-datasets-prod.appspot.com:80 -g ug_pov_anonymous --description "Pacific Oceans Virome Dataset"
```
