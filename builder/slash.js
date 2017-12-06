const Builder = require('ticelli-bot/builder');
const TokenBuilder = require('./token');
const MemoryBuilder = require('./memory');
const CommandBuilder = require('./command');

module.exports = class SlackSlashBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request }) => !!(request && request.body));
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

  get when() {
    const builder = new this.constructor(this.parent);
    this.parent.push(builder);
    return builder;
  }

  get memory() {
    const eventBuilder = new MemoryBuilder(this);
    this.push(eventBuilder);
    return eventBuilder;
  }

  setClient() {
    this.push((train) => {
      this.root.setClient(train);
    });
    return this;
  }
  command(...params) {
    const commandBuilder = new CommandBuilder(this, ...params);
    this.push(commandBuilder);
    return commandBuilder;
  }
};
