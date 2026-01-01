var tile_size = 64; // 72; // 120; // tile size is tile_size x tile_size pixels.
var offset_x_in_tiles = 1.3; //0.75; // tile_size/2; // position of puzzle bounding rectangle UL corner rel to canvas UL corner.
var offset_y_in_tiles = 1.3; // tile_size/2;
var heavy_line_width = 4;
var font_size = 28;

var n_steps = 0;

var product_clue_cost = 1;
var factor_clue_cost = 2;
var wrong_cost = 2;
var right_score = 1;

document.addEventListener('DOMContentLoaded', load);

// give it
// 1) a set of factors, e.g. '2,2,3,3,5,5,7,11,13'
// 2) a number of factors, e.g. 12
// 3) a 'depth' - the maximum number of factors to go in a box
// repeat factors to get the number requested, e.g. 2,2,3,3,5,5,7,11,13,2,2,3
// then for a x b rectangle, and depth d, get string of a x b x d factors, by either:
// padding with 1's (if necessary) to get enough (a x b x d), or
// truncating to desired number (a x b x d);
// shuffle this string of numbers and put into the boxes, ...

var g_canvas;

var puzzleTypes = {
    "2x3": {c: fs_puzzle_2x3, pr: ["2,3,5,7,11,2", "2,3,5,7,11,13"], nf: 6},
    "3x3": {c: fs_puzzle_3x3, pr: ["2,2,2,3,3,3,5", "2,3,5,7,11,13"], nf: 9},
    "3x4": {c: fs_puzzle_3x4, pr: ["2,2,2,3,3,3,5,5,7,11"], nf: 12},
    "5x5": {c: fs_puzzle_5x5, pr: ["2,2,2,2,2,3,3,3,3,3,5,5,5,7,7,7,11,11,13,13"], nf: 21},
    "5x5B": {c: fs_puzzle_5x5B, pr: ["2,2,2,2,2,3,3,3,3,3,5,5,5,7,7,7,11,11,13,13"], nf: 21}
}

function load(){
    g_canvas = document.getElementById("the_canvas");
    var depthSelect = document.getElementById("depth");
    var factorBox = document.getElementById("factorBox");
    var nFactorBox = document.getElementById("nFactorBox");
    var factorSelect = document.getElementById("factorSelect");
    var gameTypeSelector = document.getElementById("gameType");
    for(k in puzzleTypes) {
        var option = document.createElement("option");
        option.value = k;
        option.textContent = k;
        gameTypeSelector.appendChild(option);
    }
    var currentType = "3x3";
    var currentDepth = 1;
    updatePresets(puzzleTypes[currentType]);
    factorBox.value = puzzleTypes[currentType].pr[0];
    console.log("Nfactors: " + puzzleTypes[currentType].nf);
    nFactorBox.value = puzzleTypes[currentType].nf;
    function updatePresets(puzzleType) {
        while(depthSelect.firstChild){
            depthSelect.removeChild(depthSelect.firstChild);
        }
        for(var i=1; i<=2; i++){
            var option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            depthSelect.appendChild(option);
        }

	// console.log("PPPPPPPPPPP puzzleType: " + puzzleType);
        while(factorSelect.firstChild) {
            factorSelect.removeChild(factorSelect.firstChild);
        }
        for(var i = -1; i < puzzleType.pr.length; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.textContent = i < 0 ? "Select..." : puzzleType.pr[i];
            factorSelect.appendChild(option);
        }
    } // end of updatePresets

    gameTypeSelector.addEventListener("change", function(event) {
        var puzzleType = puzzleTypes[event.target.value];
	// console.log("xxxxxxxxxxx: " + parseInt(event.target.value) + "  " + event.target.value);
        currentType = event.target.value;
        updatePresets(puzzleType);
    });
    depthSelect.addEventListener("change", function(event) {
	// var puzzleType = puzzleTypes[event.target.value];
	// console.log("xxxxxxxxxxx: " + parseInt(event.target.value) + "  " + event.target.value);
        currentDepth = event.target.value;
	//  updatePresets(puzzleType);
    });

    factorSelect.addEventListener("change", function(event) {
        var h = parseInt(event.target.value);
	//      console.log("hhhhhhhhhhhhhhhhhhhhhh: " + h);
        if (h < 0) return;
        factorBox.value = puzzleTypes[currentType].pr[h];
	//        console.log("yyyyyyyyy: " + puzzleTypes[currentType].c);
	//       console.log("zzzzzzzzzz: " + factorBox.value);
    });
    var startButton = document.getElementById("buttonStart");
    function startGame() {
        var puzzleType = puzzleTypes[gameTypeSelector.value];
        var factorText = factorBox.value;
        console.log("puzzleType: " + puzzleType.c + "  factorText: " + factorText);
        if (factorText.length == 0) {
            alert("No factors entered!");
            return;
        }
        var factors = factorText.split(/,\s*/).map(function(x) { return parseInt(x) }); //
        if(factors.length == 0 || factors.map(function(x) { return x != x }).includes(true)) {
            alert("Invalid factors!");
            return;
        }
        location.hash = '#type=' + gameTypeSelector.value + '&f=' + btoa(factorText);

        var depth = currentDepth;
        switchToPuzzle(puzzleType.c, factors, nFactorBox.value, depth);
    }

    startButton.addEventListener("click", function(event) {
        startGame();
    });

    if(location.hash.length > 0) {
        var settings = {};
        var spl = location.hash.substr(1).split("&");
        for(var i = 0; i < spl.length; i++) {
            console.log("spl[i]: " + spl[i]);
            var spl2 = spl[i].split("=");
            console.log("spl2:  " + spl2);
            settings[spl2[0]] = spl2[1];
        }
        gameTypeSelector.value = settings.type;
        factorBox.value = atob(settings.f);
        startGame();
    }

} // end of load

