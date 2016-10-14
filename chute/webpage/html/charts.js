/*
 * Timers which control when a blank packet is sent to the different tables
 * For each chart, the blank packet triggers something different
 * Waterfall and river flush their buffers upon receiving a blank packet
 * Utilization chart checks for channels that have been present for longer than the set time range
 * The event chart adds a tick to the x-axis whenever it receives a blank packet
 */

 var blank = null;//blank data to send to the charts 

//render rate for waterfall and river
var renderRate = 25; // render every x milliseconds
setInterval(function(){myTimer()},renderRate);
function myTimer()
{
	drawWaterfall(blank);
	drawRiver(blank);
}

//x-axis tick rate for event chart
var eventRate = 1000; // tick every second
setInterval(function(){myTimer2()},eventRate);
function myTimer2()
{
	addEventData(blank);
}

//look for old data rate on Airtime chart
var utilRate = 5000; // check every 5 seconds
setInterval(function(){myTimer3()},utilRate);
function myTimer3()
{
	addUtilData(blank);
}

/*
 * Visualization initialization functions.
 * Call these ONCE after the page and prerequisite JavaScript load.
 */

 // ***Initialize the airtime visualization***
 
var utilChart;
 
function initAirtime() {
	$(function () {
		$(document).ready(function() {
			utilChart = new Highcharts.Chart({
				chart: {
					renderTo: 'Airtime',
					type: 'bar',
					height: $("#maincol").height(),
					width: $("#maincol").width(),
				},
				exporting: { enabled: false },
				title: {
					text: 'Network Utilization By Channel'
				},
				xAxis: {
					title: {
						text: 'Channel'
					},
					categories: []
				},
				yAxis: {
					title: {
						text: 'Percentage Utilized'
					},
					max: 100,
				},
				legend: {
					reversed: true
				},
				tooltip: {
					formatter: function() {
						var s;
						if (this.point.name) { // the pie chart
							s = ''+
								this.point.name +': '+ this.y +' %';
						} else {
							s = ''+
								this.x  +': '+ this.y +' %';
						}
						return s;
					}
				},
				plotOptions: {
					series: {
						stacking: 'area'
					}
				},
				series: [{
					name: 'Time',
					color: '#AA4643',
					showInLegend: false,
					data: []
					
				}, {
					name: 'Non-WiFi',
					color: '#3B5323',
					data: []
				}, {
					name: 'WiFi',
					color: '#4572A7',
					data: []
				}]
			});
		});
	});
}


// ***Initialize the devices visualization***

var devicesTableData = []; //the data of the table
var devicesTable; //the table itself

function initDevices() {

	//this function formats items going into the duration cell of the table
	function durationFormatter(cellvalue, options, rowObject)
	{
		var hours = Math.floor(cellvalue / 3600000) % 24;
		var minutes = Math.floor(cellvalue / 60000) % 60;
		var seconds = Math.floor(cellvalue / 1000) % 60;

		if(hours == 0 && minutes == 0)
		{
			return seconds + "s";
		}
		else if(hours == 0)
		{
		   return minutes + "m " + seconds + "s";
		}
		else
		{
		   return hours + "h " + minutes + "m " + seconds + "s";
		}
	}

	devicesTable = jQuery("#deviceTable").jqGrid({
		datatype: "local",
		height: $("#maincol").height() - 50,
		width: $("#maincol").width(),
		rowNum: 20,
	   	colNames:['Status', 'Serial', 'Device','Start', 'End', 'Duration', 'Signal Str','Sub Band Freq','Freq Range','hiddenStart'],
	   	colModel:[
	   		{name:'status', index:'status', width:150},
	   		{name:'ser',    index:'ser',    width:150,  align:"left",  sorttype:"int", key: true},
	   		{name:'dev',    index:'dev',    width:150, align:"left"},	
	   		{name: 'start', index: 'start', width: 150, align: 'center', formatter:'date', formatoptions: {srcformat:'Y-m-d H:i:s', newformat:'H:i:s'}},
	   		{name: 'end', index: 'end', width: 150, align: 'center', formatter:'date', formatoptions: {srcformat:'Y-m-d H:i:s', newformat:'H:i:s'}},
	   		{name:'dur',    index:'dur',    width:150,  align:"right", sortable:false, formatter:durationFormatter},
	   		{name:'sigstr', index:'sigstr', width:150,  align:"right", sorttype:"float", formatter:"number"},
	   		{name:'sbf',    index:'sbf',    width:150,  align:"right", sorttype:"float"},		
	   		{name:'fr',     index:'fr',     width:150,  align:"right", sorttype:"float"},
	   		{name:'hiddenStart',     index:'hiddenStart', hidden:true,width:150,  align:"right", sorttype:"float"}
	   	],
		pager: '#deviceTablePager',
		sortname: 'end',
		sortorder: "desc",
		hoverrows:false,
		loadonce: true,
		cellsubmit: 'clientArray',
	   	grouping:true,
	   	groupingView : {
	   		groupField : ['status'],
	   		groupColumnShow : [false]
	   	},
	});

	//this adds the search and paging options to the bottom of the grid
	jQuery("#deviceTable").jqGrid('navGrid','#deviceTablePager',{del:false,add:false,edit:false});
}


