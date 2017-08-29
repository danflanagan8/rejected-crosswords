//defining some data structure
function Square( letter ) {
	this.row = null;
	this.column = null;
	this.letter = letter.toUpperCase();
	this.across = new Clue(true);
	this.down = new Clue(false);
	this.circle = (letter.toUpperCase() !== letter);

	//functions that mostly return information about the clues
	//intended to avoid long chains of something.something.something.etc.whatever
	this.acrossNum = function(){
		return this.across.num;
	}
	this.downNum = function(){
		return this.down.num;
	}
	this.acrossText = function(){
		return this.across.text;
	}
	this.downText = function(){
		return this.down.text;
	}
	this.acrossRef = function(){
		return this.across.reference;
	}
	this.downRef = function(){
		return this.down.reference;
	}
	this.acrossIndex = function(){
		return this.across.index;
	}
	this.downIndex = function(){
		return this.down.index;
	}
	this.startOfAcross = function(){
		return this === this.across.square;
	}
	this.startOfDown = function(){
		return this === this.down.square;
	}
}

function Clue(across){
	this.text = (across) ? "NO ACROSS CLUE FOR THIS SQUARE" : "NO DOWN CLUE FOR THIS SQUARE";
	this.num = "NA";
	this.index = null;
	this.reference = [];
	this.square = null;
	this.orientation = across;
	this.answer = "";
}

function Game(crossword){
	this.orientationAcross = true;
	this.crossword = crossword;
	this.activeSquare = crossword.squareByAcrossIndex(0);
	this.answers = null;
	this.update = null;

	//initialize some values
	this.answers = [];
	for( var i = 0; i < this.crossword.numRows() ; i++ ){
		this.answers.push([]);
		for( var j = 0; j < this.crossword.numColumns(); j++ ){
			this.answers[i].push("");
		}
	}

	this.row = function(){
		return this.activeSquare.row;
	}
	this.column = function(){
		return this.activeSquare.column;
	}
	this.letter = function(){
		return this.activeSquare.letter;
	}
}

var state;

$(document).ready(function(){

	//get the file from the query string
	var query = window.location.search;
	var fileToLoad = query.substr(8);
	setUpFileLoader();

	if( fileToLoad !== ''){
		//read an across lite text file and convert it into crossword object.
		//then call the create markup function
		$.get('lite/' + fileToLoad + '.txt', function(data){
			var crossword = new Crossword(data);
			state = new Game(crossword);
			createMarkup(state.crossword);
		});
	}
});

function setUpFileLoader(){
	var fileInput = document.getElementById('fileInput');
	fileInput.addEventListener('change', function(e) { 
    	var file = fileInput.files[0];
    	var textType = /text.*/;
    	
    	if (file.type.match(textType) ) {
  			var reader = new FileReader();   
	  		reader.onload = function(e) {
	    		//reset state in case it's changed
	    		var crossword = new Crossword(reader.result);
	    		state = new Game(crossword);
	    		createMarkup(state.crossword);
  			}
  	    	reader.readAsText(file);  
		}else if( file.type.match(/crossword/)){
			var reader = new FileReader();   
	  		reader.onload = function(e) {
	    		var crossword = new Crossword(makeTextFromPuz(ab2arr(reader.result)));
	    		state = new Game(crossword);
	    		createMarkup(state.crossword);
  			}
  			reader.readAsArrayBuffer(file);
		}
  	});
}

function ab2arr(buf) {
  return new Uint8Array(buf);
}