function switchToPuzzle(puzzle_constructor, factors, n_factors, depth) {

    // [2,3,5,7,11,13,2,3];
    // [1,1,2,2,2,3,3,5,7];
    // [1,2,3,4,5,6,7,8,9];
    // [1,2,2,3,3,5,5,7,7];
    // [1,1,2,2,3,3,5,5,7];
    // [2,3,4,5,6,7,8,9];
    // [1,2,2,3,3,5,5,7,11];
    // 1,2,3,5,7,11,13,2,3];
    //    [2,2,3,3,5,5,7,11,13];

    var offset_x = tile_size*offset_x_in_tiles;
    var offset_y = tile_size*offset_y_in_tiles;

    var the_puzzle_obj = new puzzle_constructor(tile_size, offset_x, offset_y, factors, n_factors, depth, g_canvas);
    //    var the_puzzle_obj =
    //        new fs_puzzle_3x3(tile_size, offset_x, offset_y, [1,2,3,4,5,6,7,8,9], canvas);

    //   new fs_puzzle_3x4(tile_size, offset_x, offset_y,  [1,1,2,2,3,3,5,5,7,7,11,13], canvas);
    // [2,2,3,3,5,5,7,7,11,11,13,13], canvas);
    // [1,1,2,2,3,3,5,5,7,7,11,13], canvas);
    //    new fs_puzzle_5x5(tile_size, offset_x, offset_y, [1,1,1,1,2,2,2,2,2,3,3,3,3,5,5,5,5,7,7,7,11,11,11,13,13], canvas);

    // new fs_puzzle_3x3_type2(tile_size, offset_x, offset_y, factors, canvas);
    the_puzzle_obj.display();
    the_puzzle_obj.update_score();
    g_canvas.onmousedown = function(event) {
	if('which' in event ? event.which == 3 : event.button == 2) { handle_canvas_click(event, g_canvas, the_puzzle_obj, true) } }
    g_canvas.onclick = function(event){console.log('click'); handle_canvas_click(event, g_canvas, the_puzzle_obj, false)};
    g_canvas.oncontextmenu = function(event) { event.preventDefault(); return false } //function(event){handle_canvas_click(event, g_canvas, the_puzzle_obj)};

} // end of function load

// ****************************************************************

