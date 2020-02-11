
// Global variables
// .image holds image objects
// .label holds label strings
var trainSet = {};
trainSet.image = [];
trainSet.label = [];
var valSet = {};
valSet.image = [];
valSet.label = [];
var testSet = {};
testSet.image = [];
testSet.label = [];

// maps labels(0,1,2,3,...) to labelText(CXR,AXR,...)
var labels = [];

var dict = {};
dict['input'] = 'Input';
dict['softmax'] = 'Softmax';
dict['fc'] = 'Fully Connected';
dict['conv'] = 'Convolution';
dict['pool'] = 'Pooling';
dict['newLayer'] = 'Unconfigured';

var divList = [ 'divImages', 'divNet', 'divTrain', 'divTest' ];

var imageSize = 64;

// Define starting neural network with 1 input and 1 output
var layers = [];
layers[0] = 'input,' + imageSize + ',' + imageSize + ',1'; 	// input layer, imageSize, imageSize, 1 channel
layers[1] = 'softmax,2';		//output layer is softmax, 2 classifiers

// Global canvas context used to hold training image data
var tempCTX; 

// Define data folder
var dataFolder = 'classCXRAXR';

// START
function start() {

	// Load labels
	var file = 'labels.csv';
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			// Load csv into label and labelText arrays
			var csvArray = this.responseText.split('\n');
			
			// Filter empty elements
			// https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
			csvArray = csvArray.filter(function (el) {
				return el != "";
			});	
			
			for (var i = 0; i < csvArray.length; i++) {
				var csvLine = csvArray[i].split(',');
				labels[csvLine[0]] = csvLine[1];
			}
			
			// Begin loading image data
			startLoadData();
		}
	};
	xhttp.open('GET', dataFolder + '/' + file, true);
	xhttp.send();

	// Current working image & canvas
	var tempCanvas = document.getElementById('tempCanvas');
	tempCTX = tempCanvas.getContext('2d');
	
	// Adjust elements
	// adjust tabs
	for (var i = 0; i < divList.length; i++) {
		document.getElementById(divList[i]).style.width = (window.innerWidth - 40) + 'px';
		document.getElementById(divList[i]).style.height = (window.innerHeight - 100) + 'px';
	}
	// adjust divGrey
	document.getElementById('divGrey').style.width = window.innerWidth;
	document.getElementById('divGrey').style.height = window.innerHeight;

	// adjust divEdit
	document.getElementById('divEditLayer').style.left = ((window.innerWidth / 2) - 200) + 'px';

	// Draw default neural net
	drawNeuralNet();	
}

// Called after labels are loaded
function startLoadData() {
	var set = ['train', 'val', 'test'];

	// Retrieve and load training data	
	var xhttp = [];
	for (var i = 0; i < set.length; i++) {

		var file = set[i] + '.csv';
		xhttp[i] = new XMLHttpRequest();
		xhttp[i].set = set[i];
		xhttp[i].onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				document.getElementById('span' + this.set + 'Status').innerHTML = 'Ready!';
				loadData(this.responseText, this.set);
			}
		};
		xhttp[i].open('GET', dataFolder + '/' + file, true);
		document.getElementById('span' + set[i] + 'Status').innerHTML = 'Loading...';
		xhttp[i].send();
	}	
}

// Load data from CSV to Image and Labels
function loadData(csv, whichSet) {
	
	// Temporary arrays to hold images and labels
	var image = [];
	var label = [];
	
	// Load csv into image and label arrays
	var csvArray = csv.split('\n');
	
	// Filter empty elements
	// https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
	csvArray = csvArray.filter(function (el) {
		return el != "";
	});	

	// Create Image objects and fill label array
	for (var i = 0; i < csvArray.length; i++) {
		var csvLine = csvArray[i].split(',');
		image[i] = new Image();
		image[i].src = dataFolder + '/' + csvLine[0];
		// Set style for display purposes
		image[i].style.width = '100px';
		image[i].style.height = '100px';
		label[i] = parseInt(csvLine[1]);
		document.getElementById('span' + whichSet).appendChild(image[i]);
		document.getElementById('span' + whichSet).innerHTML += '<br>' + labels[label[i]] + '<hr>';
	}
	
	// Assign Images and Labels to Sets
	switch (whichSet) {
		case 'train':
			trainSet.image = image;
			trainSet.label = label;
			break;
		case 'val':
			valSet.image = image;
			valSet.label = label;
			break;
		case 'test':
			testSet.image = image;
			testSet.label = label;
			break;			
	}
}

