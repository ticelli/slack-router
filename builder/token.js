const Builder = require('ticelli-bot/builder');

module.exports = class TokenBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request: { body } }) => !!(body.token));
  }
  get isBad() {
    this.assert(({ slack: { validationToken }, request: { body } }) => body.token !== validationToken);
    return this;
  }
  throw(...data) {
    return super.throw(...data).root;
  }
};
