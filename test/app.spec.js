const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const xss = require("xss");

describe("Docs Endpoints", function() {
  let db;

  const {
    testSubstitutions,
    testUsers,
    testDocs
  } = helpers.makeSubstitutionsFixtures();

  const serializeDoc = doc => ({
    id: doc.id,
    name: xss(doc.name),
    text: xss(doc.text),
    creator_id: doc.creator_id,
    editor_id: doc.editor_id,
    judge_id: doc.judge_id,
    substitution_id: doc.substitution_id,
    current_category: doc.current_category
  });

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`GET /api/docs`, () => {
    context(`Given no docs`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/docs")
          .expect(200, { original: [], approved: [], edited: [] });
      });
    });

    context("Given there are docs in the database", () => {
      beforeEach("insert docs", () =>
        helpers.seedSubstitutionsTables(
          db,
          testUsers,
          testSubstitutions,
          testDocs
        )
      );

      it("responds with 200 and all of the docs", () => {
        return supertest(app)
          .get("/api/docs")
          .expect(200, helpers.makeExpectedDocs(testDocs, testSubstitutions));
      });
    });
  });

  describe(`POST /api/docs/, /api/templates/, /api/judge/`, () => {
    beforeEach("insert substitutes", () =>
      helpers.seedSubstitutionsTables(
        db,
        testUsers,
        testSubstitutions,
        testDocs
      )
    );

    it(`creates a doc, responding with 201 and the new doc`, function() {
      this.retries(3);
      const testUser = testUsers[0];
      const newDoc = {
        name: "newdoc1",
        text: "Test new doc"
      };
      return supertest(app)
        .post("/api/docs")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newDoc)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property("id");
          expect(res.body.name).to.eql(newDoc.name);
          expect(res.body.text).to.eql(newDoc.text);
          expect(res.body.creator_id).to.eql(testUser.id);
          expect(res.body.current_category).to.eql("original");
        })
        .expect(res =>
          db
            .from("docs")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.name).to.eql(newDoc.name);
              expect(row.text).to.eql(newDoc.text);
              expect(row.current_category).to.eql("original");
              expect(row.creator_id).to.eql(testUser.id);
            })
        );
    });
    it(`updates a doc with existing substitution, responding with 201 and the new doc`, function() {
      this.retries(3);
      const testSubstitution = testSubstitutions[0];
      const testUser = testUsers[1];
      const testDoc = testDocs[0];
      const newDoc = {
        doc_id: testDoc.id,
        selection: testSubstitution.id
      };
      return supertest(app)
        .post("/api/templates")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newDoc)
        .expect(201)
        .expect(res => {
          expect(res.body.id).to.eql(newDoc.doc_id);
          expect(res.body.substitution_id).to.eql(newDoc.selection);
          expect(res.body.editor_id).to.eql(testUser.id);
          expect(res.body.current_category).to.eql("edited");
        })
        .expect(res =>
          db
            .from("docs")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.substitution_id).to.eql(newDoc.selection);
              expect(row.current_category).to.eql("edited");
              expect(row.editor_id).to.eql(testUser.id);
            })
        );
    });
    it(`updates a doc with new substitution, responding with 201 and the new doc`, function() {
      this.retries(3);
      const testUser = testUsers[1];
      const testDoc = testDocs[0];
      const newDoc = {
        doc_id: testDoc.id,
        name: "newsub",
        substitutes: '[{from:"a",to:"b"}]'
      };
      return supertest(app)
        .post("/api/templates")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newDoc)
        .expect(201)
        .expect(res => {
          expect(res.body.id).to.eql(newDoc.doc_id);
          expect(res.body.editor_id).to.eql(testUser.id);
          expect(res.body.current_category).to.eql("edited");
        })
        .expect(res =>
          db
            .from("substitutions")
            .select("*")
            .where({ id: res.body.substitution_id })
            .first()
            .then(row => {
              expect(row.name).to.eql(newDoc.name);
              expect(row.substitution_string).to.eql(newDoc.substitutes);
              expect(row.user_id).to.eql(testUser.id);
            })
        );
    });
    it(`updates a doc by changing category to approved, responding with 201 and the new doc`, function() {
      this.retries(3);
      const testUser = testUsers[2];
      const testDoc = testDocs[0];
      const newDoc = {
        doc_id: testDoc.id,
        approved: true
      };
      return supertest(app)
        .post("/api/judge")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newDoc)
        .expect(201)
        .expect(res => {
          expect(res.body.id).to.eql(newDoc.doc_id);
          expect(res.body.judge_id).to.eql(testUser.id);
          expect(res.body.current_category).to.eql("approved");
        })
        .expect(res =>
          db
            .from("docs")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.current_category).to.eql("approved");
              expect(row.judge_id).to.eql(testUser.id);
            })
        );
    });
  });
});
