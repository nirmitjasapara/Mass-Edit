# Mass Edit Server



### Users Endpoints

### ▸ `GET /api/users/:user_id`

Returns the data for the user specified by `user_id`.

If no user could be found by `user_id`, the server responds with a status `400`.

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Create local
1. pg_ctl start if not started yet
2. createdb -U user_name editordb
3. npm run migrate

## Tear Down
1. npm run migrate -- 0
2. dropdb db_name
3. pg_ctl stop

## Heroku
1. heroku create
2. heroku addons:create heroku-postgresql:hobby-dev
3. heroku config:set JWT_SECRET=paste-your-token-here

## Technology Stack

### Backend
- **Express** for handling API requests
- **Node** for interacting with the file system 
- **Knex.js** for interfacing with the **PostgreSQL** database
- **Postgrator** for database migration
- **Mocha**, **Chai**, **Supertest** for endpoints testing
- **JSON Web Token**, **bcryptjs** for user authentication / authorization
- **Xss** for cross-site scripting protection
- **Winston**, **Morgan** for logging and errors