// ***Initialize the events visualization***

var eventChart;

function initEvents() {
	$(function () {
		// create the chart
		eventChart = new Highcharts.Chart({
			chart: {
				renderTo: 'Event',
				height: $("#maincol").height(),
				width: $("#maincol").width()    
			},
			title: {
				text: 'Device events over last 30 seconds'
			},
			xAxis: {
				type: 'datetime',
				tickPixelInterval: 150
			},
			yAxis: {
				title: {
					text: 'RSSI'
				},
				//max: 10,
				max: -25,
				min: -90,
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}]
			},
			series: [{
				name: "Time",
				data: [],
				showInLegend: false
			}]
		});
	});
}

// ***Initialize the waterfall visualization***

var river;
var waves;
var waterfall;

function initWaterfall() {
	var riv = document.getElementById('river');
	var wav = document.getElementById('waves');
	var wf = document.getElementById('wfchart');
	
	if (riv.getContext && wav.getContext && wf.getContext) {
	    river = riv.getContext('2d');
	    waves = wav.getContext('2d');
	    waterfall = wf.getContext('2d');
	    river.font = "8pt Arial";
	}
}


/*
 * Visualization redraw functions.
 * Call these whenever the view changes.
 */

// Resize the airtime chart
function redrawAirtime() {
	utilChart.setSize(
		   $("#maincol").width(), 
		   $("#maincol").height(),
		   false
	);
}

// Resize the devices table
function redrawDevices() {
	jQuery("#deviceTable").setGridWidth($("#maincol").width());
	jQuery("#deviceTable").setGridHeight($("#maincol").height()-50); // subract 50 for the paging/search bar
}

// Resize the events chart
function redrawEvents() {
	eventChart.setSize(
		   $("#maincol").width(), 
		   $("#maincol").height(),
		   false
	);
}

// Resize and relabel the Waterfall visualization
function redrawWaterfall() {
	// For canvas elements, set the HTML width/height attributes, not the CSS properties
	$("#river").attr("width", $("#leftcol").width() - 20)
			   .attr("height", $("#leftcol").height());
	$("#waves").attr("width", $("#maincol").width())
			   .attr("height", 150);
	// .height() apparently returns 0 for potentially invisible elements
	$("#wfchart").attr("width", $("#maincol").width())
				 .attr("height", $("#maincol").height() - 40 - $("#waves").height());

	var wfwidth = $("#waves").width() - 70; // 60px gutter for labels on right side
	var wfheight = $("#wfchart").height(); // Height of waterfall

	waves.textAlign = "right";
	waves.font = "12pt Arial";
	waves.fillStyle = "rgb(191,191,191)";
	
	//draw the labels for the selected channel
	if(selectedChannel != -1){
		for(i=1;i<=7;i++)
			waves.fillText((selectedChannel - (28 - (7*i))*.312).toFixed(3)+ " hz",(i/7)*wfwidth-40,149); //add the frequency labels
	}
	else{
		for(i=1;i<=7;i++)
			waves.fillText((2405 + i*(216/7)*.312).toFixed(3) + " hz",(i/7)*wfwidth-40,149); //add the frequency labels
	}
	
	waves.textAlign = "left";
	waves.font = "8pt Arial";
	for(i=30; i<=110;i+=20) {
		waves.fillText("-"+i+" dBm",wfwidth+10,i*1.5-35);
	}
	waterfall.fillStyle = "rgb(191,0,0)";
	waterfall.fillRect(wfwidth+2,0,2,wfheight);
}


/*
 * Visualization rendering functions.
 * Call these whenever new data arrives.
 */


 
// ***Update the utilization chart with new data***
//  	Note: when dealing with utilChart.series[0], which is the hidden data that updates every second, 
//		the series must be unhidden with the show() function, then rehidden with the hide() function
//		inorder for any changes to the series to be made, otherwise the updates will be ignored