function drawNeuralNet(action, whichLayer) {

	action = action || '';
	whichLayer = whichLayer || '';

	// Draw ADD layer before output layer
	if (action == 'addLayer') {
		// move output one layer down
		layers[layers.length] = layers[layers.length - 1];
		// set current layer to new layer
		layers[layers.length - 2] = 'newLayer';
	} 
	// Delete layer
	if (action == 'deleteLayer') {
		layers.splice(whichLayer,1);
	}
	// Edit layer
	if (action == 'editLayer') {
		var layerType = document.getElementById('selectLayerType').value;
		var layerCSV = layerType + ',';
		
		if (layerType == 'fc') {
			layerCSV += document.getElementById('inputLayerFCNumNeurons').value + ',';
			layerCSV += document.getElementById('selectLayerFCActivation').value;
		}
		
		if (layerType == 'conv') {
			layerCSV += document.getElementById('inputLayerCONVNumFilters').value + ',';
			layerCSV += document.getElementById('inputLayerCONVFilterSize').value + ',';
			layerCSV += document.getElementById('inputLayerCONVStride').value + ',';
			layerCSV += document.getElementById('inputLayerCONVPad').value + ',';
			layerCSV += document.getElementById('selectLayerCONVActivation').value;
		}
		if (layerType == 'pool') {
			layerCSV += document.getElementById('inputLayerPOOLPoolingSize').value + ',';
			layerCSV += document.getElementById('inputLayerPOOLStride').value;
		}
		
		layers[whichLayer] = layerCSV;
	
		hideEditLayer();
	}
	// Move layer down
	if (action == 'moveLayerDown') {
		var layerToMoveDown = layers[whichLayer];
		var layerToMoveUp = layers[whichLayer + 1];
		layers[whichLayer] = layerToMoveUp;
		layers[whichLayer + 1] = layerToMoveDown;
	}

	// Move layer up
	if (action == 'moveLayerUp') {
		var layerToMoveDown = layers[whichLayer - 1];
		var layerToMoveUp = layers[whichLayer];
		layers[whichLayer - 1] = layerToMoveUp;
		layers[whichLayer] = layerToMoveDown;
	}
	
	// Draws layers
	var layersHTML = '<table width=100% border=1 cellpadding=10>';
	layersHTML += '<tr><td width=60></td><td align=center>Layer</td><td width=60></td></tr>';
		
	for (var i = 0; i < layers.length; i++) {
		// Draws layer
		layersHTML += '<tr>';
		layersHTML += '<td align=right>';
			// Move layer up
			if (i > 1 && i < layers.length - 1) {
				layersHTML += '<input type="button" value="U" onClick="drawNeuralNet(\'moveLayerUp\',' + i + ')">';
			}
		layersHTML += '<br>';
			// Move layer down
			if (i > 0 && i < layers.length - 2) {
				layersHTML += '<input type="button" value="D" onClick="drawNeuralNet(\'moveLayerDown\',' + i + ')">';
			}
		layersHTML += '<td align=center>';
			// Display layer info
			var layerCSV = layers[i].split(',');
			layersHTML += '<font size=+1><b>' + dict[layerCSV[0]] + '</b></font><br>';
			
			if (layerCSV[0] == 'input') {
				layersHTML += 'Matrix: ' + layerCSV[1] + 'x' + layerCSV[2];
				layersHTML += ' | Channels: ' + layerCSV[3];
			}
			
			if (layerCSV[0] == 'fc') {
				layersHTML += 'Neurons: ' + layerCSV[1];
				layersHTML += ' | Activation: ' + layerCSV[2];
			}
			
			if (layerCSV[0] == 'conv') {
				layersHTML += 'Filters: ' + layerCSV[1];
				layersHTML += ' | Size: ' + layerCSV[2] + 'x' + layerCSV[2];
				layersHTML += '<br>Stride: ' + layerCSV[3];
				layersHTML += ' | Padding: ' + layerCSV[4];
				layersHTML += '<br>Activation: ' + layerCSV[5];
				
			}
			
			if (layerCSV[0] == 'pool') {
				layersHTML += 'Pooling Size: ' + layerCSV[1] + 'x' + layerCSV[1];
				layersHTML += ' | Stride: ' + layerCSV[2];
			}

			if (layerCSV[0] == 'softmax') {
				layersHTML += 'Number of Classes: ' + layerCSV[1];
			}
			
		layersHTML += '</td>';
		layersHTML += '<td>';
			// Adds option to edit and delete hidden layers
			if (i > 0  && i < layers.length - 1) {
				layersHTML += '<input type="button" value="E" onClick="editLayer(' + i + ')">';
				layersHTML += '<input type="button" value="X" onClick="drawNeuralNet(\'deleteLayer\',' + i + ')">';
			}
		layersHTML += '</td>';
		layersHTML += '</tr>';
		
	}
	layersHTML += '</table>';
	document.getElementById('spanNeuralNet').innerHTML = layersHTML;
}