function makeTextFromPuz(data){
	//data is an array of int values

	//get dimensions as their own variables
    //These are actual numbers, not representations of chars
    var columns = data[44];
    var rows = data[45];
    var numClues = data[46];

    //all the stuff is text, starting at element 52
    var arr = [""];
    var index = 0;
    for( var i = 52; i < data.length ; i++ ){
    	if( data[i] === 0 ){
    		index++;
    		arr[index] = "";
    	}else{
    		arr[index] += String.fromCharCode(data[i]);
    	}
    }

    //arr[0] is the grid and title
    //arr[1] is the author
    //arr[2] is the year
    //arr[3] is the first clues
    //from https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
    //Function to convert hex to readable characters
    
    var clues = arr.slice(3, 3 + numClues);

    //parse the grid
	function parseGrid(str){
		var gridWithNewLines = '';
	    for (var i = 0; i < str.length; i++ ){
	        gridWithNewLines += str[i];
	        if( (i+1)%(columns) === 0 && i < 2 * rows * columns){
	        	gridWithNewLines += "\n";
	        }
	    }
	    return gridWithNewLines;
	}
	var grid = parseGrid(arr[0], rows, columns).split("\n");
	var solution = grid.slice(0, rows);
	
	//get the clues in order
	var down = [];
	var across = [];
	function collectClues(){
		var clueIndex = 0;
		var clued = false;
		for( var row = 0; row < rows ; row++ ){
			for( var col = 0; col < columns ; col++ ){
				clued = false;
				if( grid[row][col] != '.'){
					//a non-black square starts an across clue if there is black or nothing to the left.
					//a non-black square starts a down clue if there is black or nothing to the right

					if( col > 0 && grid[row][col - 1] == '.' ){
						//another conditional to guard against for one-letter words
						if( col < columns - 1 && grid[row][col + 1] !== '.' ){
							across.push( clues[clueIndex]);
							clued = true;
							clueIndex++;
						}
					}
					if( col === 0 && grid[row][col + 1] !== '.'){
						across.push( clues[clueIndex]);
						clued = true;
						clueIndex++;
					}
					if( row === 0 && grid[row + 1][col] !== '.'){
						down.push( clues[clueIndex ]);
						clued = true;
						clueIndex++;
					}
					if( row > 0 && grid[row - 1][col] == '.' ){
						//another conditional to guard against for one-letter words
						if( row < rows - 1 && grid[row + 1][col] !== '.' ){
							down.push( clues[clueIndex]);
							clued = true;
							clueIndex++;
						}
					}
				}
			}
		}
	}
	collectClues();

	//we got it all! Put it in a string that looks like the Across Lite Text format.
	var cr = '<ACROSS PUZZLE>';
	cr += '\n';
	cr += '<TITLE>';
	cr += '\n';
	cr += grid[grid.length - 1];
	cr += '\n';
	cr += '<AUTHOR>';
	cr += '\n';
	cr += arr[1];
	cr += '\n';
	cr += '<COPYRIGHT>';
	cr += '\n';
	cr += arr[2];
	cr += '\n';
	cr += '<GRID>';
	cr += '\n';
	for( var i = 0; i < solution.length ; i++ ){
		cr += solution[i];
		cr += '\n';
	}
	cr += '<ACROSS>';
	cr += '\n';
	for( var i = 0; i < across.length ; i++ ){
		cr += across[i];
		cr += '\n';
	}
	cr += '<DOWN>';
	cr += '\n';
	for( var i = 0; i < down.length ; i++ ){
		cr += down[i];
		cr += '\n';
	}
	cr += '<NOTEPAD>';
	return cr;
}