function fs_puzzle(tile_size, x_offset, y_offset, rows, columns, factors, n_factors, depth, canvas){
    this.tile_size = tile_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.rows = rows;
    this.columns = columns;
    this.score_x_position = x_offset + 0.5*(columns+1)*tile_size;
    this.score_y_position = y_offset; //
    this.info_x_position = x_offset + this.score_x_position - tile_size;
    this.info_y_position = y_offset + (rows+2+0.1)*tile_size;
    //  this.info_x_offset =
    all_factors = []; // get an array of factors which is big enough.
    for(var i = 0; i< n_factors; i++){
        all_factors.push(factors[i % factors.length]);
    }
    var N = rows * columns * depth;
    while(all_factors.length < N){  // pad with 1's
        all_factors.push(1);
    }
    if(all_factors.length > N){
        all_factors.length = N; //  = all_factors.slice(0,N);
    }
    console.log("all factors: " + all_factors);
    shuffle(all_factors); // then randomize the order.
    this.factors = all_factors;
    this.answer_boxes = new HashTable({});
    this.clue_boxes = new HashTable({});

    this.n_factors_entered = 0;
    this.n_correct_factors = 0;
    this.n_factor_clues_used = 0;

    this.n_products_entered = 0;
    this.n_correct_products = 0;
    this.n_product_clues_used = 0;

    /* this.ctx = canvas.getContext("2d");
       this.ctx.font = " bold " + 32 + "px Arial";
       //    console.log("font_size: " + font_size );
       console.log("ctx.font: " + this.ctx.font);

       this.ctx.textAlign="center";
       this.ctx.textBaseline="middle"; */

    // methods:

    this.update_score = function(){

	this.n_factors_entered = 0;
	this.n_correct_factors = 0;
	this.n_factor_clues_used = 0;

	this.n_products_entered = 0;
	this.n_correct_products = 0;
	this.n_product_clues_used = 0;

	for (var box_coord in this.clue_boxes.items) {
	    if (this.clue_boxes.hasItem(box_coord)) {
		//	this.clue_boxes.items[box_coord].show_box();
		this.n_products_entered += this.clue_boxes.items[box_coord].count_inputs;
		if(this.clue_boxes.items[box_coord].number == this.clue_boxes.items[box_coord].user_input_value){
		    this.n_correct_products++;
		}
		if(this.clue_boxes.items[box_coord].text_shown == 'answer_number'){
		    this.n_product_clues_used++;
		}

	    }
	}
	console.log("puzzle products entered: " + this.n_products_entered + ". correct products entered: " + this.n_correct_products  + ". product clues used: " + this.n_product_clues_used);
	for (var box_coord in this.answer_boxes.items) {
	    if (this.answer_boxes.hasItem(box_coord)) {
		this.n_factors_entered += this.answer_boxes.items[box_coord].count_inputs;
		if(this.answer_boxes.items[box_coord].number == this.answer_boxes.items[box_coord].user_input_value){
		    this.n_correct_factors++;
		}
		if(this.answer_boxes.items[box_coord].text_shown == 'answer_number'){
		    this.n_factor_clues_used++;
		}
	    }
	}
	console.log("puzzle factors entered: " + this.n_factors_entered + ". correct factors entered: " + this.n_correct_factors + ". factor clues used: " + this.n_factor_clues_used);
	// revealing a clue -2 pts, right answer +2 points, wrong answer -1 point.
	console.log(this.init_score + "  " +
		    this.n_correct_factors + " " + this.n_factors_entered + " " + this.n_factor_clues_used + "  " +
		    this.n_correct_products + " " + this.n_products_entered + " " + this.n_product_clues_used);
	var score = this.init_score +
	    3*this.n_correct_factors
	    - this.n_factors_entered
	    - 2*this.n_factor_clues_used
	    + 3*this.n_correct_products
	    - this.n_products_entered
	    - 2*this.n_product_clues_used;
	console.log("SCORE: " + score);

	score = this.init_score +
            (right_score + wrong_cost)*this.n_correct_factors
	    - wrong_cost*this.n_factors_entered
	    - factor_clue_cost*this.n_factor_clues_used
	    + (right_score + wrong_cost)*this.n_correct_products
	    - wrong_cost*this.n_products_entered
	    - (product_clue_cost)*this.n_product_clues_used;

	this.clues_used_box.number = this.n_product_clues_used + this.n_factor_clues_used;
	this.n_correct_box.number = this.n_correct_factors + this.n_correct_products;
	this.n_wrong_box.number = this.n_factors_entered + this.n_products_entered - this.n_correct_box.number;
	this.score_box.number = score;
	this.clues_used_box.update_number(); // update the numbers showing
	this.n_wrong_box.update_number();
	this.n_correct_box.update_number();
	this.score_box.update_number();
    }
    this.display = function(){ // show whole puzzle, showing texts or not as indicated by text_shown

	this.ctx.lineWidth=heavy_line_width; // heavy box (holds the answer cells)
	this.ctx.strokeRect(x_offset + tile_size, y_offset + tile_size, this.columns*tile_size, this.rows*tile_size);

	this.ctx.lineWidth=2;
	for (var box_coord in this.clue_boxes.items) {
	    if (this.clue_boxes.hasItem(box_coord)) {
		this.clue_boxes.items[box_coord].show_box();
	    }
	}
	for (var box_coord in this.answer_boxes.items) {
	    if (this.answer_boxes.hasItem(box_coord)) {
		this.answer_boxes.items[box_coord].show_box();
	    }
	}
    }

    this.show_box_number = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    var abox = this.clue_boxes.items[box_coord];
	    abox.text_shown = 'answer_number';
	    abox.show_box();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = 'answer_number';
	    abox.show_box();
	}
    }
    this.hide_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    console.log("in hide_a_box");
	    var abox = this.clue_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.hide_text();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.hide_text();
	}
    }
    this.toggle_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    this.clue_boxes.items[box_coord].toggle_text();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    this.answer_boxes.items[box_coord].toggle_text();
	}
    }
    this.input_box_number= function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    this.clue_boxes.items[box_coord].input_number();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    this.answer_boxes.items[box_coord].input_number();
	}
    }

    this.box_text_shown= function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    return this.clue_boxes.items[box_coord].text_shown;
	}else if(this.answer_boxes.hasItem(box_coord)){
	    return this.answer_boxes.items[box_coord].text_shown;
	}
    }

}

