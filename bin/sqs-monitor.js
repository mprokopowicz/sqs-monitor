#!/usr/bin/env node

'use strict';
const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .alias('q', 'queue')
  .describe('q', 'SQS queue urls, may be provided multiple times')
  .alias('i', 'interval')
  .default('i', 1)
  .describe('i', 'Refresh interval in seconds')
  .demandOption(['q'])
  .argv;


const QueueAttributesPoller = require('./../lib/queue-attributes-poller');
const Visualizer = require('./../lib/visualizer');
const TimeSeries = require('./../lib/time-series');

const queuesUrls = (Array.isArray(argv.queue) ? argv.queue : [argv.queue]).map(url => '' + url);
const interval = argv.interval * 1000;

const attributes = [QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGES];
const pollerOptions = Object.freeze({
  awsKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  attributes,
  interval
});
const pollersAndSeries = [];
const createPoller = (queueUrl) => new QueueAttributesPoller(Object.assign({queueUrl}, pollerOptions));
const createSeries = (queueUrl) => new TimeSeries({title: queueUrl.split('/').pop()});
const getChartData = () => pollersAndSeries.map(({series}) => series.toObject());
const visualizer = new Visualizer({interval});

queuesUrls.forEach((queueUrl) => {
  const poller = createPoller(queueUrl);
  const series = createSeries(queueUrl);


  poller.on(QueueAttributesPoller.EVENT_ATTRS, (attributes) => {
    series.addValue(parseInt(attributes[QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGES]));
    const data = getChartData();
    visualizer.setChartData(data);
  });
  poller.start();
  pollersAndSeries.push({ poller, series});
});