var utilizationTimeRange = 30;	//the length of time a channel will stay on the utilization chart

function addUtilData(data){
	var channels = utilChart.xAxis[0].categories;
	var currentTime = (new Date()).getTime();
	
	if(data != null){
		$(function () {	
			var channels = utilChart.xAxis[0].categories;
			
			//if there are channnels already present, we must add the new channel util data into the correct position
			if(channels.length != 0)
			{
				//check if the channel is currently in the channels array
				var exists = channels.indexOf(data.channel.toString());
				if(exists != -1)
				{
					utilChart.series[2].data[exists].update(y = data.wifi, false);
					utilChart.series[1].data[exists].update(y = data.nonwifi, false);
					
					utilChart.series[0].show();
					utilChart.series[0].data[exists].update(y = currentTime, true);
					utilChart.series[0].hide();
				}
				//the channel was not in the array, add it into the correct position
				else
				{
					var i = 0;
					for(i = 0; i < channels.length; i++)
					{
						//look for the first channel greater than the channel we are inserting
						if(data.channel < channels[i])
						{
							//add the channel to the chart
							channels.splice(i, 0, data.channel.toString());
							utilChart.xAxis[0].setCategories(channels, false);
							
							//arrays to hold the data
							var wifiData = new Array();
							var nonWifiData = new Array();
							var timeData = new Array();
							
							var j = 0;
							//shift the data into the temporary arrays in the correct order
							for(j = 0; j < utilChart.series[2].data.length; j++)
							{
								if(i == j){
									wifiData.push(data.wifi);
									nonWifiData.push(data.nonwifi);
									timeData.push(currentTime);
								}
								
								wifiData.push(utilChart.series[2].data[j].y);
								nonWifiData.push(utilChart.series[1].data[j].y);
								timeData.push(utilChart.series[0].data[j].y);
							}
							
							//set the charts data to the new shifted data
							utilChart.series[2].setData(wifiData, false);
							utilChart.series[1].setData(nonWifiData, false);
							
							utilChart.series[0].show();
							utilChart.series[0].setData(timeData, true);
							utilChart.series[0].hide();
							
							break;
						}
						//reached the end, add it to the end
						else if (i == (channels.length - 1))
						{
							//splice in the new channel
							channels.splice(i+1, 0, data.channel.toString());
							utilChart.xAxis[0].setCategories(channels, false);
							
							//temporary arrays to hold the data
							var wifiData = new Array();
							var nonWifiData = new Array();
							var timeData = new Array();
							
							//splice in the new channels data to the end
							var j = 0;
							for(j = 0; j < utilChart.series[2].data.length; j++)
							{
								wifiData.push(utilChart.series[2].data[j].y);
								nonWifiData.push(utilChart.series[1].data[j].y);
								
								utilChart.series[0].show();
								timeData.push(utilChart.series[0].data[j].y);
								utilChart.series[0].hide();

								if(i == j){
									wifiData.push(data.wifi);
									nonWifiData.push(data.nonwifi);
									timeData.push(currentTime);
								}
							}
							
							//set the charts data to the temporary arrays
							utilChart.series[2].setData(wifiData, false);	//false signifies don't redraw the chart
							utilChart.series[1].setData(nonWifiData, false);
							
							utilChart.series[0].show();
							utilChart.series[0].setData(timeData, true);   //now all changes are done, redraw the chart
							utilChart.series[0].hide();

							break;
						}
					}
				}
			}
			//no channels are present, add the channel
			else
			{
				channels.push(data.channel.toString());
				utilChart.xAxis[0].setCategories(channels, false); //false signifies don't redraw the chart
		
				utilChart.series[2].addPoint(data.wifi, false);
				utilChart.series[1].addPoint(data.nonwifi, false);
				utilChart.series[0].show();
				utilChart.series[0].addPoint(currentTime, true); //now all changes are done, redraw the chart
				utilChart.series[0].hide();
			}
		});
	}
	//blank packet came, check to see if points need to be trimmed
	else
	{
		//make sure there is data
		if(channels.length != 0)
		{
			//temporary arrays
			var channelsData = new Array();
			var wifiData = new Array();
			var nonWifiData = new Array();
			var timeData = new Array();

			//walk through the data, save any points which are still within our time range
			var j = 0;
			for(j = 0; j < channels.length; j++)
			{
				if(utilChart.series[0].data[j].y >= (currentTime - 1000*utilizationTimeRange))
				{
					channelsData.push(channels[j].toString());
					
					wifiData.push(utilChart.series[2].data[j].y);
					nonWifiData.push(utilChart.series[1].data[j].y);
					utilChart.series[0].show();
					timeData.push(utilChart.series[0].data[j].y);
					utilChart.series[0].hide();

				}
			}
			
			//update the channels and their data
			utilChart.xAxis[0].setCategories(channelsData, false);

			utilChart.series[2].setData(wifiData, false);
			utilChart.series[1].setData(nonWifiData, false);
			
			utilChart.series[0].show();
			utilChart.series[0].setData(timeData, true);
			utilChart.series[0].hide();
		}
	}
}