function info_boxes(pzzl, spacing_factor, canvas){
    pzzl.clues_used_box = new number_box(pzzl.tile_size, pzzl.score_x_position - spacing_factor*pzzl.tile_size,
					 pzzl.info_y_position,
					 0, false, canvas, pzzl);
    pzzl.n_wrong_box = new number_box(pzzl.tile_size, pzzl.score_x_position, 
				      pzzl.info_y_position,
				      0, false, canvas, pzzl);
    pzzl.n_correct_box = new number_box(pzzl.tile_size, pzzl.score_x_position + spacing_factor*pzzl.tile_size,
					pzzl.info_y_position,
					0, false, canvas, pzzl);
    pzzl.score_box = new number_box(pzzl.tile_size, pzzl.score_x_position, pzzl.score_y_position,
				    0, false, canvas, pzzl);
}

function fs_puzzle_2x3(tile_size, x_offset, y_offset, factors, n_factors, depth, canvas)
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 2, 3, factors, n_factors, depth, canvas);
    this.n_clues = 7;
    this.init_score = this.n_clues*product_clue_cost; // such that if first thing you do is do ask for all clues, you will then have 0
    var spacing_factor = 1.0;
    info_boxes(this, spacing_factor, canvas);

    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+1) * tile_size + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size + 2*this.y_offset;

    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);

    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    //    this.answers = new Array();
    console.log("This:  ", this);
    // 2x3 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    //    var the_factor = this.factors[factor_index];
            var the_answer_number = 1;
	    for(var k = 0; k<depth; k++){
                the_answer_number *= this.factors[factor_index + k*this.rows*this.columns];
            }
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						//  the_factor,
                                                the_answer_number, false, canvas, this);
	    this.answer_boxes.setItem(key, the_answer_box );
	}
    }

    // clue boxes - rows
    // left side row clues:
    for(var i=1; i<=this.rows; i++){
	var row_product = 1;
	for(var j=1; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box );
    }
    // right side row clues
    for(var i=1; i<=this.rows; i++){
	var row_product = 1;
	for(var j=1; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset + (this.cols+1)*tile_size, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( (this.cols+1) + "," + i, the_clue_box );
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1;
	for(var j=1; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					  col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box );
    }
    // clue boxes - diagonals
    // Top left diag:
    var col_product = 1;
    for(var i = 1; i<=2; i++){
	col_product *= this.answer_boxes.getItem(i + "," + i).number;
    }
    var diag1_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + 0, diag1_clue_box );

    // Bottom left diag:
    col_product = 1;
    for(var i = 1; i<=2; i++){
	col_product *= this.answer_boxes.getItem(i + "," + (3-i)).number;
    }
    var diag2_clue_box = new number_box(this.tile_size, this.x_offset, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + (this.rows+1), diag2_clue_box );

    // Top right diag:
    col_product = 1;
    for(var i = 1; i<=2; i++){
	col_product *= this.answer_boxes.getItem((4-i) + "," + i).number;
    }
    var diag3_clue_box = new number_box(this.tile_size, (this.cols+1)*tile_size + this.x_offset, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.cols+1) + "," + 0, diag3_clue_box );

    // Bottom right diag:
    col_product = 1;
    for(var i = 1; i<=2; i++){
	col_product *= this.answer_boxes.getItem((4-i) + "," + (3-i)).number;
    }
    var diag4_clue_box = new number_box(this.tile_size, (this.cols+1)*tile_size + this.x_offset, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.cols+1) + "," + (this.rows+1), diag4_clue_box );
    // ******************************************************************************

} // end of fs_puzzle_2x3

function fs_puzzle_3x3(tile_size, x_offset, y_offset, factors, n_factors, depth, canvas)
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 3, 3, factors, n_factors, depth, canvas);
    this.n_clues = 8;
    this.init_score = this.n_clues*product_clue_cost; // such that if first thing you do is do ask for all clues, you will then have 0
    var spacing_factor = 1.0;
    info_boxes(this, spacing_factor, canvas);
    canvas.width = (this.columns+1) * tile_size + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size + 2*this.y_offset;

    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    console.log(this);
    // 3x3 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    //    var the_factor = this.factors[factor_index];
            var the_answer_number = 1;
	    for(var k = 0; k<depth; k++){
                the_answer_number *= this.factors[factor_index + k*this.rows*this.columns];
            }
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						//  the_factor,
                                                the_answer_number, false, canvas, this);
	    this.answer_boxes.setItem(key, the_answer_box );
	}
    }

    // clue boxes - rows
    for(var i=1; i<=this.rows; i++){
	var row_product = 1;
	for(var j=1; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box );
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1;
	for(var j=1; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					  col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box );
    }
    // clue boxes - diagonals
    var col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + i).number;
    }
    var diag1_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + 0, diag1_clue_box );
    col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + (4-i)).number;
    }
    var diag2_clue_box = new number_box(this.tile_size, this.x_offset, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + (this.rows+1), diag2_clue_box );
    // ******************************************************************************

} // end of fs_puzzle_3x3