function editLayer(whichLayer) {

	// Set CONFIRM button to whichlayer
	document.getElementById('spanEditLayerConfirm').innerHTML = '<input type="button" id="inputButtonEditConfirm" value="Confirm" onClick="drawNeuralNet(\'editLayer\',' + whichLayer + ')">';

	// Set empty if new layer, otherwise populate with old values
	if (layers[whichLayer] == 'newLayer') {
		// Display an empty form 
		document.getElementById('selectLayerType').value = '';
		displayLayerOptions();
	} else {
		// Read the old layer values
		var oldLayerCSV = layers[whichLayer].split(',');
		var layerType = oldLayerCSV[0];
		// Set the form to the previous type
		document.getElementById('selectLayerType').value = layerType;
		displayLayerOptions();
		// Populate old values
		if (layerType == 'fc') {
			document.getElementById('inputLayerFCNumNeurons').value = oldLayerCSV[1];
			document.getElementById('selectLayerFCActivation').value = oldLayerCSV[2];
		}
		
		if (layerType == 'conv') {
			document.getElementById('inputLayerCONVNumFilters').value  = oldLayerCSV[1];
			document.getElementById('inputLayerCONVFilterSize').value  = oldLayerCSV[2];
			document.getElementById('inputLayerCONVStride').value  = oldLayerCSV[3];
			document.getElementById('inputLayerCONVPad').value  = oldLayerCSV[4];
			document.getElementById('selectLayerCONVActivation').value = oldLayerCSV[5];
		}
		if (layerType == 'pool') {
			document.getElementById('inputLayerPOOLPoolingSize').value = oldLayerCSV[1];
			document.getElementById('inputLayerPOOLStride').value = oldLayerCSV[2];
		}
	}

	// Show Edit Layer DIV
	document.getElementById('divEditLayer').style.display = 'block';
	document.getElementById('divGrey').style.display = 'block';	
}

function hideEditLayer() {
	document.getElementById('divEditLayer').style.display = 'none';
	document.getElementById('divGrey').style.display = 'none';	
}

