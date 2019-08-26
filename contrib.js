var blessed = require('blessed')
  , contrib = require('blessed-contrib')

import AWS from 'aws-sdk';

var screen = blessed.screen({smartCSR: true})
const cloudformation = new AWS.CloudFormation({ region: process.argv[3] });
const cloudwatch = new AWS.CloudWatch({ region: process.argv[3] });
const cloudwatchLogs = new AWS.CloudWatchLogs({ region: process.argv[3] });

const getLambdaMetrics = (functionName, cb) => {
  var params = {
    EndTime: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789, /* required */
    MetricDataQueries: [ /* required */
      {
        Id: 'testing', /* required */
        MetricStat: {
          Metric: { /* required */
            Dimensions: [
              {
                Name: "FunctionName",
                Value: functionName
            },
            {
                Name: "Resource",
                Value: functionName
            }
              /* more items */
            ],
            MetricName: 'Duration',
            Namespace: 'AWS/Lambda'
          },
          Period: '300', /* required */
          Stat: 'Average', /* required */
        },
        ReturnData: true || false
      },
      /* more items */
    ],
    StartTime: "2019-08-18T17:10:00.000Z"
  };
  cloudwatch.getMetricData(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     cb(data);           // successful response
  });
}


//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

/**
 * Donut Options
  self.options.radius = options.radius || 14; // how wide is it? over 5 is best
  self.options.arcWidth = options.arcWidth || 4; //width of the donut
  self.options.yPadding = options.yPadding || 2; //padding from the top
 */
var donut = grid.set(8, 8, 4, 2, contrib.donut, 
  {
  label: 'Percent Donut',
  radius: 16,
  arcWidth: 4,
  yPadding: 2,
  data: [{label: 'Storage', percent: 87}]
})

var gauge_two = grid.set(8, 10, 2, 2, contrib.gauge, {label: 'Deployment Progress', percent: 80})

var sparkline = grid.set(10, 10, 2, 2, contrib.sparkline, 
  { label: 'Throughput (bits/sec)'
  , tags: true
  , style: { fg: 'blue', titleFg: 'white' }})

var bar = grid.set(4, 6, 4, 3, contrib.bar, 
  { label: 'Server Utilization (%)'
  , barWidth: 4
  , barSpacing: 6
  , xOffset: 2
  , maxHeight: 9})

var table =  grid.set(0, 6, 4, 6, contrib.table, 
  { keys: true
  , fg: 'green'
  , label: 'Lambda Functions'
  , columnSpacing: 1
  , columnWidth: [44, 60]})


  const getLambdasForStackName = (stackName, setData) => {
    return cloudformation.listStackResources(
      { StackName: stackName },
      (err, data) => {
        if (err) {
          console.log(err, err.stack);
        } else {
          setData(data.StackResourceSummaries.filter(
            res => res.ResourceType === 'AWS::Lambda::Function',
            ).map(lam => [lam.PhysicalResourceId, lam.LastUpdatedTimestamp]));
           screen.render()        
        }
      },
    );
  }


// var errorsLine = grid.set(4, 9, 4, 3, contrib.line, 
//   { style: 
//     { line: "red"
//     , text: "white"
//     , baseline: "black"}
//   , label: 'Errors Rate'
//   , maxY: 60
//   , showLegend: true })

var invocationsLineGraph = grid.set(2, 0, 6, 6, contrib.line, 
          { 
          maxY: 5000
          , label: 'Average Invocation Duration'
          , showLegend: true
          , xPadding: 10
          , legend: {width: 50}})

var map = grid.set(4, 9, 4, 3, contrib.map, {label: 'Servers Location'})

var log = grid.set(8, 0, 4, 8, blessed.log, 
  { fg: "green"
  , selectedFg: "green"
  , label: 'Server Log'
  , interactive: true
  , scrollbar: { bg: 'blue' }
  , mouse: true })


//dummy data
var servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1']


var gauge_percent_two = 0
setInterval(function() {
  gauge_two.setData(gauge_percent_two);
  gauge_percent_two++;
  if (gauge_percent_two>=100) gauge_percent_two = 0  
}, 200);


//set dummy data on bar chart
function fillBar() {
  var arr = []
  for (var i=0; i<servers.length; i++) {
    arr.push(Math.round(Math.random()*10))
  }
  bar.setData({titles: servers, data: arr})
}
fillBar()
setInterval(fillBar, 2000)


function randomColor() {
  return [Math.random() * 255,Math.random()*255, Math.random()*255]
}

function generateTable() {
  getLambdasForStackName(process.argv[2], (lambdaFunctions => {
    table.setData({headers: ['logical', 'updated'], data: lambdaFunctions})
    table.rows.on('select', (item) => {
      const funcName = item.content.split("   ")[0]
      getLambdaMetrics(funcName, metrics => {
        const functionDurationData = {
          title: funcName,
          style: { line: randomColor() },
          x: metrics.MetricDataResults[0].Timestamps,
          y: metrics.MetricDataResults[0].Values,
        }
        setLineData([functionDurationData], invocationsLineGraph)
      })
      getLogStreams(`/aws/lambda/${funcName}`)
    })
  }));
}