// ***Update the devices table with new data***

//an associativeArray which uses a key (device name concattenated with start time) to look up the devices position in the list
var devAssociativeArray = {};

//used to mark the position of devices
var row = 1;

function addDeviceData(data)
{
	//establish the key of the data
	var deviceKey = data.dev[1].toString() + data.dev[2].toString();

	//check if device is in the list already, if so update its info
	if(deviceKey in devAssociativeArray)
	{
		//get position the devices position from the associative array
		var pos = devAssociativeArray[deviceKey];
		
		//look up the record using the position from above
		var record = jQuery("#deviceTable").jqGrid('getRowData',pos,{});
		
		//parse the original unformatted start time from the hiddenStart field of the record
		var deviceStartTime = new Date(parseInt(record.hiddenStart));
		//create the end time using the current time
		var deviceEndTime = new Date();
		
		//if data.dev[8] ==1, that means the device is active, use the data in the packet
		if(data.dev[8] == 1){
			devicesTableData[pos-1] = 
			{
				status:"Active",
				ser:pos,
				dev:data.dev[1],
				start:deviceStartTime,
				end:deviceEndTime,
				dur:parseInt(deviceEndTime.getTime() - deviceStartTime.getTime()),
				sigstr:data.dev[5],
				sbf:data.dev[6],
				fr:data.dev[7]
			};
		}
		//airshark has decided the device is inactive, only update its status, endtime and duration
		else
		{
			devicesTableData[pos-1] = 
			{
				status:"Inactive",
				end:deviceEndTime,
				dur:parseInt(deviceEndTime.getTime() - deviceStartTime.getTime())
			};
		}
		
		//reload the table with the updated data
		devicesTable.setGridParam({ data: devicesTableData });
		devicesTable[0].refreshIndex();
		devicesTable.trigger("reloadGrid");
	}
	
	//new device data is not in the table, add it
	else{
	
		//if data.dev[8] == 1, that means the device is active, use the data in the packet
		if(data.dev[8] == 1) {
			//save the row this device is place into the associative array
			devAssociativeArray[deviceKey] = row;

			//get the current time
			var deviceEndTime = new Date();

			//subtract the duration given in the packet (data.dev[4] is in microseconds)
			var deviceStartTime = new Date(deviceEndTime.getTime() - data.dev[4]/1000); 

			//push the new device into the table
			devicesTableData.push({
				status:"Active",
				ser:row,
				dev:data.dev[1],
				start:deviceStartTime,
				end:deviceEndTime,
				dur:data.dev[4]/1000,
				sigstr:data.dev[5],
				sbf:data.dev[6],
				fr:data.dev[7],
				hiddenStart:deviceStartTime.getTime()
			});

			//reload the table
			devicesTable.setGridParam({ data: devicesTableData });
			devicesTable[0].refreshIndex();
			devicesTable.trigger("reloadGrid");
		
			//update the row marker
			row++;
		}
		else
		{
			//end packet was for a false positive, do nothing
		}
	}
}

// ***Update the event chart with new data***

var eventTimeRange = 30; //show x second time frame

