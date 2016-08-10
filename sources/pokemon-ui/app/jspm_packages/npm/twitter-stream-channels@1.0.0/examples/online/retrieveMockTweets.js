/* */ 
var credentials = require('../../twitter.credentials.json!systemjs-json');
require('../../main').launchMockDataRetriever(credentials, {
  output: __dirname + '/../../mocks/data/tweets.json',
  track: ['blue', 'white', 'yellow', 'green', 'orange', 'kiwi', 'apple', 'lemon', 'coconut', 'Luke', 'Leia', 'Han', 'Yoda'],
  maxNumber: 200,
  timeout: 50000
});
