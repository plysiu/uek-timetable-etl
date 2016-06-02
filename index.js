var models = require('uekplan-models');
var fs = require('fs');
var util = require('util');
var CONFIG = require('./config');

var neverEndingStory = () => {
  /**
   * Create new log record
   */
  var x;
  models.log.create({})
    .then((log) => {
      var data = {};
      x = data.logEntry = log;
      return Promise.resolve(data);
    })
    .then((data) => {
      return require('./extract').downloadAll(data);
    })
    // .then((data)=> {
    //   if (fs.existsSync('./data.json')) {
    //     data.logEntry = x;
    //     console.log('Reading data from cache');
    //     return Promise.resolve(JSON.parse(fs.readFileSync('./data.json')));
    //   } else {
    //     console.log('Saving data to cache');
    //     fs.writeFileSync('./data.json', JSON.stringify(data));
    //     return Promise.resolve(data);
    //   }
    // })
    .then((data) => {
      return require('./transformLabels')(data);
    })
    .then((data) => {
      return require('./labels').updateLabels(data);
    })
    .then((data) => {
      return require('./transformEvents')(data);
    })
    .then((data) => {
      return require('./exceptions')(data);
    })
    .then((data) => {
      return require('./temporary')(data);
    })
    .then((data) => {
      return require('./diff').moveEventsFromTemporaryTable(data);
    })
    .then((data) => {
      return require('./diff').undeletedEventsWhenExistsInTemporaryTable(data);
    })
    .then((data) => {
      return require('./diff').deleteEventsWhenNotExistsInTemporaryTable(data);
    })
    .then(() => {
      console.log('Done');
    })
    .catch((e) => {
      console.log(e.message);              // "Hello"
      console.log(e.name);                 // "TypeError"
      console.log(e.fileName);             // "someFile.js"
      console.log(e.lineNumber);           // 10
      console.log(e.columnNumber);         // 0
      console.log(e.stack);
    });
};
models.sequelize
  .sync({})
  .then(() => {
    neverEndingStory();
    setInterval(() => {
      neverEndingStory();
    }, 1000 * 60 * 60 * (CONFIG.INTERVAL || 6));
  });