function addEventData(data){
	var currentTime = (new Date()).getTime(); // current time

	//if the data wasnt a blank packet and the device is reported as active
	if((data != null) && (data.dev[8] == 1)){
		//variable to find whether the event series is already in the chart
		var seriesNumber = -1;
		
		//look through the data present in the chart to see if there is a match
		var i;
		for(i = 0; i < eventChart.series.length; i++)
		{
			if (eventChart.series[i].name == data.dev[1].toString())
			{
				seriesNumber = i;
				break;
			}
		}
		
		//if a match was found, add a point to that data set
		if(seriesNumber != -1)
		{
			eventChart.series[seriesNumber].addPoint([currentTime, parseInt(data.dev[5])]);
		}
		//otherwise create a new series for the new device
		else
		{
			//grabs the number position where the new series will be in the array
			var seriesNumber = eventChart.series.length;
			
			//adds a series to the chart
			eventChart.addSeries({
				name: data.dev[1].toString(),
				data: []        
			});
			
			//then uses the number from above to add a point to the newly added series
			eventChart.series[seriesNumber].addPoint([currentTime, parseInt(data.dev[5])]);
		}
	}
	
	//if the data was a blank packet, we add a tick to the chart to keep it moving even if there are no devices present
	else if(data == null)
	{
		//add the tick
		eventChart.series[0].addPoint([currentTime, 0]);
	
		//trim old points
		var i;
		//go through each series
		for(i = 0; i < eventChart.series.length; i++)
		{
			//then in each series, remove the old data points
			while(1)
			{
				//if all points have been removed from the series, remove the series from the chart, 
				//	decrement i because the eventChart.series array automatically resizes
				if (eventChart.series[i].data[0] == null)
				{
					eventChart.series[i].remove();
					i--;
					break;
				}
				//if point is out of the time range, remove it
				if (eventChart.series[i].data[0].x < (currentTime - 1000*eventTimeRange) )
				{
					eventChart.series[i].data[0].remove();
				}
				//else all remaining points are in our range, move on to next series
				else
				{
					break;
				}
			}
		}
	}
}

// ***Update the sidebar waterfall***

var riverBuffer = new Array();	//buffer holds data until the blank packet comes, then buffer is flushed
var riverNumItems = 0;			//the number of items in the buffer
var rivLastTimestamp;				//the last timestamp, pushed down before it is over written by the current time
var riverCounter = 0;			//these counters control how often the time stamp is drawn
var riverCounterMax = 15;
var rivimg;						//a picture of the previous data that is pushed down prior to the new data being drawn

function drawRiver(data) {
	//add new data to the buffer
	if(data != null){
		riverBuffer[riverNumItems] = data;
		riverNumItems++;
	}
	//if data is null, flush buffer
	else
	{
		if(riverNumItems != 0)
		{
			if ($("#river").height() < 5) return;

			var width = $("#river").width(); // Full width of canvas
			var rvwidth = width - 80; // Gutter for timestamps
			var rvheight = $("#river").height(); // Height of river

			// Push down old data
			if (rivimg != undefined)
			{
				river.putImageData(rivimg,0,5 * riverNumItems);
				river.fillStyle="#222";
				river.fillRect(rvwidth,0,90,5 * riverNumItems);
				
				if(riverCounter == riverCounterMax)
				{
					river.fillStyle="rgb(255,255,255)";
					river.fillText(rivLastTimestamp.toTimeString().substring(0,8) + ":" + rivLastTimestamp.getMilliseconds(),rvwidth+5,8 + 5 * riverNumItems);
					riverCounter = 0;
				}				
			}

			var k = 0;
			for(k=0; k < riverNumItems; k++)
			{
				data = riverBuffer[k];

				// Draw in the new data
				for(i=0;i<216;i++) {
					hue = (data.ch[i] > 75 ? 120 : (data.ch[i] > 55 ? 60 : 0));
					river.fillStyle = "hsl(" + hue + ", 100%, " + ((130 - data.ch[i]) / 2) + "%)";
					river.fillRect(i+1,1 + 5*(riverNumItems - k - 1),1,5);
				}
				/*  This is the old loop from when the river only showed the 56 bins of a channel
				// Draw in the new data
				for(i=0;i<56;i++) {
					hue = (data.ch[i] > 75 ? 120 : (data.ch[i] > 55 ? 60 : 0));
					river.fillStyle = "hsl(" + hue + ", 100%, " + ((130 - data.ch[i]) / 2) + "%)";
					river.fillRect(rvwidth/56*i+1,1 + 5*(riverNumItems - k - 1),rvwidth/56,5);
				}
				*/
			}
	
			// Erase remaining old timestamp
			river.fillStyle="#222";
			river.fillRect(rvwidth,0,90,5);

			// Take a snapshot of current data
			rivimg = river.getImageData(0,0,width,rvheight);

			//get current time
			var d = new Date();

			//erase timestamp, set text color to white, write new timestamp
			river.fillRect(rvwidth+5,0,90,10);
			river.fillStyle="rgb(255,255,255)";
			river.fillText(d.toTimeString().substring(0,8) + ":" + d.getMilliseconds(),rvwidth+5,8);

			//save date
			rivLastTimestamp = d;
			riverCounter++;
			
			//draw red line
			river.fillStyle = "rgb(191,0,0)";
			river.fillRect(rvwidth+1,0,2,150);

			//delete buffer
			delete riverBuffer;
			riverBuffer = new Array();
			riverNumItems = 0;
		}
	}
}

