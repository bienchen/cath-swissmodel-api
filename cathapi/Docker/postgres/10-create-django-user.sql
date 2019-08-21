\set cathapiuser `echo "$DJANGO_DB_USR"`
\set cathapipw `echo "$DJANGO_DB_PW"`
CREATE USER :cathapiuser PASSWORD :'cathapipw' CREATEROLE LOGIN;
