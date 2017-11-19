'use strict';

const debug = require('debug');

class TimeSeries {
  constructor(options) {
    this._options = Object.assign({
      title: 'untitled',
      maxPoints: 60
    }, options);
    this._logger = debug(`SQSMonitor:TimesSeries:${this._options.label}`);
    this.x = [];
    this.y = [];
    this._logger('created');
  }

  addValue(value) {
    this._logger('adding value: ', value);
    this.x = TimeSeries._trimArray(this.x.concat(new Date()), this._options.maxPoints);
    this.y = TimeSeries._trimArray(this.y.concat(value), this._options.maxPoints);
  }

  static _trimArray(array, maxLength) {
    if(array.length > maxLength) {
      return array.slice(array.length - maxLength);
    }
    return array;
  }

  toObject() {
    return {
      title: this._options.title,
      x: this.x.slice(),
      y: this.y.slice()
    }
  }
}

module.exports = TimeSeries;