const Builder = require('ticelli-bot/builder');

module.exports = class SlackCommandBuilder extends Builder {
  constructor(parent, command) {
    super(parent);
    this.assert(({ request: { body } }) => body.command && body.command.startsWith(command));
  }
  ephemeral(content) {
    this.push(train => train.slack.ephemeral(content));
    return this;
  }
};