// ***Update the large waterfall***

var waterfallBuffer = new Array();  //buffer holds data until the blank packet comes, then buffer is flushed
var waterfallNumItems = 0;			//the number of items in the buffer
var wfLastTimestamp;						//the last timestamp, pushed down before it is over written by the current time
var waterfallCounter = 0;			//these counters control how often the time stamp is drawn
var waterfallCounterMax = 15;
var wfimg;							//a picture of the previous data that is pushed down prior to the new data being drawn

function drawWaterfall(data) {
	//add new data to the buffer
	if(data != null){
		//check if a frequency is given
		if(typeof data.freq!='undefined'){
			//check if the frequency of the packet matches the one we want to show
			if(data.freq == selectedChannel)
			{
				waterfallBuffer[waterfallNumItems] = data;
				waterfallNumItems++;
			}
		}
		//else it is a full spectrum packet
		else
		{
			//if All is selected, add the packet to the buffer
			if(selectedChannel == -1)
			{
				waterfallBuffer[waterfallNumItems] = data;
				waterfallNumItems++;
			}
		}
	}
	//if data is null, clock ticked, flush buffer
	else
	{
		if(waterfallNumItems != 0)
		{
			if ($("#wfchart").height() < 5) return;
			var width = $("#wfchart").width(); // Full canvas width
			var wfwidth = width - 70; // 60px gutter for labels on right side
			var wfheight = $("#wfchart").height(); // Height of waterfall

			// Push down old data
			if (wfimg != undefined)
			{
				//place last image
				waterfall.putImageData(wfimg,0,(wfheight/30) * waterfallNumItems);
				//erase old timestamp
				waterfall.fillStyle="#222";
				waterfall.fillRect(wfwidth+5,0,90,(wfheight/30) *waterfallNumItems);
				
				if(waterfallCounter == waterfallCounterMax)
				{
					waterfall.fillStyle="rgb(255,255,255)";
					waterfall.fillText(wfLastTimestamp.toTimeString().substring(0,8) + ":" + wfLastTimestamp.getMilliseconds(),wfwidth+8,8 + (wfheight/30*waterfallNumItems));
					waterfallCounter = 0;
				}
			}
			
			var k = 0;
			for(k=0; k < waterfallNumItems; k++)
			{
				data = waterfallBuffer[k];

				//if selectedChannel is not All, draw in 56 bins
				if(selectedChannel != -1){
					// Draw in the new data
					for(i=0;i<56;i++) {
						//waterfall.fillStyle = "rgb(0," + (255 - 2*data.ch[i]) + ",0)";
						hue = (data.ch[i] > 75 ? 120 : (data.ch[i] > 55 ? 60 : 0));
						waterfall.fillStyle = "hsl(" + hue + ", 100%, " + ((130 - data.ch[i]) / 2) + "%)";
						waterfall.fillRect(wfwidth/56*i+1,1 + (wfheight/30) * (waterfallNumItems - k - 1),
									wfwidth/56,wfheight/30);
					}
				}
				//otherwise draw in 216
				else{
					// Draw in the new data
					for(i=0;i<216;i++) {
						//waterfall.fillStyle = "rgb(0," + (255 - 2*data.ch[i]) + ",0)";
						hue = (data.ch[i] > 75 ? 120 : (data.ch[i] > 55 ? 60 : 0));
						waterfall.fillStyle = "hsl(" + hue + ", 100%, " + ((130 - data.ch[i]) / 2) + "%)";
						waterfall.fillRect(wfwidth/216*i+1,1 + (wfheight/30) * (waterfallNumItems - k - 1),
									wfwidth/216,wfheight/30);
					}
				}
			}

			// Erase remaining old timestamp
			waterfall.fillStyle="#222";
			waterfall.fillRect(wfwidth+5,0,90,wfheight/30*waterfallNumItems);

			// Take a snapshot of current data
			wfimg = waterfall.getImageData(0,0,width+60,wfheight);

			//get current time
			var d = new Date();

			//erase timestamp, set text color to white, write new timestamp
			waterfall.fillRect(wfwidth+5,0,90,10);
			waterfall.fillStyle="rgb(255,255,255)";
			waterfall.fillText(d.toTimeString().substring(0,8) + ":" + d.getMilliseconds(),wfwidth+8,8);

			//save date
			wfLastTimestamp = d;

			waterfallCounter++;
			
			//clean the buffers
			delete waterfallBuffer;
			waterfallBuffer = new Array();
			waterfallNumItems = 0;
		}
	}
}