function Crossword( text ){

	//the crossword object has a lot of referencing. 
	//clues point at squares and squares point at clues
	
	this.grid = []; //will become an array of Square objects
	this.across = []; //will become an array of clue objects
	this.down = []; //will become an array of clue objects
	this.title = null; //string
	this.author = null; //string

	//turn the text into an array. Each line is an array item
	var lite = text.split("\n");
	//Get the title and author
	this.title = lite[ lite.indexOf('<TITLE>') + 1];
	this.author = lite[ lite.indexOf('<AUTHOR>') + 1];

	//get the clues
	var across = [];
	for( var i = lite.indexOf("<ACROSS>") + 1; i < lite.indexOf("<DOWN>") ; i++ ){
		var index = i - (lite.indexOf("<ACROSS>") + 1);
		across.push( new Clue(true) );
		across[index].text = lite[i];
		across[index].index = index;
	}
	var down = [];
	for( var i = lite.indexOf("<DOWN>") + 1; i < lite.indexOf("<NOTEPAD>") ; i++ ){
		var index = i - (lite.indexOf("<DOWN>") + 1);
		down.push( new Clue(false) );
		down[index].text = lite[i];
		down[index].index = index;
	}
	
	//create the basic grid of Square objects. No references yet, just the letters (and circle maybe)
	var grid = [];
	var afterGridIndex = lite.indexOf("<REBUS>") > -1 ? lite.indexOf("<REBUS>") : lite.indexOf("<ACROSS>");
	for( var i = lite.indexOf("<GRID>") + 1; i < afterGridIndex ; i++ ){
		grid.push([]);
		for( var j = 0 ; j < lite[i].length ; j++ ){
			grid[ grid.length - 1 ].push( new Square(lite[i][j]) );
		}
	}
	//parse the grid in earnest. We find what clues each square belongs to
	//We set some iterators
	var clueNum = 1;
	var acrossClueIndex = 0;
	var downClueIndex = 0;
	for( var row = 0 ; row < grid.length ; row++ ){
		for( var col = 0; col < grid[0].length ; col++ ){
			grid[row][col].row = row;
			grid[row][col].column = col;
			if( grid[row][col].letter === "." ){
				//it's a black square
				//no variables get incremented or added to the Square object
			}else{
				var newClue = false;
				if( (row === 0 || grid[row - 1][col].letter === ".") && ( row < grid.length - 1 && grid[row + 1][col].letter !== ".")){
					//in here? this is the start of a down word. The && above tests for single-letter down words, which aren't clued.
					down[downClueIndex].square = grid[row][col]; //the clue points at the square
					down[downClueIndex].num = clueNum;
					down[downClueIndex].answer += grid[row][col].letter;
					grid[row][col].down = down[downClueIndex]; //the square points at the clue
					//update vars
					downClueIndex++;
					newClue = true;
				}
				if( row !== 0 && grid[row - 1][col].letter !== "." ){
					//in here? This is not the start of a down clue. It's the same clue as the square above it
					grid[row][col].down = grid[row - 1][col].down;
					grid[row][col].down.answer += grid[row][col].letter;
				}
				if( (col === 0 || grid[row][col-1].letter === "." ) && ( col < grid[0].length - 1 && grid[row][col + 1].letter !== ".") ){
					//in here? this is the start of an across word. The && above tests for single-letter across words, which aren't clued.
					across[acrossClueIndex].square = grid[row][col]; //the clue points at the square
					across[acrossClueIndex].num = clueNum;
					across[acrossClueIndex].answer += grid[row][col].letter;
					grid[row][col].across = across[acrossClueIndex]; //the square points at the clue
					//update vars
					acrossClueIndex++;
					newClue = true;
				}
				if( col !== 0 && grid[row][col-1].letter !== "." ){
					//in here? This is not the start of an across clue. It's the same clue as the square to the left
					grid[row][col].across = grid[row][col-1].across;
					grid[row][col].across.answer += grid[row][col].letter;
				}
				if(newClue) clueNum++;
			}
		}
	}

	//find and connect the references between clues
	//across
	for( var i = 0 ; i < across.length ; i++ ){
		var refs = findReferences(across[i].text);
		for( var j = 0; j < refs.length ; j++ ){
			if(refs[j].orientation){
				for( var k = 0; k < across.length; k++ ){
					if( across[k].num === refs[j].num ){
						across[i].reference.push( across[k] );
						break;
					}
				}
			}else{
				for( var k = 0; k < down.length; k++ ){
					if( down[k].num === refs[j].num ){
						across[i].reference.push( down[k] );
						break;
					}
				}
			}
		}
	}
	//down
	for( var i = 0 ; i < down.length ; i++ ){
		var refs = findReferences(down[i].text);
		for( var j = 0; j < refs.length ; j++ ){
			if(refs[j].orientation){
				for( var k = 0; k < across.length; k++ ){
					if( across[k].num === refs[j].num ){
						down[i].reference.push( across[k] );
						break;
					}
				}
			}else{
				for( var k = 0; k < down.length; k++ ){
					if( down[k].num === refs[j].num ){
						down[i].reference.push( down[k] );
						break;
					}
				}
			}
		}
	}
	
	//put it all together into the crossword object
	this.grid = grid;
	this.across = across;
	this.down = down;

	function findReferences( clueText ){
		//returns the number and orientation of references found in the clueText
		var reference = [];

		//we look in the clue for [number]- followed somewhere by Across or Down
		var refRegex = /(\d+\-)|(Down)|(Across)/g;

		if( /(\d+\-)/.test(clueText) && /(Across)|(Down)/.test(clueText) ){
			//there's likely a reference
			var matches = clueText.match(refRegex); //something like [13- , 23- , Across, 45-, Down]
			var acrossIndex = matches.indexOf("Across");
			var downIndex = matches.indexOf("Down");
			
			if( acrossIndex === -1 ){
				//just down references
				var i = 0;
				while( i < downIndex ){
					reference.push( {num: Number(matches[i].replace("-", "")), orientation: false });
					i++;
				}
			}
			if( downIndex === -1 ){
				//just across references
				var i = 0;
				while( i < acrossIndex ){
					reference.push( {num: Number(matches[i].replace("-", "")), orientation: true });
					i++;
				}
			}
			if( acrossIndex >= 0 && downIndex >= 0 ){
				//assume Across references are first, as they should be
				//across
				var i = 0;
				while( i < acrossIndex ){
					reference.push( {num: Number(matches[i].replace("-", "")), orientation: true });
					i++;
				}
				//now down. We have to move past the acrossIndex
				i = acrossIndex + 1;
				while( i < downIndex ){
					reference.push( {num: Number(matches[i].replace("-", "")), orientation: false });
					i++;
				}
			}
		}
		return reference;
	}

	this.getSquare = function(row, column) {
		return this.grid[row][column];
	}
	this.numColumns = function(){
		return this.grid[0].length;
	}
	this.numRows = function(){
		return this.grid.length;
	}
	this.getLetter = function(row, column){
		return this.grid[row][column].letter;
	}
	this.nextAcross = function(currentRow, currentColumn){
		var currentAcrossIndex = this.getSquare(currentRow, currentColumn).acrossIndex();
		if( currentAcrossIndex < this.across.length - 1 ){
			return this.squareByAcrossIndex(currentAcrossIndex + 1);
		}else{
			return this.getSquare(currentRow, currentColumn);
		}
	}
	this.prevAcross = function(currentRow, currentColumn){
		var currentAcrossIndex = this.getSquare(currentRow, currentColumn).acrossIndex();
		if( currentAcrossIndex > 0 ){
			return this.squareByAcrossIndex(currentAcrossIndex - 1);
		}else{
			return this.getSquare(currentRow, currentColumn);
		}
	}
	this.nextDown = function(currentRow, currentColumn){
		var currentDownIndex = this.getSquare(currentRow, currentColumn).downIndex();
		if( currentDownIndex < this.down.length - 1 ){
			return this.squareByDownIndex(currentDownIndex + 1);
		}else{
			return this.getSquare(currentRow, currentColumn);
		}
	}
	this.prevDown = function(currentRow, currentColumn){
		var currentDownIndex = this.getSquare(currentRow, currentColumn).downIndex();
		if( currentDownIndex > 0 ){
			return this.squareByDownIndex(currentDownIndex - 1);
		}else{
			return this.getSquare(currentRow, currentColumn);
		}
	}
	this.squareByDownIndex = function(index){
		return this.down[index].square;
	}
	this.squareByAcrossIndex = function(index){
		return this.across[index].square;
	}
}