function fs_puzzle_3x4(tile_size, x_offset, y_offset, factors, n_factors, depth, canvas)
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 3, 4, factors, n_factors, depth, canvas);
    this.n_clues = 14;
    this.init_score = this.n_clues*product_clue_cost; // such that if first thing you do is do ask for all clues, you will then have 0

    var spacing_factor = 1.4; // 0.95;
    info_boxes(this, spacing_factor, canvas);

    //   this.inputted_factors = new Array(8);
    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+2) * tile_size + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size + 2*this.y_offset;

    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);

    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    //    this.answers = new Array();
    console.log(this);
    // 3x4 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    //    var the_factor = this.factors[factor_index];
            var the_answer_number = 1;
	    for(var k = 0; k<depth; k++){
                the_answer_number *= this.factors[factor_index + k*this.rows*this.columns];
            }
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						//  the_factor,
                                                the_answer_number, false, canvas, this);
	    this.answer_boxes.setItem(key, the_answer_box );
	}
    }

    // clue boxes - rows
    for(var i=1; i<=this.rows; i++){
	var row_product = 1;
	for(var j=1; j<=3; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box );

        row_product = 1;
	for(var j=this.columns-2; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( (this.columns+1) + "," + i, the_clue_box );
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1;
	for(var j=1; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					  col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box );
    }
    // clue boxes - diagonals
    var col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + i).number;
    }
    var diag1_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + 0, diag1_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + (4-i)).number;
    }
    var diag2_clue_box = new number_box(this.tile_size, this.x_offset, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + (this.rows+1), diag2_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){
        console.log("i: " + i + "  " +this.columns);
	col_product *= this.answer_boxes.getItem((i+1) + "," + (4-i)).number;
    }
    var diag3_clue_box = new number_box(this.tile_size, this.x_offset + (this.columns+1)*tile_size, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.columns+1) + "," + 0, diag3_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i+1 + "," + i).number;
    }
    var diag4_clue_box = new number_box(this.tile_size, this.x_offset + (this.columns+1)*tile_size, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.columns+1) + "," + (this.rows+1), diag4_clue_box );

    // ******************************************************************************


} // end of fs_puzzle_3x4


// 5x5 with 5 clues on each side which are products of 3 in a row or column,
// plus 4 diagonals in corners.
function fs_puzzle_5x5(tile_size, x_offset, y_offset, factors, n_factors, depth, canvas)
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 5, 5, factors, n_factors, depth, canvas);
    this.n_clues = 24;
    this.init_score = this.n_clues*product_clue_cost; // such that if first thing you do is do ask for all clues, you will then have 0
    this.score_y_position -= this.tile_size;
    var spacing_factor = 1.4;
    info_boxes(this, spacing_factor, canvas);
    
    canvas.width = (this.columns+2) * tile_size  + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size  + 2*this.y_offset;
    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    console.log(this);
    // 5x5 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    //  var the_factor = this.factors[factor_index];
	    var the_answer_number = 1;
	    for(var k = 0; k<depth; k++){
                the_answer_number *= this.factors[factor_index + k*this.rows*this.columns];
            }
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						//  the_factor,
                                                the_answer_number, false, canvas, this);
	    this.answer_boxes.setItem(key, the_answer_box );
	}
    }

    // clue boxes - rows
    for(var i=1; i<=this.rows; i++){
	var row_product = 1; // left side row clues
	for(var j=1; j<=3; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box );

        row_product = 1; // right side row clues
	for(var j=this.columns-2; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( (this.columns+1) + "," + i, the_clue_box );
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1; // top edge col. clues
	for(var j=1; j<=3; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, this.y_offset,
					  col_product, false, canvas, this);
        this.clue_boxes.setItem( i + "," + 0, the_clue_box );


	col_product = 1; // bottom edge col. clues
	for(var j=this.rows-2; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					  col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box );
    }
    // clue boxes - diagonals
    var col_product = 1;
    for(var i = 1; i<=3; i++){ // top left corner diag.
	col_product *= this.answer_boxes.getItem(i + "," + i).number;
    }
    var diag1_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + 0, diag1_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){ // bottom left corner diag.
	col_product *= this.answer_boxes.getItem(i + "," + (this.rows+1-i)).number;
    }
    var diag2_clue_box = new number_box(this.tile_size, this.x_offset, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + (this.rows+1), diag2_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){ // top right corner diag.
        console.log("i: " + i + "  " +this.columns);
	col_product *= this.answer_boxes.getItem((this.rows-3+i) + "," + (4-i)).number;
    }
    var diag3_clue_box = new number_box(this.tile_size, this.x_offset + (this.columns+1)*tile_size, this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.columns+1) + "," + 0, diag3_clue_box );

    col_product = 1;
    for(var i = 1; i<=3; i++){ // bottom right corner diag.
	col_product *= this.answer_boxes.getItem((this.rows-3+i) + "," + (this.rows-3+i)).number;
    }
    var diag4_clue_box = new number_box(this.tile_size, this.x_offset + (this.columns+1)*tile_size, (this.rows+1)*tile_size + this.y_offset,
					col_product, false, canvas, this);
    this.clue_boxes.setItem( (this.columns+1) + "," + (this.rows+1), diag4_clue_box );

    // ******************************************************************************


} // end of fs_puzzle_5x5

