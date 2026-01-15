# database
[PostgreSQL](https://www.postgresql.org) database with a migration system that doesn't rely on an ORM, allowing it to be a freestanding service.

## Dependencies
- Volumes
    1. `migrations` should target the migrations folder, and preferably be **read only**.
    2. `postgres` will contain the data for the database, which allows for persistent storage across `run`s.
- Environment Variables
    - _You can take a look at the `.env.example` file to see the required environment variables_

## Usage
```sh
mkdir files && make volume_create # Must be run only once
cp -R migrations/ files/migrations/ # Updates the migrations visible to the container
make # Builds the image, and runs the container.
```
