const Builder = require('ticelli-bot/builder');
const ChallengeBuilder = require('./challenge');
const TokenBuilder = require('./token');

module.exports = class SlackComponentBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request }) => !!(request && request.body));
  }

  get challenge() {
    const challengeBuilder = new ChallengeBuilder(this);
    this.push(challengeBuilder);
    return challengeBuilder;
  }

  get token() {
    const tokenBuilder = new TokenBuilder(this);
    this.push(tokenBuilder);
    return tokenBuilder;
  }

  httpAnswer(body) {
    this.push(async (train) => { train.setBody(body).close(); });
    return this;
  }

  callback(id) {
    this.assert(({ payload: { callback_id } }) => callback_id === id);
    return this;
  }
  callbackPart(id, markup = ':') {
    this.assert(({ payload }) => {
      payload.callback = payload.callback_id.split(markup);
      return payload.callback.indexOf(id) > -1;
    });
    return this;
  }
  action(name, value) {
    this
      .assert(({ payload: { actions } }) => actions
        .map(action => action.name === name && (!value || action.value === value))
        .reduce((a, b) => a || b))
      .push((req) => {
        req.actions = (req.payload.actions || []).reduce((a, b) => {
          if (b.value) {
            a[b.name] = b.value;
          }
          if (b.selected_options) {
            a[b.name] = b.selected_options.map(o => o.value).reduce((a, b) => b, null); // eslint-disable-line no-shadow
          }
          return a;
        }, {});
      });

    return this;
  }
  get when() {
    const builder = new this.constructor(this.parent);
    this.parent.push(builder);
    return builder;
  }
};