// 5x5 with each side having 3 row/column clues and 3 diagonal clues (including corners).
// e.g. the upper-left corner and the next two clues to its right are products of diagonal,
// and the next three clues in the top row are products of columns.
function fs_puzzle_5x5B(tile_size, x_offset, y_offset, factors, n_factors, depth, canvas)
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 5, 5, factors, n_factors, depth, canvas);
    this.n_clues = 24;
    this.init_score = this.n_clues*product_clue_cost; // such that if first thing you do is do ask for all clues, you will then have a score of 0
    this.score_y_position -= this.tile_size;
    var spacing_factor = 1.4;
    info_boxes(this, spacing_factor, canvas);
    //   this.inputted_factors = new Array(8);
    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+2) * tile_size  + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size  + 2*this.y_offset;

    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);

    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    //    this.answers = new Array();
    console.log(this);
    // 5x5 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;

	    var the_answer_number = 1;
	    for(var k = 0; k<depth; k++){
                the_answer_number *= this.factors[factor_index + k*this.rows*this.columns];
            }
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						//  the_factor,
                                                the_answer_number, false, canvas, this);
            this.answer_boxes.setItem(key, the_answer_box );
	}
    }

    // clue boxes - rows
    for(var i=1; i<=this.rows; i++){
	var row_product = 1; // left side row clues
	for(var j=1; j<=3; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box );

        row_product = 1; // right side row clues
	for(var j=this.columns-2; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
					  row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( (this.columns+1) + "," + i, the_clue_box );
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1; // top edge col. clues
	for(var j=1; j<=3; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, this.y_offset,
					  col_product, false, canvas, this);
        this.clue_boxes.setItem( i + "," + 0, the_clue_box );


	col_product = 1; // bottom edge col. clues
	for(var j=this.rows-2; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new number_box(this.tile_size,
					  this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					  col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box );
    }

    // clue boxes - diagonals
    var diag_product = 1;
    // top left diagonals:
    for(var ix = 0; ix<3; ix++){ // Top edge, L to R
        diag_product = 1;
	for(var iy = 1; iy<=3; iy++){ // top down.
            console.log("ix, iy, number: " + ix + "  " + iy + " " + this.answer_boxes.getItem(ix + iy + "," + iy).number);
	    diag_product *= this.answer_boxes.getItem(ix + iy + "," + iy).number;
	}
	var diag1_clue_box = new number_box(this.tile_size, this.x_offset + ix*this.tile_size, this.y_offset,
					    diag_product, false, canvas, this);
	this.clue_boxes.setItem( ix + "," + 0, diag1_clue_box );

    }

    for(var iy = 0; iy<3; iy++){ // L edge, bottom up
        diag_product = 1;
	for(var ix = 1; ix<=3; ix++){ // L to R
	    diag_product *= this.answer_boxes.getItem(ix + "," + (this.rows+1 - ix - iy)).number;
	}
	var diag2_clue_box = new number_box(this.tile_size, this.x_offset, (this.rows+1 - iy)*tile_size + this.y_offset,
					    diag_product, false, canvas, this);
	this.clue_boxes.setItem( 0 + "," + (this.rows+1 - iy), diag2_clue_box );
    }

    for(var iy = 0; iy<3; iy++){ // R edge, top down.
	diag_product = 1;
	for(var ix = 1; ix<=3; ix++){ // R to L
	    diag_product *= this.answer_boxes.getItem((this.rows+1 - ix) + "," + (ix+iy)).number;
	}
	var diag3_clue_box = new number_box(this.tile_size,
                                            this.x_offset + (this.columns+1)*tile_size, this.y_offset
                                            + iy*this.tile_size,
				            diag_product, false, canvas, this);
	this.clue_boxes.setItem( (this.columns+1) + "," + iy, diag3_clue_box );
    }

    for(var ix = 0; ix<3; ix++){ // bottom edge, R to L
	diag_product = 1;
	for(var iy = 1; iy<=3; iy++){ // bottom up.
	    diag_product *= this.answer_boxes.getItem((this.rows-3+iy-ix) + "," + (this.rows-3+iy)).number;
	}
	var diag4_clue_box = new number_box(this.tile_size, this.x_offset + (this.columns+1 - ix)*tile_size, (this.rows+1)*tile_size + this.y_offset,
					    diag_product, false, canvas, this);
	this.clue_boxes.setItem( (this.columns+1 - ix) + "," + (this.rows+1), diag4_clue_box );
    }
    // ******************************************************************************


} // end of fs_puzzle_5x5B



function fs_puzzle_3x3_type2(tile_size, x_offset, y_offset, factors, canvas)
// the factors go along the edges, and the products in the middle
{
    fs_puzzle.call(this, tile_size, x_offset, y_offset, 3, 3, factors, canvas);

    this.answer_boxes = new HashTable({});
    this.clue_boxes = new HashTable({});
    this.clues_used_box = new number_box(this.tile_size, this.x_offset + tile_size, this.y_offset + 5*tile_size,
					 0, false, canvas, this);
    this.n_wrong_box = new number_box(this.tile_size, this.x_offset + 2*tile_size, this.y_offset + 5*tile_size,
				      0, false, canvas, this);
    this.n_correct_box = new number_box(this.tile_size, this.x_offset + 3*tile_size, this.y_offset + 5*tile_size,
					0, false, canvas, this);
    this.score_box = new number_box(this.tile_size, this.x_offset + 3*tile_size, this.y_offset,
				    0, false, canvas, this);
  
    canvas.width = (this.columns+1) * tile_size  + 2*this.x_offset;
    canvas.height = (this.rows+2) * tile_size + 2*this.y_offset;

    this.ctx = canvas.getContext("2d");
    this.ctx.font = " bold " + font_size + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);

    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";


    // factor boxes - rows
    for(var i=1; i<=this.rows; i++){
	var the_factor_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size,
					    this.factors[i-1], false, canvas, this);
	console.log("after the_box.show()");
	this.answer_boxes.setItem( 0 + "," + i, the_factor_box );
    }
    // factor boxes - columns
    for(var i=1; i<=this.columns; i++){
	var the_factor_box = new number_box(this.tile_size,
					    this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset,
					    this.factors[this.rows+i - 1], false, canvas, this);
	console.log("after the_box.show()");
	this.answer_boxes.setItem( i + "," + (this.rows+1), the_factor_box );
    }

    console.log(this);
    // 3x3 product clue boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + ',' + i;
	    var l_factor_key = '0,' + i;
	    var b_factor_key = j + ',' + (this.rows+1);
	    var l_factor = this.answer_boxes.getItem(l_factor_key).number;
	    var b_factor = this.answer_boxes.getItem(b_factor_key).number;
	    console.log("factors: " + l_factor + "  " + b_factor);
	    var the_product_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size,
						 l_factor*b_factor, false, canvas, this);
	    this.clue_boxes.setItem(key, the_product_box );
	}
    }

    // ******************************************************************************

} // end of fs_puzzle_3x3_type2


