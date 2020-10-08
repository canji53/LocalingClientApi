'use strict';
const context = require('aws-lambda-mock-context');
const app = require('../app');
const event = require('./event');

/**
 * /content/list:[GET] TEST
 */
describe('app.readContentList()', () => {

  beforeEach(() => {
    jest.resetModules();
    process.env.ENVIRONMENT = 'dev';
  });

  describe('[成功]DynamoDBに格納されたメディアのリストを取得', () => {

    test('メディアリストを取得', async () => {
      const queryStringParameters = {
        lastEvaluatedKey: null,
        limit: 5,
        prefecture: '',
        order: 'false'
      };
      event.queryStringParameters = queryStringParameters; // クエリパラメータに追加
      const response = await app.readContentList(event, context({timeout: 10}), function(){});
      expect(response.statusCode).toBe(200);
    });
  });

});