// Change layer options during Edit layer
function displayLayerOptions() {
	var layerType = document.getElementById('selectLayerType').value;
	
	// Disable confirm if no layer type is selected
	if (layerType == '') {
		document.getElementById('inputButtonEditConfirm').disabled = true;
	} else {
		document.getElementById('inputButtonEditConfirm').disabled = false;
	}
	
	// Draw layer options
	var spanLayerOptions = '';
	
	if (layerType == 'fc') {
		spanLayerOptions += 'Number of Neurons: <input type="text" size="4" value="10" id="inputLayerFCNumNeurons"><br>';
		spanLayerOptions += 'Activation: <select id="selectLayerFCActivation"><option value="sigmoid">Sigmoid</option><option value="relu">RELU</option></select>';
	}
	
	if (layerType == 'conv') {
		spanLayerOptions += 'Number of Filters: <input type="text" size="4" value="10" id="inputLayerCONVNumFilters"><br>';
		spanLayerOptions += 'Filter Size: <input type="text" size="4" value="5" id="inputLayerCONVFilterSize"><br>';
		spanLayerOptions += 'Stride: <input type="text" size="4" value="1" id="inputLayerCONVStride"><br>';
		spanLayerOptions += 'Padding: <input type="text" size="4" value="2" id="inputLayerCONVPad"><br>';
		spanLayerOptions += 'Activation: <select id="selectLayerCONVActivation"><option value="sigmoid">Sigmoid</option><option value="relu">RELU</option></select>';
	}
	if (layerType == 'pool') {
		spanLayerOptions += 'Pool Size: <input type="text" size="4" value="2" id="inputLayerPOOLPoolingSize"><br>';
		spanLayerOptions += 'Stride: <input type="text" size="4" value="2" id="inputLayerPOOLStride"><br>';
	}

	document.getElementById('spanEditLayerOptions').innerHTML = spanLayerOptions;

}

// Load pre-configured neural net
function loadPreConfigNet() {
	var preConfigNet = {};

	preConfigNet['new'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'softmax,2' ];	
	
	preConfigNet['oneConv'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'fc,10,sigmoid',
			'softmax,2' ];	

	preConfigNet['twoConv'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'fc,10,sigmoid',
			'softmax,2' ];	

	preConfigNet['nestedOneConv'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'conv,10,3,2,0,relu',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'fc,10,sigmoid',
			'softmax,2' ];	

	preConfigNet['nestedTwoConv'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'conv,10,3,2,0,relu',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'conv,10,3,2,0,relu',
			'conv,10,3,2,0,relu',
			'pool,2,2',
			'fc,10,sigmoid',
			'softmax,2' ];	

	preConfigNet['USANOTAI'] =
		[ 	'input,' + imageSize + ',' + imageSize + ',1',
			'conv,16,5,1,2,relu',
			'pool,2,2',
			'conv,20,5,1,2,relu',
			'pool,2,2',
			'conv,20,5,1,2,relu',
			'pool,2,2',
			'softmax,2' ];	

	
	var whichNet = document.getElementById('selectPreConfigNet').value;
	layers = preConfigNet[whichNet];
	drawNeuralNet();
}

// Create Neural Network
var net = new convnetjs.Net();
function generateNetwork() {
	
	// Draw neural network summary
	var spanNetSummaryHTML = '';
	
	// Create Layers
	var layer_defs = [];
	
	for (var i = 0; i < layers.length; i++) {
		var layerCSV = layers[i].split(',');

		// Parse numbers into integers
		for (var l = 0; l < layerCSV.length; l++) {
			if (!isNaN(parseInt(layerCSV[l]))) {
				layerCSV[l] = parseInt(layerCSV[l]);
			}
		}
		
		spanNetSummaryHTML += '<font size=+1><b>' + (i+1) + ': ' + dict[layerCSV[0]] + '</b></font><br>';
		if (layerCSV[0] == 'input') {
			layer_defs.push({type:'input', out_sx:layerCSV[1], out_sy:layerCSV[2], out_depth:layerCSV[3]});
			spanNetSummaryHTML += layerCSV[1] + 'x' + layerCSV[2] + 'x' + layerCSV[3];
		}

		if (layerCSV[0] == 'fc') {
			layer_defs.push({type:'fc', num_neurons:layerCSV[1], activation:layerCSV[2]})
			spanNetSummaryHTML += layerCSV[1] + '| Act: ' + layerCSV[2];
		}

		if (layerCSV[0] == 'conv') {
			layer_defs.push({type:'conv', sx:layerCSV[2], filters:layerCSV[1], stride:layerCSV[3], pad:layerCSV[4], activation:layerCSV[5]});
			spanNetSummaryHTML += layerCSV[2] + 'x' + layerCSV[2] + '(' + layerCSV[1] + ')';
			spanNetSummaryHTML += '<br>Stride: ' + layerCSV[3];
			spanNetSummaryHTML += ' | Padding: ' + layerCSV[4];
			spanNetSummaryHTML += ' | Act: ' + layerCSV[5];
		}

		if (layerCSV[0] == 'pool') {
			layer_defs.push({type:'pool', sx:layerCSV[1], stride:layerCSV[2]})
			spanNetSummaryHTML += layerCSV[1] + 'x' + layerCSV[1];
			spanNetSummaryHTML += ' | Stride: ' + layerCSV[2];
		}

		if (layerCSV[0] == 'softmax') {
			layer_defs.push({type:'softmax', num_classes:layerCSV[1]});
			spanNetSummaryHTML += 'Classes: ' + layerCSV[1];
		}
		spanNetSummaryHTML += '<hr size=1>';
		
	}
	net.makeLayers(layer_defs);	
	document.getElementById('spanNetSummary').innerHTML = spanNetSummaryHTML;
}

