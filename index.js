require('dotenv').config();
/**
 * Create express object.
 */
var express = require('express');
/**
 * Session object declear
 */
var session = require('express-session');
/**
 * Cookie object declear
 */
var cookieParser = require('cookie-parser');
/**
 * Create app object & assign express object.
 */
var app = express();
/**
 * Create reload object.
 */
var reload = require('reload');

var { PipelinesClient, withKeyCredentials, RecordsClient, CollectionsClient } = require('@sajari/sdk-node');
const { PipelineType } = require('@sajari/sdk-node/build/src/generated/api');
const db = require('./database/config');
/**
 * For set port or default 7000 posr.
 */
app.set('port', process.env.POST || 7000);
/**
 * Set view engine & point a view folder.
 */
app.set('view engine', 'ejs');
app.set('views', 'views');
/**
 * Register cookie
 */
app.use(cookieParser());
/**
 * Register session with secret key
 */
app.use(session({secret: 'kak'}));
/**
 * Add & register body parser
 */
var bodyParser = require('body-parser');
const { response } = require('express');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
/**
 * Set site title.
 */
app.locals.siteTitle = 'Ecommerce';
/**
 * set public folder is static to use any where.
 * Public folder contents js, css, images
 */
app.use(express.static('public'));
/**
 * Add routes.
 */
app.use(require('./routers/pages'));

app.get('/api/search', async function (req, res) {
  const q = req.query.q,
        results = [];
  if (!q || !q.length) {
    return res.json({success: true, results});
  }

  const keyCredentials = withKeyCredentials(process.env.SAJARI_KEY_ID, process.env.SAJARI_KEY_SECRET);

  const client = new CollectionsClient(keyCredentials);

  try {
    const response = await client.queryCollection(process.env.SAJARI_COLLECTION_ID, {
      variables: {
        q
      }
    });
    
    return res.json({success: true, results: response});
  } catch (e) {
    console.error(e);
    return res.json({success: false, message: 'An error occurred, please try again later.'});
  }
});

/**
 * Create server.
 */
var server = app.listen(app.get('port'), async function() {
  console.log('Running server on ' + app.get('port'));

  const keyCredentials = withKeyCredentials(process.env.SAJARI_KEY_ID, process.env.SAJARI_KEY_SECRET);

  //get pipelines in Sajari
  const pipelineClient = new PipelinesClient(process.env.SAJARI_COLLECTION_ID, keyCredentials);
  try {
    await pipelineClient.getDefaultPipeline(PipelineType.Record);
    await pipelineClient.getDefaultPipeline(PipelineType.Query);
  } catch (e) {
    //default pipeline does not exist, generate pipelines
    await pipelineClient.generatePipelines(process.env.SAJARI_COLLECTION_ID, {
      searchableFields: ['title', 'details']
    });
  }
  
  //retrieve records to upsert
  db.query('SELECT * FROM `products`', async function (error, results) {
    if (error) {
      console.error(error);
      return;
    }

    if (results.length) {
      //upsert records
      const recordsClient = new RecordsClient(process.env.SAJARI_COLLECTION_ID, keyCredentials);
      //upsert the result
      const result = await recordsClient.batchUpsertRecords({
        records: results
      });

      if (result.errors && result.errors.length) {
        console.error(result.errors);
      } else {
        console.log("upsert done");
      }
    }
  });
})

/**
 * Auto reload server.
 */
reload(server, app);