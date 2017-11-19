'use strict';

const debug = require('debug');
const blessed = require('blessed');
const blessedContrib = require('blessed-contrib');
const colors = ['blue', 'red', 'green', 'yellow', 'pink', 'orange'];
const pad  = (string, length = 2 , fill = '0') => {
  while (('' + string).length < length) {
    string = fill + string;
  }
  return string;
};
const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

class Visualizer {
  constructor(options) {

    this._logger = debug('SQSMonitor:Visualizer');

    this._options = Object.assign({
      title: 'Approximate number of messages',
      interval: 1000,
    }, options);


    this._screen = this._createScreen([this._chart]);
    this._chart = this._createChart();
    this._screen.append(this._chart);


    this._logger('created');

    setInterval(() => this._screen.render(), this._options.interval);
  }

  _createScreen() {
    const screen = blessed.screen({
      smartCSR: true,
      title: 'SQSMonitor'
    });

    screen.render();
    return screen;
  }

  _createChart() {
    return blessedContrib.line({
      style: {line: 'yellow', text: 'green', baseline: 'black'},
      xLabelPadding: 3,
      xPadding: 5,
      showLegend: true,
      legend: {width: 32},
      wholeNumbersOnly: true,
      label: this._options.title
    });
  }

  setChartData(chartData) {
    this._logger('set chart data', chartData);
    const styledChartData = chartData.map((series, index) => (
      Object.assign({}, series, {
          style: {line: colors[index % colors.length]},
          x: series.x.map(date => formatTime(date))
        })
    ));

    this._chart.setData(styledChartData);
  }
}
module.exports = Visualizer;