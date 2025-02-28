# Docker installation

## Preparation

_First be sure to have docker installed and running on your machine._

Pull the project
```shell
git clone https://github.com/Project-OSmOSE/osmose-app.git
```

### Environment
Create a `.env` file at the root of the project:
```.env
ENV=production
SECRET_KEY=
OSMOSE_HOST=localhost
OSMOSE_DB_USER=postgres
OSMOSE_DB_PWD=postgres
STAGING=true
HTTPS_PORTAL_STAGE=local
```
You can fill the `SECRET_KEY` with any hash you want. (You can find a generator here: https://djecrety.ir/)

### Database
The data of the database will be stored in a `/volumes/postgres` folder in the project root folder.

This folder is defined in the `docker-compose.yml` at the `db` service.
You can change it at any moment by modifying the volumes mount.

::: info Note
The format for volume mount is [local mount]:[container mount], only the local mount should be changed.
:::

#### If you already have a database

In the `.env` file, fill the `OSMOSE_DB_USER`, `OSMOSE_DB_PWD` fields with the ones of your database.

In the `docker-compose.yml` file:
- remove the `db` service
- in the `osmose_back` service, set you database host in the environment field `OSMOSE_DB_HOST`


### Data storage

To access the audio files and spectrogram, APLOSE mount the volume where the data is located inside its containers (see `osmose_back` and `osmose_front` services volumes).

For development purpose we use a `/volumes/datawork` folder in the project root folder. This can be changed at any moment. Just be sure to update it both in front and back services.

::: info Note
The format for volume mount is [local mount]:[container mount], only the local mount should be changed.
:::



## Run

To run the application, execute:
```shell
docker compose [--env-file {filename}] up -d --build
```
The `--env-file` is only useful if you  don't use the default environment file: ".env".

It can take some time before the containers have fully started. All the 4 containers should have a "Up" status before continuing. You can check the status with the `docker-compose ps` command

### Create superuser

In order to access APLOSE you will need to create a first user:
```shell
docker-compose exec osmose_back poetry run python ./manage.py createsuperuser
```

APLOSE should then be available on https://localhost/app/

If you need to add extra user, it will be in the administration site at https://localhost/backend/admin/

The created superuser can access both APLOSE and its administration site.