// ************************************************************************************

// a number_box has a rectangle containing a number, which can be shown or hidden
function number_box(box_size, x_offset, y_offset, number, text_shown, canvas, puzzle){
    this.box_size = box_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.number = number;
    this.text_shown = text_shown; // blank | number | user_input
    var the_box = this;
    this.user_input_value = '';
    this.count_inputs = 0;
    var green = "#008000";
    var red = "#B00000";

    var canvas_margin_etc =
	parseFloat(canvas.style.margin) +
	parseFloat(canvas.style.padding) +
	parseFloat(canvas.style.border);

    this.ctx = canvas.getContext("2d");
    console.log("Context font: ", this.ctx.font);

    this.text_x = this.x_offset + this.box_size/2;
    this.text_y = this.y_offset + (0.5 - 0.0)*this.box_size;

    this.show_box = function(){ // show the box, with text specified by text_shown
	//console.log("show_box  text_shown: ", this.text_shown, this.number);
	this.ctx.strokeStyle = "#000000";
	this.ctx.strokeRect( this.x_offset, this.y_offset, this.box_size, this.box_size);
	if(this.text_shown == 'answer_number'){
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.number, this.text_x, this.text_y);
	}else if(this.text_shown == 'user_input_correct'){
	    console.log("UIC text_shown: ", this.text_shown, this.user_input_value);
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	}else if(this.text_shown == 'user_input_wrong'){
	    console.log("UIW text_shown: ", this.text_shown, this.user_input_value);
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	}
    }
    this.show_number = function (){ // show the number and set text_shown to 'answer_number'
	//console.log("show_number  text_shown: ", this.text_shown, this.number);
	this.ctx.fillStyle = "#000000";
	this.ctx.fillText(this.number, this.text_x, this.text_y);
	this.text_shown = 'answer_number';
    }
    this.update_number = function(){ // erase text, then show number
	//console.log("update_number  text_shown: ", this.text_shown, this.number);
	this.hide_text();
	this.show_number();
    }
    this.show_input_value = function (){ // write the user-input value on the canvas
	console.log("text_shown:  ", this.text_shown);
	if(this.text_shown != 'answer_number'){
	    console.log("QQQ: show_input_value  text_shown: ", this.text_shown, this.user_input_value);
	    if(this.number == this.user_input_value){ // value entered is correct -> green
		this.text_shown = 'user_input_correct';
		this.ctx.fillStyle = green; // "#00A000";
            }else{ // value entered is not correct -> red
		this.text_shown = 'user_input_wrong';
		this.ctx.fillStyle = red; // "#00A000";
            }
	    this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	    console.log("text_shown: ", this.text_shown);
	}
    }
    this.hide_text = function(){ // hide the text
	//console.log("In number_box.hid.");
	this.ctx.strokeStyle = "#FFFFFF";
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillRect( this.x_offset+5, this.y_offset+5, this.box_size-10, this.box_size-10);
	this.text_shown = 'blank';
    }
    this.toggle_number = function(){ //
	if(this.text_shown == 'blank'){
	    this.show_number();
	}else{
	    this.hide_text();
	}
    }
    this.input_number = function(){ // add input element
	this.hide_text();
	var width_coeff = 0.8;
	var ac = document.createElement("input");
	ac.style.width = Math.floor(width_coeff*box_size) + "px";
	ac.type = "text";
	ac.style.size = 1; // Math.floor(0.1*box_size)
	ac.className = "numberEntry";
	ac.value = '';

	ac.addEventListener("keypress", function(event){
	    if(event.charCode == 13){
		console.log("this: " + this);
		console.log("Input value:", this.value);
		this.blur();
		//		this.destroy()
	    }
	}, false);
	ac.addEventListener("blur", function(){
	    console.log("blur  old/new input values: ", the_box.user_input_value, "; " + this.value);
	    //  console.log("this: " + this);
	    if(this.value != the_box.user_input_value){
		console.log("AAAAAAAAA: " + the_box.user_input_value);
		//		if(1 or this.value != ''){
		the_box.count_inputs++;
		//}
		the_box.user_input_value = this.value;
	    }
	    console.log("count_inputs: " + the_box.count_inputs);
	    document.body.removeChild(ac);
	    the_box.show_input_value();
	    console.log("AAA");
	    puzzle.update_score(); // 4*n_right_factor_answers + 2*n_right_clue_answers - (3*n_clues_shown + 2*n_answersinput + n_clues_input)
	    console.log("BBB after update_score 'blur' ");
	}, false);

	ac.style.font = " bold " + this.ctx.font; // font_size + " px Arial";
	ac.style.fillStyle = "#880000"; //red; //green; // "#008800";
	console.log(ac.style.font);
	console.log("ac.style.font: " + ac.style.font);

	var boundingRect = canvas.getBoundingClientRect();
	ac.style.top = (this.y_offset + window.scrollY + boundingRect.top + 0.28*this.box_size ) + "px";
	ac.style.left = (this.x_offset + window.scrollX + boundingRect.left + (0.48 - width_coeff/2)*this.box_size ) + "px"
	ac.value = the_box.user_input_value || '';
	document.body.appendChild(ac);
	ac.select()
	console.log("in function input_number!!!!");
    }
}