function startTraining() {
	//TIMER: START
	var then = new Date();

	var epochs = document.getElementById('inputEpochs').value;

	// Iterate through epochs
	// https://stackoverflow.com/questions/30987218/update-progressbar-in-each-loop/31654481
	// for (var e = 0; e < epochs; e++) {
	var e = 0;
	(function iterateEpochs() {
		
		// Iterate through images in training set
		// https://stackoverflow.com/questions/30987218/update-progressbar-in-each-loop/31654481
		// for (var i = 0; i < trainSet.label.length; i++) {
		var i = 0;
		(function iterateImages() {

			//Create new training volume at imageSizeximageSizex1, pre-filled with 0.0
			var trainVol = new convnetjs.Vol(imageSize, imageSize, 1, 0.0);
			
			//Get dimensionless imagedata
			var trainVolData = loadImageIntoVolume(trainSet.image[i]);

			//Force repaint

			//Fill training volume with dimensionless imagedata
			var p = 0;
			for (var yc = 0; yc < imageSize; yc++) {
				for (var xc = 0; xc < imageSize; xc++) {
					trainVol.set(xc, yc, 0, trainVolData[p]);
					p++;
				}
			}

			//Initiate training
			var trainer = new convnetjs.SGDTrainer(net, {method:'adadelta', batch_size:1, l2_decay:0.001});
			// var trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.2, momentum:0.1, batch_size:1, l2_decay:0.001});
			
			trainer.train(trainVol, trainSet.label[i]); //train using matched trainVol and classifier


			i++;
			if (i < trainSet.label.length) {
				setTimeout(iterateImages, 0);
			}
		})();
		// }
		// Do validation every Epoch

		// Blank the result span
		document.getElementById('spanValResults').innerHTML = '';
		
		// Iterate through images in validation set
		for (var i = 0; i < valSet.label.length; i++) {
		
			//PREDICT
			//initiate testing volume at imageSizevximageSizex1 prefilled with 0.0
			var valVol = new convnetjs.Vol(imageSize, imageSize, 1, 0.0);

			//Get dimensionless imagedata
			var valVolData = loadImageIntoVolume(valSet.image[i]);

			//fill testing volume with dimensionless imagedata of test volumes
			var p = 0;
			for (var yc = 0; yc < imageSize; yc++) {
				for (var xc = 0; xc < imageSize; xc++) {
					valVol.set(xc, yc, 0, valVolData[p]);
					p++;
				}
			}

			var prediction = net.forward(valVol);
			
			//pick the label with the highest score
			var highestWeight = 0;
			var highestWeightedLabel = null;
			for (var o = 0; o < labels.length; o++) {
				if (prediction.w[o] > highestWeight) {
					highestWeight = prediction.w[o];
					highestWeightedLabel = o;
				}
			}
			
			// Output the predictions
			document.getElementById('spanValResults').appendChild(valSet.image[i]);
			
			// Color the output whether match or not
			if (highestWeightedLabel == valSet.label[i]) {
				var predictionColor = '#0000ff';
			} else {
				var predictionColor = '#ff0000';
			}
			var spanValResultsHTML = '<br>';
			spanValResultsHTML += 'Ground Truth: ' + labels[valSet.label[i]] + '<br>';
			spanValResultsHTML += 'Prediction: <font color="' + predictionColor + '">' + labels[highestWeightedLabel] + '(' + prediction.w[highestWeightedLabel].toFixed(3) + ')</font>';
			spanValResultsHTML += '<hr>';
			document.getElementById('spanValResults').innerHTML += spanValResultsHTML;
		}


		e++;
		if (e < epochs) {
			setTimeout(iterateEpochs, 0);
		}
	})();
	// }
	
	//TIMER END:
	var now = new Date();
	console.log('Train time taken: ' + (now - then) + 'ms');
}

