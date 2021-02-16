# Mass Edit Server

### Users Endpoints

### POST `/api/auth/login`

```js
// req.body
{
  user_name: String,
  password: String
}

// res.body
{
  authToken: String
}
```

### POST `/api/auth/register`

```js
// req.body
{
  user_name: String,
  full_name: String,
  password: String
}

// res.body
{
  user_name: String,
  full_name: String,
  password: String,
  date_created: Timestamp
}
```

### GET `/api/docs/`

```js
Returns all the documents
// res.body
[
  id: ID,
  name: String,
  text: String,
  creator_id: UserId,
  editor_id: UserId,
  judge_id: UserId,
  substitution_id: SubstitutionId,
  current_category: doc.current_category
]
```

### POST `/api/docs/`

Creates a new document. Requires a name and text with an AuthToken for the UserID.

```js
// req.body
{
  name: String,
  text: String
}

// req.header
Authorization: Bearer ${token}

// res.body
{
  id: ID,
  name: String,
  text: String,
  creator_id: UserId,
  editor_id: UserId,
  judge_id: UserId,
  substitution_id: SubstitutionId,
  current_category: doc.current_category
}
```

### DELETE `/api/docs/:id`

```js
// req.params
{
  id: ID
}
// res.body
[
  status: 204
]
```

### POST `/api/templates/`

Updates a document `doc_id` with the appropriate TemplateID `selection` if given.
If TemplateID is not given, the `name` and `substitutes` fields will create a new template and use the new TemplateID to update the document.

```js
// req.body
{
  doc_id: DocId,
  name: String,
  selection: TemplateId,
  substitutes: String
}

// req.header
Authorization: Bearer ${token}

// res.body
{
  id: ID,
  name: String,
  text: String,
  creator_id: UserId,
  editor_id: UserId,
  judge_id: UserId,
  substitution_id: SubstitutionId,
  current_category: doc.current_category
}
```

### DELETE `/api/templates/:id`

```js
// req.params
{
  id: ID
}
// res.body
[
  status: 204
]
```

### POST `/api/judge/`

If approved is true, `current_category` becomes `approved`.
Else, `current_category` becomes `original`

```js
// req.body
{
  doc_id: DocId,
  approved: Boolean
}

// req.header
Authorization: Bearer ${token}

// res.body
{
  id: ID,
  name: String,
  text: String,
  creator_id: UserId,
  editor_id: UserId,
  judge_id: UserId,
  substitution_id: SubstitutionId,
  current_category: doc.current_category
}
```

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
