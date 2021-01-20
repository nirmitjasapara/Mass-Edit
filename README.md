# Express Boilerplate!

This is a boilerplate project used for starting new projects!

## Set up

Complete the following steps to start a new project (NEW-PROJECT-NAME):

1. Clone this repository to your local machine `git clone BOILERPLATE-URL NEW-PROJECTS-NAME`
2. `cd` into the cloned repository
3. Make a fresh start of the git history for this project with `rm -rf .git && git init`
4. Install the node dependencies `npm install`
5. Move the example Environment file to `.env` that will be ignored by git and read by the express server `mv example.env .env`
6. Edit the contents of the `package.json` to use NEW-PROJECT-NAME instead of `"name": "express-boilerplate",`
7. Create Migrations, seeder and specify the database in the config file
8. Create routers for endpoints and apply them in app.js
9. pg_ctl start if not started yet
10. createdb -U dunder_mifflin boilerplate
11. npm run migrate

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Tear Down
1. npm run migrate -- 0
2. dropdb boilerplate
3. pg_ctl stop

## Heroku
1. heroku create
2. heroku addons:create heroku-postgresql:hobby-dev
3. heroku config:set JWT_SECRET=paste-your-token-here