//createMarkup takes a crossword object and creates markup and click handlers
function createMarkup(crossword){
	
	//empty the crossword container
	$('#crossword').html("");

	//by default, we want to show references
	$('#crossword').addClass('show-references');

	//add the two main sub-containers
	$('#crossword').append("<div id='left'></div>");
	$('#crossword').append("<div id='right'></div>");

	//if present, add title and author
	if( crossword.title != "" ){
		$('#left').append("<h2 id='title' class=''>" + crossword.title + "</h2>");
	}
	if( crossword.author != "" ){
		$('#left').append("<div id='author' class=''>" + crossword.author + "</div>");
	}
	
	//add the buttons and check boxes
	$('#left').append("<div id='buttons'></div>");
	var showWrong = "<input type='checkbox' id='show-wrong' name='show-wrong'><label for='show-wrong'>Show Incorrect Letters</label>";
	var cheat = "<button id='cheat'>Cheat</button>";
	var giveUp = "<button id='giveup'>Show Solution</button>";
	var clear = "<button id='clear'>Clear</button>";
	var showReferences = "<input type='checkbox' checked='checked' id='show-references' name='show-references'><label for='show-references'>Highlight References</label>";
	$('#buttons').append('<div>' + showWrong + cheat + giveUp + clear + '</div><div>' + showReferences + '</div>');

	//add the puzzle, but don't fill it yet
	$('#left').append("<table id='puzzle' class=''></table>");
	
	//add the clue divs but don't add the clues yet
	$('#left').append("<div id='clue'></div>");
	$('#right').append("<div id='clues'></div>");
	$('#clues').append("<div id='across'><h2><div class='prev'></div>Across<div class='next'></div></h2></div>");
	$('#clues').append("<div id='down'><h2><div class='prev'></div>Down<div class='next'></div></h2></div>");

	//add the squares to the puzzle by looping. Each row gets appended one at a time
	for( var i = 0; i < crossword.numRows() ; i++ ){
		var row = "<tr class='row'>";
		for( var j = 0 ; j < crossword.numColumns() ; j++ ){
			var square = crossword.getSquare(i, j);
			var classes = "";
			if( square.startOfAcross() ) classes += ' across';
			if( square.startOfDown() ) classes += ' down';
			if( square.letter === '.' ) classes += ' black';
			if( square.circle ) classes += ' circle';

			row += "<td data-y='" + i + "' data-x='" + j + "' data-down='" + square.down.num + "' data-across='" + square.across.num + "' class='square " + classes + "'><div class='square-text'></div><div class='square-bulk'></div><input type='text' class='phantom'></td>";
		}
		row += "</tr>";
		$('#puzzle').append(row);
	}

	//add the actual clues
	var across = crossword.across;
	for( var i = 0 ; i < across.length ; i++ ){
		$('#across').append("<div class='clue' data-index='" + across[i].index + "' data-clue='" + across[i].num + "'><div class='clue-num'>" + across[i].num + "</div><div class='clue-text'>" + across[i].text + "</div></div>");
	}
	var down = crossword.down;
	for( var i = 0 ; i < down.length ; i++ ){
		$('#down').append("<div class='clue' data-index='" + down[i].index + "'data-clue='" + down[i].num + "'><div class='clue-num'>" + down[i].num + "</div><div class='clue-text'>" + down[i].text + "</div></div>");
	}

	/**
	 * Click Handler Mania
	**/

	/*
	SQUARES
	When clicking a black square, nothing happens.
	When clicking the active square, the highlight is rotated
	When clicking a non-active square, it becomes active
	*/
	$('.square:not(.black)').click(function(){
		
		if( $(this).hasClass('active')){
			rotateHighlight(true);
		}else{
			var row = Number($(this).attr('data-y'));
			var column = Number($(this).attr('data-x'));
			state.activeSquare = state.crossword.getSquare(row, column);
			updateDisplay(true);
		}
	});

	/*
	CLUES
	When a clue is clicked, its squares get highlighted, and its first square becomes active but not focused
	*/
	$('#down .clue').click(function(){
		state.orientationAcross = false;
		state.activeSquare = state.crossword.squareByDownIndex(Number($(this).attr('data-index')));
		updateDisplay(true);
	});
	$('#across .clue').click(function(){
		state.orientationAcross = true;
		state.activeSquare = state.crossword.squareByAcrossIndex(Number($(this).attr('data-index')));
		updateDisplay(true);
	});

	$('#down h2').click(function(){
		state.orientationAcross = false;
		updateDisplay(false, true);
	});

	$('#down h2 .next').click(function(){
		nextDown();
	});

	$('#down h2 .prev').click(function(){
		prevDown();
	});

	$('#across h2').click(function(){
		state.orientationAcross = true;
		updateDisplay(false, true);
	});

	$('#across h2 .next').click(function(){
		nextAcross();
	});

	$('#across h2 .prev').click(function(){
		prevAcross();
	});

	$('#giveup').click(function(){
		showSolution();
	});

	$('#show-wrong').click(function(){
		$('#puzzle').toggleClass('show-wrong');
	});

	$('#show-references').click(function(){
		$('#crossword').toggleClass('show-references');
	});

	$('#cheat').click(function(){
		printLetter(state.letter());
	});

	$('#clear').click(function(){
		if( confirm('Do you really want to clear? This action cannot be undone.')){
			for(var row = 0; row < state.crossword.numRows(); row++){
				for( var column = 0 ; column < state.crossword.numColumns(); column++ ){
					state.answers[row][column] = "";
				}
			}
			localStorage.setItem(state.crossword.title, JSON.stringify(state.answers));
			loadLocalStorage();
		}
	});

	$(document).scroll(function(){
		if( !$('#crossword').hasClass('two-column') ){
			$('#clue').css('transform', 'translateY(' + $(document).scrollTop() + 'px)');
		}else{
			$('#clue').css('transform', 'translateY(0)');
		}
	});

	$(window).resize(function(){
		if( $('#crossword').width() > 640 ){
  			$('#crossword').addClass('two-column');
		}else{
  			$('#crossword').removeClass('two-column');
		}
	});

	loadLocalStorage();	

	$(window).resize();
	updateDisplay(false);
}

