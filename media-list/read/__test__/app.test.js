"use strict";
const context = require("aws-lambda-mock-context");
const app = require("../app");
const event = require("./event");

/**
 * /admin/media:[GET] TEST
 */
describe("app.readMediaList()", () => {

  beforeEach(() => {
    jest.resetModules();
    process.env.ENVIRONMENT = 'dev';
  });

  describe("[成功]DynamoDBに格納されたメディアのリストを取得", () => {
    test("メディアリストを取得", async () => {
      const queryStringParameters = {
        lastEvaluatedKey: null,
        limit: 2,
        prefecture: '',
        order: 'false',
        publicState: 0
      };
      event.queryStringParameters = queryStringParameters; // クエリパラメータに追加
      const response = await app.readMediaList(event, context(), function(){});
      expect(response.statusCode).toBe(200);
    });
  });
});
