BEGIN TRANSACTION;

CREATE TABLE users
(
    id serial PRIMARY KEY,
    name varchar(100),
    pet varchar(100),
    age integer,
    email text UNIQUE NOT NULL,
    entries BIGINT DEFAULT 0,
    joined TIMESTAMP NOT NULL
);

COMMIT;