function loadLocalStorage(){
	if( localStorage.getItem(state.crossword.title) !== null ){
		state.answers = $.parseJSON(localStorage.getItem(state.crossword.title));
		for(var row = 0; row < state.crossword.numRows(); row++){
			for( var column = 0 ; column < state.crossword.numColumns(); column++ ){
				var $square = $('.square[data-y=' + row + '][data-x=' + column +'] .square-text');
				$square.text(state.answers[row][column]);
				if( state.answers[row][column] !== state.crossword.getLetter(row, column) ){
					$square.addClass('wrong');
				}else{
					$square.removeClass('wrong');
				}
			}
		}
	}
}

//updateDisplay takes state and re-classes all of the markup based on it.
function updateDisplay( focus, noActive ){
	//focus and noActive are booleans

	//remove current classes
	$('.active').removeClass('active');
	$('.highlight').removeClass('highlight');
	$('.reference').removeClass('reference');

	//make the active square active
	if( noActive == null) {
		$('.square[data-y=' + state.row() + '][data-x=' + state.column() +']').addClass('active');
		//more the phantom to the same location as the active square
		if( focus ) {
			$('.square.active .phantom').focus();
			$(document).scroll();
		}
	}
	
	//highlight all the squares in the active clue and highlight the active clue itself
	if(state.orientationAcross){
		if( state.activeSquare.acrossNum() !== "NA" ){
			$('#across div[data-clue=' + state.activeSquare.acrossNum() + ']').addClass('highlight');
			$('.square[data-across=' + state.activeSquare.acrossNum() + ']').addClass('highlight');
		}
	}else{
		if( state.activeSquare.downNum() !== "NA" ){
			$('#down div[data-clue=' + state.activeSquare.downNum() + ']').addClass('highlight');
			$('.square[data-down=' + state.activeSquare.downNum() + ']').addClass('highlight');
		}
	}
	

	//put the active clue text up in the #clue container.
	if( state.orientationAcross ){
		$("#clue").html("<div class='clue-num'>" + state.activeSquare.acrossNum() + "</div><div class='clue-text'>" + state.activeSquare.acrossText() + "</div>");
	}else{
		$("#clue").html("<div class='clue-num'>" + state.activeSquare.downNum() + "</div><div class='clue-text'>" + state.activeSquare.downText() + "</div>");
	}

	//add reference if needed
	var refs;
	if( state.orientationAcross ){
		refs = state.activeSquare.acrossRef();
	}else{
		refs = state.activeSquare.downRef();
	}
	if( refs.length > 0 ){
		for( var i = 0 ; i < refs.length ; i++ ){
			var ref = refs[i];
			if( ref.orientation ){
				$('#across div[data-clue=' + ref.num + ']').addClass('reference');
				$('.square[data-across=' + ref.num + ']').addClass('reference');
				$("#clue").append("<div class='reference'><div class='clue-num ref-across'>" + ref.num + "</div><div class='clue-text'>" + ref.text + "</div></div>");
			}else{
				$('#down div[data-clue=' + ref.num + ']').addClass('reference');
				$('.square[data-down=' + ref.num + ']').addClass('reference');
				$("#clue").append("<div class='reference'><div class='clue-num ref-down'>" + ref.num + "</div><div class='clue-text'>" + ref.text + "</div></div>");
			}
		}
	}
	//end of code for showing reference

	//update the update square with the update letter
	if(state.update){
		var $square = $('.square[data-y=' + state.update.row + '][data-x=' + state.update.column +'] .square-text');
		$square.text(state.update.letter);
		if( state.update.letter !== state.crossword.getLetter(state.update.row, state.update.column) ){
			$square.addClass('wrong');
		}else{
			$square.removeClass('wrong');
		}
		state.update = null;
	}
	
}

