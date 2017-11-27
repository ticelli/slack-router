const Builder = require('ticelli-bot/builder');

module.exports = class BotBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request: { body } }) => !!(body.event.bot_id));
  }
};