const getLogEvents = (logGroupName, logStreamNames) => {
  if (logStreamNames.length === 0) {
    log.setContent('ERROR: No log streams found for this function.');
    return;
  }
  var params = {
    logGroupName: logGroupName,
    interleaved: true,
    logStreamNames,
    limit: 10,
  };
  cloudwatchLogs.filterLogEvents(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      const events = data.events
      log.setContent('')
      events.forEach(event => { log.log(event.message)})
    }
  });
}

const getLogStreams = logGroupName => {
  var params = {
    logGroupName,
    descending: true,
    limit: 5,
    orderBy: "LastEventTime",
  };
  cloudwatchLogs.describeLogStreams(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      getLogEvents(logGroupName, data.logStreams.map(stream => stream.logStreamName))
    }
  });
}

// const getLogs = (stackName) => {
//   var params = {
//     logGroupNamePrefix: `/aws/lambda/${stackName}`,
//   };
//   cloudwatchLogs.describeLogGroups(params, (err, data) => {
//     if (err) {
//       console.log(err, err.stack);
//     } else {
//       // console.log(data.logGroups)
//       // getLogEvents(data.logGroups.filter(group => group.logGroupName === "/aws/lambda/example")[0].logGroupName);
//       getLogStreams(data.logGroups.filter(group => group.logGroupName === "/aws/lambda/example")[0].logGroupName);
//     }
//   });
// }




const logo = `                   
 ___  __    ___      ____  ____  _  _     ____  _____  _____  __    ___ 
/ __)(  )  / __) ___(  _ \\( ___)( \\/ )___(_  _)(  _  )(  _  )(  )  / __)
\\__ \\ )(__ \\__ \\(___))(_) ))__)  \\  /(___) )(   )(_)(  )(_)(  )(__ \\__ \\
(___/(____)(___/    (____/(____)  \\/      (__) (_____)(_____)(____)(___/
`

const titleBox = grid.set(0, 0, 2, 6, blessed.box, {
  tags: true,
  content: logo +
      '\n Chrome Dev Tools for the Serverless World.' +
      '\n    - Select a function from the list on the right',
  style: {
      fg: 'green',
      border: {
          fg: 'green'
      }
  }
});


generateTable()
table.focus()

//set spark dummy data
var spark1 = [1,2,5,2,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]
var spark2 = [4,4,5,4,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]

refreshSpark()
setInterval(refreshSpark, 1000)

function refreshSpark() {
  spark1.shift()
  spark1.push(Math.random()*5+1)       
  spark2.shift()
  spark2.push(Math.random()*5+1)       
  sparkline.setData(['Server1', 'Server2'], [spark1, spark2])  
}



//set map dummy markers
var marker = true
setInterval(function() {
   if (marker) {
    map.addMarker({"lon" : "-79.0000", "lat" : "37.5000", color: 'yellow', char: 'X' })
    map.addMarker({"lon" : "-122.6819", "lat" : "45.5200" })
    map.addMarker({"lon" : "-6.2597", "lat" : "53.3478" })
    map.addMarker({"lon" : "103.8000", "lat" : "1.3000" })
   }
   else {
    map.clearMarkers()
   }
   marker =! marker
   screen.render()
}, 1000)

//set line charts dummy data

var transactionsData = {
   title: 'USA',
   style: {line: 'red'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72, 70]
}

var transactionsData1 = {
   title: 'Europe',
   style: {line: 'yellow'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30]
}

var errorsData = {
   title: 'server 1',
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'],
   y: [30, 50, 70, 40, 50, 20]
}

var latencyData = {
   x: ['t1', 't2', 't3', 't4'],
   y: [5, 1, 7, 5]
}

// setLineData([errorsData], errorsLine)
// setLineData([latencyData], latencyLine)

// setInterval(function() {
//    setLineData([transactionsData, transactionsData1], invocationsLineGraph)
//    screen.render()
// }, 500)

// setInterval(function() {   
//     setLineData([errorsData], errorsLine)
// }, 1500)

var pct = 0.00;

function updateDonut(){
  if (pct > 0.99) pct = 0.00;
  var color = "green";
  if (pct >= 0.25) color = "cyan";
  if (pct >= 0.5) color = "yellow";
  if (pct >= 0.75) color = "red";  
  donut.setData([
    {percent: parseFloat((pct+0.00) % 1).toFixed(2), label: 'storage', 'color': color}
  ]);
  pct += 0.01;
}

setInterval(function() {   
   updateDonut();
   screen.render()
}, 500)

function setLineData(data, line) {
  // for (var i=0; i<mockData.length; i++) {
  //   var last = mockData[i].y[mockData[i].y.length-1]
  //   mockData[i].y.shift()
  //   var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)    
  //   mockData[i].y.push(num)  
  // }
  
  // console.log(mockData)

  line.setData(data)
}


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// fixes https://github.com/yaronn/blessed-contrib/issues/10
screen.on('resize', function() {
  donut.emit('attach');
  gauge_two.emit('attach');
  sparkline.emit('attach');
  bar.emit('attach');
  table.emit('attach');
  // errorsLine.emit('attach');
  titleBox.emit('attach');
  invocationsLineGraph.emit('attach');
  map.emit('attach');
  log.emit('attach');
});

screen.title = "sls-dev-tools"

screen.render()