//***This function controls the drop down below the waterfall which selects the channel***

//the frequency for channel 1(the default selection)
var selectedChannel = 2412.00;

function channelChange(channel){
	//if channel isn't All, convert it to its frequency
	if(channel != -1)
	{
		selectedChannel = (parseInt(channel) - 1) * 5 + 2412.00; //convert the channel to its frequency
	}
	//else leave it as -1 so it can be handled differently
	else{
		selectedChannel = -1;
	}

	//clear the waterfall
	var width = $("#wfchart").width(); // Full canvas width
	var wfwidth = width - 70; // 60px gutter for labels on right side
	var wfheight = $("#wfchart").height(); // Height of waterfall
	waterfall.clearRect(0, 0, wfwidth + 70, wfheight);
	waterfall.fillStyle = "rgb(191,0,0)";
	waterfall.fillRect(wfwidth+2,0,2,wfheight);
	
	//delete anything that had been buffered
	delete waterfallBuffer;
	waterfallBuffer = new Array();
	waterfallNumItems = 0;

	//set the wfimg to contain a picture of the blank waterfall
	wfimg = waterfall.getImageData(0,0,width+60,wfheight);
	
	//clear the waves
	var wvtop = 7;
	waves.clearRect(0,0,wfwidth,128 + wvtop);
	lastData = 0;
	frameData = new Array();
	fCount = 0;
	fIndex = 0;
	
	//draw the labels
	waves.fillStyle="#222";
	waves.fillRect(0,135,width, 50);
	waves.textAlign = "right";
	waves.font = "12pt Arial";
	waves.fillStyle = "rgb(191,191,191)";
	if(selectedChannel != -1){
		for(i=1;i<=7;i++)
			waves.fillText((selectedChannel - (28 - (7*i))*.312).toFixed(3)+ " hz",(i/7)*wfwidth-40,149); //add the frequency labels
	}
	else{
		for(i=1;i<=7;i++)
			waves.fillText((2405 + i*(216/7)*.312).toFixed(3) + " hz",(i/7)*wfwidth-40,149); //add the frequency labels
	}
	
}

// ***Update the line graph above the large waterfall visualization***

var lastData = 0;
var frameData = new Array();
var fCount = 0;
var fIndex = 0;

