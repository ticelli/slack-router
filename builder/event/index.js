const Builder = require('ticelli-bot/builder');
const shuffle = require('lodash.shuffle');

const BotBuilder = require('./bot');
const ChannelBuilder = require('./channel');

module.exports = class EventBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request: { body } }) => !!(body.event));
  }

  get isBot() {
    const botBuilder = new BotBuilder(this);
    this.push(botBuilder);
    return botBuilder;
  }

  get channel() {
    const channelBuilder = new ChannelBuilder(this);
    this.push(channelBuilder);
    return channelBuilder;
  }

  reply(content) {
    this.push(train => train.slack.reply(content));
    return this;
  }

  react(...emojiTags) {
    this.push(train => [].concat(emojiTags).forEach(emoji => train.slack.react(emoji)));
    return this;
  }

  randomReact(...emojiTags) {
    this.push(train => train.slack.react(shuffle(emojiTags).shift()));
    return this;
  }

  get when() {
    const builder = new this.constructor(this.parent);
    this.parent.push(builder);
    return builder;
  }

  get notReplied() {
    return this.assert(train => !train.isAnswered);
  }

  setClient() {
    this.push((train) => {
      this.root.setClient(train);
    });
    return this;
  }
};
