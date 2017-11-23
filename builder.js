const Builder = require('ticelli-bot/builder');
const shuffle = require('lodash.shuffle');

module.exports = class SlackComponentBuilder extends Builder {
  randomReact(...reacts) {
    return this.react(...shuffle(reacts));
  }
  react(react) {
    this.stack.push((_, res) => res.reactToMessage(react));
    return this;
  }
};