//keyboard event listeners.
addEventListener("keydown", function(event) {
	//for arrows, spacebar, and tab
	if( event.keyCode == 38 ){
		//up
		event.preventDefault();
		move( 0 , -1 );
	}else if( event.keyCode == 37 ){
		//left
		event.preventDefault();
		move( -1 , 0 );
	}else if( event.keyCode == 39 ){
		//right
		event.preventDefault();
		move( 1 , 0 );
	}else if( event.keyCode == 40 ){
		//down
		event.preventDefault();
		move( 0 , 1 );
	}else if( event.keyCode == 46 || event.keyCode == 8 ){
		//backspace
		event.preventDefault();
		printLetter("");
	}else if( event.keyCode == 32 )  {
		//spacebar
		event.preventDefault();
		rotateHighlight();
	}else if( event.keyCode == 9 && event.shiftKey ) {
		//tab and shift
		event.preventDefault();
		if( state.orientationAcross ){
			prevAcross();
		}else{
			prevDown();
		}
	}else if( event.keyCode == 9 )  {
		//tab
		event.preventDefault();
		if( state.orientationAcross ){
			nextAcross();
		}else{
			nextDown();
		}
	}
});

addEventListener("keypress", function(event) {
	//printable characters
	if( event.which ){
		//letter key
		event.preventDefault();
		printLetter(String.fromCharCode(event.which).toUpperCase());
	} 
});

