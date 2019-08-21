\set cathapiuser `echo "$DJANGO_DB_USR"`
CREATE USER :cathapiuser PASSWORD 'md5ac4bbe016b808c3c0b816981f240dcae' CREATEROLE LOGIN;
