'use strict';

const {SQS} = require('aws-sdk');
const EventEmitter = require('events');
const debug = require('debug');

/**
 * Will emit events in given interval with queue attributes values
 */
class QueueAttributesPoller extends EventEmitter {
  /**
   * Creates new queue attributes poller
   * @param {{}} options
   * @param {string} options.queueUrl url of the queue to get attributes for
   * @param {string[]} [options.attributes=[ATTR_APPROXIMATE_NUMBER_OF_MESSAGES]] url of the queue to get attributes for
   * @param {string[]} [options.region=us-east-'] aws region
   * @param {string[]} [options.accessKeyId=''] aws key id
   * @param {string[]} [options.secretAccessKey=''] aws secret access key
   */
  constructor(options) {
    super();
    this._options = Object.assign({
      interval: 1000,
      attributes: [QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGES]
    }, options);
    this._started = false;
    this._nextFetchTimeout = null;
    this._logger = debug(`SQSMonitor:QueueAttributesPoller:${this._options.queueUrl}`);
    this._logger('created');
    this._sqs = new SQS({
      interval: 1000,
      accessKeyId: options.accessKeyId || '',
      secretAccessKey: options.secretAccessKey || '',
      region: options.region || 'us-east-1'
    });


    this._getAttributes = this._getAttributes.bind(this);
    this._handleGetAttributesResponse = this._handleGetAttributesResponse.bind(this);
  }

  /**
   * Start fetching attributes
   */
  start() {
    this._started = true;
    this._logger('star polling');
    this._getAttributes();
  }

  /**
   * Checks if poller is running
   * @return {boolean} true if is already started
   */
  isStarted() {
    return this._started;
  }

  /**
   * Stops polling
   */
  destroy() {
    this._started = false;
    clearInterval(this._nextFetchTimeout);
    this._logger('destroyed');
  }

  _getAttributes() {
    const params = {
      QueueUrl: this._options.queueUrl,
      AttributeNames: this._options.attributes
    };
    this._logger('getting attributes: %j', params);

    this._sqs.getQueueAttributes(params).promise().then(this._handleGetAttributesResponse);
  }

  _handleGetAttributesResponse(response) {
    this._logger('_handleGetAttributesResponse', response);

    if(!this._started) {
      this._logger('poller stopped: ignoring response');
      return;
    }

    this.emit(QueueAttributesPoller.EVENT_ATTRS, response['Attributes']);
    this._scheduleNextFetch();
  }

  _scheduleNextFetch() {
    this._logger('scheduling next fetch');
    if (!this._started) {
      this._logger('next fetch will not be scheduled, poller stopped');
      return;
    }

    this._nextFetchTimeout = setTimeout(this._getAttributes, this._options.interval);
    this._logger(`next fetch scheduled in ${this._options.interval}ms`);
  }
}

QueueAttributesPoller.EVENT_ATTRS = 'attributes';

QueueAttributesPoller.ATTR_ALL = 'All';
QueueAttributesPoller.ATTR_POLICY = 'Policy';
QueueAttributesPoller.ATTR_VISIBILITY_TIMEOUT = 'VisibilityTimeout';
QueueAttributesPoller.ATTR_MAXIMUM_MESSAGE_SIZE = 'MaximumMessageSize';
QueueAttributesPoller.ATTR_MESSAGE_RETENTION_PERIOD = 'MessageRetentionPeriod';
QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGES = 'ApproximateNumberOfMessages';
QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGESNOT_VISIBLE = 'ApproximateNumberOfMessagesNotVisible';
QueueAttributesPoller.ATTR_CREATED_TIMESTAMP = 'CreatedTimestamp';
QueueAttributesPoller.ATTR_LAST_MODIFIED_TIMESTAMP = 'LastModifiedTimestamp';
QueueAttributesPoller.ATTR_QUEUE_ARN = 'QueueArn';
QueueAttributesPoller.ATTR_APPROXIMATE_NUMBER_OF_MESSAGES_DELAYED = 'ApproximateNumberOfMessagesDelayed';
QueueAttributesPoller.ATTR_DELAY_SECONDS = 'DelaySeconds';
QueueAttributesPoller.ATTR_RECEIVE_MESSAGE_WAIT_TIME_SECONDS = 'ReceiveMessageWaitTimeSeconds';
QueueAttributesPoller.ATTR_REDRIVE_POLICY = 'RedrivePolicy';
QueueAttributesPoller.ATTR_FIFO_QUEUE = 'FifoQueue';
QueueAttributesPoller.ATTR_CONTENT_BASED_DEDUPLICATION = 'ContentBasedDeduplication';
QueueAttributesPoller.ATTR_KMS_MASTER_KEY_ID = 'KmsMasterKeyId';
QueueAttributesPoller.ATTR_KMS_DATA_KEY_REUSE_PERIOD_SECONDS = 'KmsDataKeyReusePeriodSeconds';

module.exports = QueueAttributesPoller;