//functions that modify state directly
function move( right , down ){
	if( (state.column() + right >= 0) && (state.column() + right < state.crossword.numColumns()) && (state.crossword.getLetter(state.row(), state.column() + right) !== ".") ){
		state.activeSquare = state.crossword.getSquare(state.row(), state.column() + right);
	}
	if( (state.row() + down >= 0) && (state.row() + down < state.crossword.numRows()) && state.crossword.getLetter(state.row() + down, state.column()) !== "." ){
		state.activeSquare = state.crossword.getSquare(state.row() + down, state.column());
	}
	updateDisplay(true);
}

function nextAcross(){
	if( state.orientationAcross ){
		state.activeSquare = state.crossword.nextAcross(state.row(), state.column());
		updateDisplay(false, true);
	}else{
		rotateHighlight();
	}
}
function prevAcross(){
	if( state.orientationAcross ){
		state.activeSquare = state.crossword.prevAcross(state.row(), state.column());
		updateDisplay(false, true);
	}else{
		rotateHighlight();
	}
}
function nextDown(){
	if( !state.orientationAcross ){
		state.activeSquare = state.crossword.nextDown(state.row(), state.column());
		updateDisplay(false, true);
	}else{
		rotateHighlight();
	}
}
function prevDown(){
	if( !state.orientationAcross ){
		state.activeSquare = state.crossword.prevDown(state.row(), state.column());
		updateDisplay(false, true);
	}else{
		rotateHighlight();
	}
}

function advance(){
	move( state.orientationAcross , !state.orientationAcross);
}

function retreat(){
	move( -state.orientationAcross , -!state.orientationAcross);
}

function rotateHighlight(focus){
	state.orientationAcross = !state.orientationAcross;
	updateDisplay(focus);
}

function printLetter(letter){
	state.answers[state.row()][state.column()] = letter;
	state.update = {row: state.row(), column: state.column(), letter: letter };
	
	//put in local storage
	localStorage.setItem( state.crossword.title , JSON.stringify(state.answers) );

	if( letter === "" ){
		retreat();
	}else{
		advance();
	}
}

function showSolution(){
	for( var row = 0; row < state.crossword.numRows(); row++ ){
		for( var col = 0; col < state.crossword.numColumns(); col++ ){
			var $square = $('.square[data-y=' + row + '][data-x=' + col +'] .square-text');
			var letter = state.crossword.getLetter(row, col);
			if( letter === ".") letter = ""; //don't print the periods
			$square.text(letter);
		}
	}
}

/*
Functions for printing in prep for NYT
*/

function nyt(){
	$("#crossword").html("");
	printClues();
}

function printClues(){
	$('#crossword').append("<div id='nyt-across'><h2>Across</h2></div>");
	for( var i = 0 ; i < state.crossword.across.length; i++ ){
		$('#nyt-across').append("<div class='nyt-row'>" + state.crossword.across[i].num + "|" + state.crossword.across[i].text + "|" + state.crossword.across[i].answer + "</div>");
	}
	$('#crossword').append("<div id='nyt-down'><h2>Down</h2></div>");
	for( var i = 0 ; i < state.crossword.down.length; i++ ){
		$('#nyt-down').append("<div class='nyt-row'>" + state.crossword.down[i].num + "|" + state.crossword.down[i].text + "|" + state.crossword.down[i].answer + "</div>");
	}
}