'use strict';
const context = require('aws-lambda-mock-context');
const app = require('../app');
const event = require('./event');
const dotenv = require('dotenv');
dotenv.config();

/**
 * /contact:[POST] TEST
 */
describe('app.sendMessage()', () => {

  beforeEach(() => {
    jest.resetModules();
  });

  describe('[成功例]SendGridでメッセージ送信', () => {
    test('パラメータ欠損なし', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: process.env.FROM_EMAIL,
          subject: 'これは無題',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(200);
    });

    test('件名なし', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: process.env.FROM_EMAIL,
          subject: '',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(200);
    });
  });

  describe('[失敗例]SendGridでメッセージ送信', () => {
    test('nameの未設定', async () => {
      const body = {
        body: JSON.stringify({
          name: '',
          email: process.env.FROM_EMAIL,
          subject: '',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('nameが20文字以上入力されている', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テストテストテストテストテストテストテスト', // 21文字
          email: process.env.FROM_EMAIL,
          subject: '',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('emailの未設定', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: '',
          subject: '',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('emailが正しくない', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: 'test@',
          subject: '',
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('subjectが100文字以上入力されている', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: process.env.FROM_EMAIL,
          subject: 'テストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテスト', // 102文字
          body: 'これはテストです。'
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('bodyが未設定', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: process.env.FROM_EMAIL,
          subject: '',
          body: ''
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });

    test('bodyが400文字以上入力されている', async () => {
      const body = {
        body: JSON.stringify({
          name: 'テスト太郎',
          email: process.env.FROM_EMAIL,
          subject: '',
          body: 'テストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテストテスト' // 402文字
        })
      };
      const _event = Object.assign(event, body);
      const response = await app.sendMessage(_event, context({timeout:10}), function(){});
      expect(response.statusCode).toBe(400);
    });
  });

});