function handle_canvas_click(event, canvas, puzzle_obj, is_rightclick){
    console.log("puzzleobj tilesize: " + puzzle_obj.tile_size);
    var boundingRect = canvas.getBoundingClientRect();


    // use event.pageX to get position relative to the upper left hand corner of page. clientX gives coords rel to
    // upper left corner of visible area of window. So if there is, for example, a word which moves up and down as you scroll
    // clientX when you click on that word will change as you scroll, but pageX when you click on that word will be the same.


    var x = event.clientX - boundingRect.left; // location of mouse click in canvas coords
    var y = event.clientY - boundingRect.top;
    console.log("x, y: " + x + " " + y );
    console.log("mouse x,y rel to canvas UL corner: " + this.x + " " + this.y);
    var dx0 = (x - (puzzle_obj.x_offset + 0.5*tile_size)); // distance from center of first square
    var dy0 = (y - (puzzle_obj.y_offset + 0.5*tile_size));

    var ix =  Math.round(dx0/tile_size);
    var iy =  Math.round(dy0/tile_size);
    console.log(ix + "  " + iy);
    var dx = dx0 - ix*tile_size; // distance from nearest center.
    var dy = dy0 - iy*tile_size;
    // alert("dx: " + dx + " dy: " + dy);
    if(Math.abs(dx) > 0.47*tile_size){ return; }
    if(Math.abs(dy) > 0.47*tile_size){ return; }
    //    ctx.fillText(ix+','+iy , this.x, this.y);
    console.log("ix: " + ix + "; iy: " + iy);
    console.log("event type: " + event.type);
    console.log('btn', event.button);
    if(is_rightclick){
	console.log("XXX");
	puzzle_obj.hide_box_text(ix, iy);
	puzzle_obj.show_box_number(ix, iy);

	puzzle_obj.update_score();
	console.log("YYY after update_score in  handle_canvas_click");
    }else{
	if(puzzle_obj.box_text_shown(ix, iy) != 'answer_number'){ // if click on anything besides answer_number, show input box:
	    puzzle_obj.input_box_number(ix, iy);
	}

    }
    //    puzzle_obj.toggle_box_text(ix, iy);

}
