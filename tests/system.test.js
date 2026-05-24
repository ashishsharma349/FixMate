const request = require("supertest");
const app = require("../app");
const dbTestHelper = require("./dbTestHelper");

describe("FixMate Integration Tests - Test Harness", () => {
  beforeAll(async () => {
    await dbTestHelper.connect();
  });

  afterAll(async () => {
    await dbTestHelper.close();
  });

  afterEach(async () => {
    await dbTestHelper.clear();
  });

  describe("API Verification", () => {
    it("should reject access to protected /check-login endpoint without JWT", async () => {
      const response = await request(app).get("/check-login");
      // Expect 401 Unauthorized because verifyToken middleware blocks requests without a valid cookie or token
      expect(response.status).toBe(401);
    });

    it("should respond with 404 for nonexistent endpoints", async () => {
      const response = await request(app).get("/nonexistent-route");
      expect(response.status).toBe(404);
    });
  });
});