function drawWaves(data) {	
	//check if a frequency is given
	if(typeof data.freq!='undefined'){
		//check if the frequency of the packet matches the one we want to show
		if(data.freq == selectedChannel){
			lastData = data;
			if ($("#waves").height() < 5) return;
			
			// Calculate stats
			var fMin = new Array();
			var fMax = new Array();
			var fMean = new Array();
			frameData[fIndex] = JSON.parse(JSON.stringify(data.ch));
			fIndex = (fIndex + 1) % 30;
			fCount = Math.min(fCount + 1, 30);

			for(i=0;i<56;i++) {
				fMin[i] = 30; // CLosest to 127
				fMax[i] = 110; // Closest to 0
				fMean[i] = 0;
				for(j=0;j<fCount;j++) {
					jj = j;
					fMin[i] = Math.max(frameData[jj][i], fMin[i]);
					fMax[i] = Math.min(frameData[jj][i], fMax[i]);
					fMean[i] = Math.min(frameData[jj][i], 110) * 1/(j+1) + fMean[i] * (1 - 1/(j+1));
				}
				fMin[i] = Math.min(fMin[i], 110);
				//fMax[i] = Math.max(fMin[i], 0);
			}
			
			// A few useful numbers...
			var wfwidth = $("#waves").width() - 70; // 60px gutter for labels on right side
			var wvtop = 7; // Vertical position of 0db (to make room for labels)
			
			// Erase old data
			waves.fillStyle = "#222";
			waves.fillRect(0,0,wfwidth,128 + wvtop);
			waves.fillStyle = "rgba(0,0,191,.7)";
			waves.strokeStyle = "rgb(63,127,255)";
			
			// Draw in the new data
			// Maximum values in past second
			waves.beginPath();
			waves.moveTo(0,127+wvtop);
			//ctx2.lineTo(0, (lastData.ch[0] * 4/5) + (data.ch[0] * 1/5));
			waves.lineTo(0, (fMax[0]-30)*1.5+wvtop);
			for(i=0;i<56;i++) {
				waves.lineTo(wfwidth/56*(i+.5), (fMax[i]-30)*1.5+wvtop);
			}
			waves.lineTo(wfwidth, (fMax[55]-30)*1.5+wvtop);
			waves.lineTo(wfwidth,127+wvtop);
			waves.fill();
			
			// Average values in past second
			waves.beginPath();
			waves.moveTo(0, (fMean[0]-30)*1.5+wvtop);
			for(i=0;i<56;i++) {
				lastData.ch[i] = (lastData.ch[i] * 4/5) + (data.ch[i] * 1/5);
				waves.lineTo(wfwidth/56*(i+.5), (fMean[i]-30)*1.5+wvtop);
			}
			waves.lineTo(wfwidth, (fMean[55]-30)*1.5+wvtop);
			waves.stroke();
			
			// Minimum values in past second
			waves.fillStyle = "rgba(0,0,0,.3)";
			waves.beginPath();
			waves.moveTo(0,127+wvtop);
			waves.lineTo(0, (fMin[0]-30)*1.5+wvtop);
			for(i=0;i<56;i++)
				waves.lineTo(wfwidth/56*(i+.5), (fMin[i]-30)*1.5+wvtop);
			waves.lineTo(wfwidth, (fMin[55]-30)*1.5+wvtop);
			waves.lineTo(wfwidth,127+wvtop);
			waves.fill();
		}
	}
	//else it is a full spectrum packet
	else
	{
		//if All is selected, add the packet to the buffer
		if(selectedChannel == -1)
		{
			lastData = data;
			if ($("#waves").height() < 5) return;
			
			// Calculate stats
			var fMin = new Array();
			var fMax = new Array();
			var fMean = new Array();
			frameData[fIndex] = JSON.parse(JSON.stringify(data.ch));
			fIndex = (fIndex + 1) % 30;
			fCount = Math.min(fCount + 1, 30);

			for(i=0;i<216;i++) {
				fMin[i] = 30; // CLosest to 127
				fMax[i] = 110; // Closest to 0
				fMean[i] = 0;
				for(j=0;j<fCount;j++) {
					jj = j;
					fMin[i] = Math.max(frameData[jj][i], fMin[i]);
					fMax[i] = Math.min(frameData[jj][i], fMax[i]);
					fMean[i] = Math.min(frameData[jj][i], 110) * 1/(j+1) + fMean[i] * (1 - 1/(j+1));
				}
				fMin[i] = Math.min(fMin[i], 110);
				//fMax[i] = Math.max(fMin[i], 0);
			}
			
			// A few useful numbers...
			var wfwidth = $("#waves").width() - 70; // 60px gutter for labels on right side
			var wvtop = 7; // Vertical position of 0db (to make room for labels)
			
			// Erase old data
			waves.fillStyle = "#222";
			waves.fillRect(0,0,wfwidth,128 + wvtop);
			waves.fillStyle = "rgba(0,0,191,.7)";
			waves.strokeStyle = "rgb(63,127,255)";
			
			// Draw in the new data
			// Maximum values in past second
			waves.beginPath();
			waves.moveTo(0,127+wvtop);
			//ctx2.lineTo(0, (lastData.ch[0] * 4/5) + (data.ch[0] * 1/5));
			waves.lineTo(0, (fMax[0]-30)*1.5+wvtop);
			for(i=0;i<216;i++) {
				waves.lineTo(wfwidth/216*(i+.5), (fMax[i]-30)*1.5+wvtop);
			}
			waves.lineTo(wfwidth, (fMax[215]-30)*1.5+wvtop);
			waves.lineTo(wfwidth,127+wvtop);
			waves.fill();
			
			// Average values in past second
			waves.beginPath();
			waves.moveTo(0, (fMean[0]-30)*1.5+wvtop);
			for(i=0;i<216;i++) {
				lastData.ch[i] = (lastData.ch[i] * 4/5) + (data.ch[i] * 1/5);
				waves.lineTo(wfwidth/216*(i+.5), (fMean[i]-30)*1.5+wvtop);
			}
			waves.lineTo(wfwidth, (fMean[215]-30)*1.5+wvtop);
			waves.stroke();
			
			// Minimum values in past second
			waves.fillStyle = "rgba(0,0,0,.3)";
			waves.beginPath();
			waves.moveTo(0,127+wvtop);
			waves.lineTo(0, (fMin[0]-30)*1.5+wvtop);
			for(i=0;i<216;i++)
				waves.lineTo(wfwidth/216*(i+.5), (fMin[i]-30)*1.5+wvtop);
			waves.lineTo(wfwidth, (fMin[215]-30)*1.5+wvtop);
			waves.lineTo(wfwidth,127+wvtop);
			waves.fill();
		}
	}
}
