# CATH / SWISS-MODEL API

[![Build Status](https://travis-ci.com/CATH-SWISSMODEL/cath-swissmodel-api.svg?branch=master)](https://travis-ci.com/CATH-SWISSMODEL/cath-swissmodel-api)

This repository is here to help development relating to the CATH / SWISS-MODEL API (2018 ELIXIR Implementation Study).

## Overview

The project provides a pipeline that models 3D structures from protein sequence. This effectively glues together APIs from two different bioinformatics resources (CATH and SWISS-MODEL): 

 * **API1**: Search a protein sequence against **CATH** to identify template alignments  
 * **API2**: Use **SWISS-MODEL** to generate 3D models for these alignments

Important parts of this repository:

```
├── cathsm   Client code for the CATH / SWISS-MODEL pipeline
├── cathapi  Code for backend CATH API (**API1**)
├── docs     General project admin
└── tests    General project tests
```

The code in `cathsm` is intended to provide simple interaction with the full pipeline.

The code in `cathapi` is the code used for the backend CATH API server (**API1**). This would
normally be running behind a firewall at CATH and therefore can be safely ignored for anything 
other than development purposes.

## Generating 3D models from sequence

Assuming **API1** is up and running in the expected location, then the following should work:

```sh
./scripts/cathsm-api \
  --user your_api_username \
  --infile sequences.fasta \
  --outdir ./output_pdb_dir
```

If **API1** is **not** running in the expected location (or you are developing/testing the backend server), 
the instructions below provide the steps involved in getting an instance of this server up and running 
on a local machine. After setting up a local server, you can point the pipeline at this local server by
adding `--api1_base=http://127.0.0.1:8000/`

```sh
./scripts/cathsm-api \
  --user your_api_username \
  --infile sequences.fasta \
  --outdir ./output_pdb_dir \
  --api1_base=http://127.0.0.1:8000
```

NB: this script assumes the same user account `<your_api_username>` has already been registered with 
both **API1** and **API2**.

## Running a local instance of **API1**

### Dependencies

Install dependencies (Redis is used as a cache/message broker):

```sh
# Ubuntu
sudo apt-get install redis 

# CentOS / RedHat
sudo yum install redis
```
Run the service in the background.

```sh
sudo systemctl enable redis
sudo systemctl start redis
```

### Python environment

Setup a local python virtual environment and install dependencies.

```sh
cd cath-swissmodel-api/cathapi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-to-freeze.txt
```

### Create a unique secret key

```sh
cd cath-swissmodel-api/cathapi
date | md5sum > secret_key.txt
```

### Run tests

```sh
cd cath-swissmodel-api/cathapi && source venv/bin/activate
pytest
```

### Update the local database

```sh
cd cath-swissmodel-api/cathapi && source venv/bin/activate
python3 manage.py makemigrations
python3 manage.py migrate
```

### Start a Celery worker (to process jobs)

```sh
cd cath-swissmodel-api/cathapi && source venv/bin/activate
CATHAPI_DEBUG=1 celery -A cathapi worker
```

### Start a local API server

```sh
cd cath-swissmodel-api/cathapi && source venv/bin/activate
CATHAPI_DEBUG=1 python3 manage.py runserver
```

An instance of **API1** should now be available at:

http://127.0.0.1:8000/


## API Overview

**API 1: Get3DTemplate (UCL)** -- For a given query protein sequence, identify the most appropriate known structural domain to use for the 3D structural modelling.

| Input | Output |
|---|---|
| protein sequence (FASTA) | <ul><li>template structure (PDB ID)</li><li>alignment (FASTA)</li></ul> |

**API 2: Get3DModel (SWISSMODEL)** -- For a given sequence, alignment and template identify the most appropriate known structural domain to use for the 3D structural modelling.

| Input | Output |
|---|---|
| <ul><li>protein sequence (FASTA)</li><li>template structure (PDB ID)</li><li> alignment (FASTA)</li></ul> | 3D coords (PDB) |

**API 3: GetFunData (CATH)** -- Provide access to functional terms and functional site data for the respective functional families (to provide additional annotations for query sequences).

| Input | Output |
|---|---|
| protein sequence (FASTA) | JSON |

**API 4: GetPutativeModelSequences (CATH)** -- Provide information on the number of potential models that can be built by a query structure (used by PDBe).

| Input | Output |
|---|---|
| protein sequence (FASTA) | UniProtKB accessions |


## Useful Links

### OpenAPI

* http://openapi.tools/ -- List of tools, libraries
* https://editor.swagger.io/ -- Live code editor
* https://github.com/openapitools/openapi-generator -- Generate backend code based on OpenAPI document

### OAuth2

* Specification docs - https://oauth.net/2/

There are a few different flows according to what particular type of authentication system is required, but typical authentication flow might look like:
1. client logs in, server generates token, server sends token back to client
1. client adds token to the header of all subsequent requests
1. server uses token to validate who is making the request
1. server checks that this user is authorised for this endpoint (eg. using OpenAPI spec)
1. client logs out

