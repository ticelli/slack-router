const Builder = require('ticelli-bot/builder');

module.exports = class TokenBuilder extends Builder {
  lookup(...classToPush) {
    this.push((train) => {
      if (train.memory) {
        train.memory.lookup(...classToPush.map(c => c.lookup(train)));
      }
    });
    return this;
  }
};
