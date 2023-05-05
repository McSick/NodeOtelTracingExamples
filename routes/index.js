var express = require('express');
var router = express.Router();
var TraceExamples = require('../models/TracingExamples');
let traceModel = new TraceExamples();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/newtrace', function(req, res, next) {
  traceModel.createNewTrace();
  res.render('index', { title: 'New Trace' });
});

router.get('/existingtrace', async function(req, res, next) {
  await traceModel.addToExistingTrace();
  res.render('index', { title: 'Existing Trace' });
});

router.get('/currentspan', async function(req, res, next) {
  await traceModel.addToCurrentSpan();
  res.render('index', { title: 'Current Span' });
});
router.get('/bcrypt', async function(req, res, next) {
  let rounds = parseInt(req.query.rounds);
  await traceModel.bcryptExample(rounds);
  res.render('index', { title: 'bcrypt' });
});

router.get('/spawnsync', async function(req, res, next) {
  await traceModel.spawnSyncExample();
  res.render('index', { title: 'spawnsync' });
});

router.get('/spanattributes', function(req, res, next) {
  traceModel.spanAttributes();
  res.render('index', { title: 'Adding Span Attributes' });
});

router.get('/spanevents', function(req, res, next) {
  traceModel.spanEvent();
  res.render('index', { title: 'Added Span Events' });
});

router.get('/spanerror', function(req, res, next) {
  traceModel.spanError();
  res.render('index', { title: 'Added Span Error' });
});

router.get('/spanlinks', function(req, res, next) {
  traceModel.spanLinks();
  res.render('index', { title: 'Added Span Links' });
});

router.get('/workerjob', function(req, res, next) {
  traceModel.workerJobs();
  res.render('index', { title: 'Spawn worker and run jobs' });
});

router.get('/rollupspan', function(req, res, next) {
  traceModel.rollUpSpan();
  res.render('index', { title: 'rollUpSpan ' });
});
router.get('/await', async function(req, res, next) {
  traceModel.init();
  res.render('index', { title: 'Await ' });
});
router.get('/calldownstream', async function(req, res, next) {
  traceModel.callDownstream();
  res.render('index', { title: 'classpass ' });
});
router.get('/contextProcessorExample', async function(req, res, next) {
  traceModel.contextProcessorExample();
  res.render('index', { title: 'classpass ' });
});
router.get('/baggageExample', async function(req, res, next) {
  traceModel.baggageExample();
  res.render('index', { title: 'classpass ' });
});

module.exports = router;