function doTest() {
	// Blank the result span
	document.getElementById('spanTestResults').innerHTML = '';
	
	// Iterate through images in testing set
	// https://stackoverflow.com/questions/30987218/update-progressbar-in-each-loop/31654481
	// for (var i = 0; i < testSet.label.length; i++) {
	var i = 0;
	
	(function iterateImages() {
	
		//PREDICT
		//initiate testing volume at imageSizevximageSizex1 prefilled with 0.0
		var testVol = new convnetjs.Vol(imageSize, imageSize, 1, 0.0);

		//Get dimensionless imagedata
		var testVolData = loadImageIntoVolume(testSet.image[i]);

		//fill testing volume with dimensionless imagedata of test volumes
		var p = 0;
		for (var yc = 0; yc < imageSize; yc++) {
			for (var xc = 0; xc < imageSize; xc++) {
				testVol.set(xc, yc, 0, testVolData[p]);
				p++;
			}
		}

		var prediction = net.forward(testVol);
		
		//pick the label with the highest score
		var highestWeight = 0;
		var highestWeightedLabel = null;
		for (var o = 0; o < labels.length; o++) {
			if (prediction.w[o] > highestWeight) {
				highestWeight = prediction.w[o];
				highestWeightedLabel = o;
			}
		}
		
		// Output the predictions
		document.getElementById('spanTestResults').appendChild(testSet.image[i]);
		
		// Color the output whether match or not
		if (highestWeightedLabel == testSet.label[i]) {
			var predictionColor = '#0000ff';
		} else {
			var predictionColor = '#ff0000';
		}
		var spanTestResultsHTML = '<br>';
		spanTestResultsHTML += 'Ground Truth: ' + labels[testSet.label[i]] + '<br>';
		spanTestResultsHTML += 'Prediction: <font color="' + predictionColor + '">' + labels[highestWeightedLabel] + '(' + prediction.w[highestWeightedLabel].toFixed(3) + ')</font>';
		spanTestResultsHTML += '<hr>';
		document.getElementById('spanTestResults').innerHTML += spanTestResultsHTML;

		i++;
		if (i < testSet.label.length) {
			setTimeout(iterateImages, 0);
		}
	})();
}

// Return dimensionless imagedata from trainingImage
// Load 1 training image, read imagedata.data, and return pixelvalue of red channel from each pixel
var progressCounter = 1;
function loadImageIntoVolume(trainingImage) {
	tempCTX.drawImage(trainingImage, 0, 0);
	var tempImageData = tempCTX.getImageData(0, 0, imageSize, imageSize);
	var tempImageDataGray = [];
	for (var i = 0; i < tempImageData.data.length / 4; i++) {
		tempImageDataGray[i] = tempImageData.data[i * 4]; //assume grayscale, only use R channel
	}
	// Following console.log to ensure that tempImage.src is loaded and visually different from previous loaded image
	// FUTURE RECOMMENDATION: need to fix with onLoad event
	console.log(trainingImage.src);
	//console.log(progressCounter + ":" + tempImageDataGray[(imageSize * imageSize / 2) - (imageSize / 2)], tempImageDataGray.length); //center pixel
	progressCounter++;
	return tempImageDataGray;
}


// Move along the steps
function showTab(whichTab) {
	
	// hide all tabs
	for (var i = 0; i < divList.length; i++) {
		document.getElementById(divList[i]).style.display = 'none';
	}
	
	// show whichTab
	document.getElementById(whichTab).style.display = 'block';
}



// Debug Parts

// console.logs the model as a string, either to be copy-pasted or saved
function doNet() {
	var json = net.toJSON();
	var str = JSON.stringify(json);
	console.log(str);
}


























