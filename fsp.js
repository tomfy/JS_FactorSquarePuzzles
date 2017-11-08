var tile_size = 72; // 120; // tile size is tile_size x tile_size pixels.
var columns = 4; // number of columns of squares
var rows = 5; // number of rows of squares
var offset_x_in_tiles = 0.75; // tile_size/2; // position of puzzle bounding rectangle UL corner rel to canvas UL corner.
var offset_y_in_tiles = 0.75; // tile_size/2;
var heavy_line_width = 4; 

var n_steps = 0;

function load(){

    var canvas = document.getElementById("the_canvas");

    var factors = 
// [2,3,5,7,11,13,2,3]; 
// [1,1,2,2,2,3,3,5,7]; 
// [1,2,3,4,5,6,7,8,9]; 
[1,2,2,3,3,5,5,7,7];
// [2,3,4,5,6,7,8,9]; 
// [1,2,2,3,3,5,5,7,11]; 
// 1,2,3,5,7,11,13,2,3];   
//    [2,2,3,3,5,5,7,11,13];
    shuffle(factors);
    var offset_x = tile_size*offset_x_in_tiles;
    var offset_y = tile_size*offset_y_in_tiles;

    var the_puzzle_obj = 
new fs_puzzle_3x3(tile_size, offset_x, offset_y, factors, canvas);
// new fs_puzzle_3x3_type2(tile_size, offset_x, offset_y, factors, canvas);
    the_puzzle_obj.display();
    the_puzzle_obj.update_score();
    canvas.onclick = function(event){handle_canvas_click(event, canvas, the_puzzle_obj)};
    canvas.oncontextmenu = function(event){handle_canvas_click(event, canvas, the_puzzle_obj)};   
    
} // end of function load

// ****************************************************************

function fs_puzzle_3x3(tile_size, x_offset, y_offset, factors, canvas)
{

    this.tile_size = tile_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.factors = factors;
    this.rows = 3; // number of rows in the answer part (inside heavy black box)
    this.columns = 3; // number of columns in the answer part.
    this.answer_boxes = new HashTable({});
    this.clue_boxes = new HashTable({});
    var spacing_factor = 0.95;
    var score_x_offset = 0.2*tile_size;
    this.clues_used_box = new number_box(this.tile_size, this.x_offset + score_x_offset + spacing_factor*tile_size, this.y_offset + 5*this.tile_size, 
					0, false, canvas, this);
 this.n_wrong_box = new number_box(this.tile_size, this.x_offset + score_x_offset + 2*spacing_factor*tile_size, this.y_offset + 5*this.tile_size, 
					0, false, canvas, this);
this.n_correct_box = new number_box(this.tile_size, this.x_offset + score_x_offset + 3*spacing_factor*tile_size, this.y_offset + 5*this.tile_size, 
					0, false, canvas, this);
 this.score_box = new number_box(this.tile_size, this.x_offset + score_x_offset + 3*spacing_factor*tile_size, this.y_offset, 
					0, false, canvas, this);
 //this.score_box = new number_box(this.tile_size, this.x_offset + 3*tile_size, this.y_offset, 
//					0, false, canvas, this);
    this.canvas = canvas;
    this.inputted_factors = new Array(8);
    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+3) * tile_size;
    canvas.height = (this.rows+4) * tile_size;

    this.n_factors_entered = 0;
    this.n_correct_factors = 0; 
    this.n_factor_clues_used = 0;

    this.n_products_entered = 0;
    this.n_correct_products = 0;
    this.n_product_clues_used = 0;
    

    // this.ctx = canvas.getContext("2d");
    //    console.log("cntxt font: " + ctx);

    this.ctx = canvas.getContext("2d");   
    this.ctx.font = " bold " + 32 + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);
    
    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    //    this.answers = new Array();
    console.log(this);
    // 3x3 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    var the_factor = this.factors[factor_index];
	    
	    var the_answer_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size, 
					      the_factor, false, canvas, this);
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
	//   the_box.show();
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
		if(this.clue_boxes.items[box_coord].text_shown == 'number'){
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
if(this.answer_boxes.items[box_coord].text_shown == 'number'){
		    this.n_factor_clues_used++;
		}
	    }
	}
	console.log("puzzle factors entered: " + this.n_factors_entered + ". correct factors entered: " + this.n_correct_factors + ". factor clues used: " + this.n_factor_clues_used);
// revealing a clue -2 pts, right answer +2 points, wrong answer -1 point.
	var score = 16 +
	    3*this.n_correct_factors 
	    - this.n_factors_entered 
	    - 2*this.n_factor_clues_used 
	    + 3*this.n_correct_products 
	    - this.n_products_entered 
	    - 2*this.n_product_clues_used;
	    console.log("SCORE: " + score);

	this.clues_used_box.number = this.n_product_clues_used + this.n_factor_clues_used;
	this.n_correct_box.number = this.n_correct_factors + this.n_correct_products;
	this.n_wrong_box.number = this.n_factors_entered + this.n_products_entered - this.n_correct_box.number;
	this.score_box.number = score;
	this.clues_used_box.update_number();
	this.n_wrong_box.update_number();
	this.n_correct_box.update_number();
	this.score_box.update_number();
    }
    this.display = function(){ // show whole puzzle, showing texts or not as indicated by text_shown

	this.ctx.lineWidth=heavy_line_width; // heavy box (holds the answer cells)
	this.ctx.strokeRect(x_offset + tile_size, y_offset + tile_size, 3*tile_size, 3*tile_size);
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
	console.log("top of show_a_box");
	if(this.clue_boxes.hasItem(box_coord)){	    
	    var abox = this.clue_boxes.items[box_coord];
	    abox.text_shown = 'number';
	    abox.show_box();
	}else if(this.answer_boxes.hasItem(box_coord)){	    
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = 'number';
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


} // end of fs_puzzle_3x3


function fs_puzzle_3x3_type2(tile_size, x_offset, y_offset, factors, canvas)
// the factors go along the edges, and the products in the middle
{

    this.tile_size = tile_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.factors = factors;
    this.rows = 3;
    this.columns = 3;
    this.factor_boxes = new HashTable({});
    this.product_boxes = new HashTable({});
    this.clues_used_box = new number_box(this.tile_size, this.x_offset + tile_size, this.y_offset + 5*tile_size, 
					0, false, canvas, this);
 this.n_wrong_box = new number_box(this.tile_size, this.x_offset + 2*tile_size, this.y_offset + 5*tile_size, 
					0, false, canvas, this);
this.n_correct_box = new number_box(this.tile_size, this.x_offset + 3*tile_size, this.y_offset + 5*tile_size, 
					0, false, canvas, this);
 this.score_box = new number_box(this.tile_size, this.x_offset + 3*tile_size, this.y_offset, 
					0, false, canvas, this);
    this.canvas = canvas;
    this.inputted_factors = new Array(8);
    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+3) * tile_size;
    canvas.height = (this.rows+4) * tile_size;

    this.n_factors_entered = 0;
    this.n_correct_factors = 0; 
    this.n_factor_clues_used = 0;

    this.n_products_entered = 0;
    this.n_correct_products = 0;
    this.n_product_clues_used = 0;
    

    // this.ctx = canvas.getContext("2d");
    //    console.log("cntxt font: " + ctx);

    this.ctx = canvas.getContext("2d");   
    this.ctx.font = " bold " + 32 + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);
    
    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";


  // factor boxes - rows
    for(var i=1; i<=this.rows; i++){
	var the_factor_box = new number_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size, 
					this.factors[i-1], false, canvas, this);
	console.log("after the_box.show()");
	this.factor_boxes.setItem( 0 + "," + i, the_factor_box ); 
    }
    // factor boxes - columns
    for(var i=1; i<=this.columns; i++){
	var the_factor_box = new number_box(this.tile_size,
					this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset, 
					this.factors[this.rows+i - 1], false, canvas, this);
	console.log("after the_box.show()");
	this.factor_boxes.setItem( i + "," + (this.rows+1), the_factor_box ); 
    }

    //    this.answers = new Array();
    console.log(this);
    // 3x3 product clue boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + ',' + i;
	    var l_factor_key = '0,' + i;
	    var b_factor_key = j + ',' + (this.rows+1);
	    var l_factor = this.factor_boxes.getItem(l_factor_key).number;
	    var b_factor = this.factor_boxes.getItem(b_factor_key).number;
	    console.log("factors: " + l_factor + "  " + b_factor);
	    var the_product_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size, 
					      l_factor*b_factor, false, canvas, this);
	    this.product_boxes.setItem(key, the_product_box ); 
	}
    }
    
// ******************************************************************************
   
// methods:

    this.update_score = function(){

	this.n_factors_entered = 0;
	this.n_correct_factors = 0; 
	this.n_factor_clues_used = 0;

	this.n_products_entered = 0;
	this.n_correct_products = 0; 
	this.n_product_clues_used = 0;

	for (var box_coord in this.product_boxes.items) {
	    if (this.product_boxes.hasItem(box_coord)) {
		//	this.product_boxes.items[box_coord].show_box();
	this.n_products_entered += this.product_boxes.items[box_coord].count_inputs;
		if(this.product_boxes.items[box_coord].number == this.product_boxes.items[box_coord].user_input_value){
		    this.n_correct_products++;
		}
		if(this.product_boxes.items[box_coord].text_shown == 'number'){
		    this.n_product_clues_used++;
		}
		
	    }
	}
	console.log("puzzle products entered: " + this.n_products_entered + ". correct products entered: " + this.n_correct_products  + ". product clues used: " + this.n_product_clues_used);
	for (var box_coord in this.factor_boxes.items) {
	    if (this.factor_boxes.hasItem(box_coord)) {
		this.n_factors_entered += this.factor_boxes.items[box_coord].count_inputs;
		if(this.factor_boxes.items[box_coord].number == this.factor_boxes.items[box_coord].user_input_value){
		    this.n_correct_factors++;
		}
if(this.factor_boxes.items[box_coord].text_shown == 'number'){
		    this.n_factor_clues_used++;
		}
	    }
	}
	console.log("puzzle factors entered: " + this.n_factors_entered + ". correct factors entered: " + this.n_correct_factors + ". factor clues used: " + this.n_factor_clues_used);
	var score = 16 +
	    3*this.n_correct_factors 
	    - this.n_factors_entered 
	    - 2*this.n_factor_clues_used 
	    + 3*this.n_correct_products 
	    - this.n_products_entered 
	    - 2*this.n_product_clues_used;
	    console.log("SCORE: " + score);

	this.clues_used_box.number = this.n_product_clues_used + this.n_factor_clues_used;
	
	this.n_correct_box.number = this.n_correct_factors + this.n_correct_products;
	this.n_wrong_box.number = this.n_factors_entered + this.n_products_entered - this.n_correct_box.number;
	this.score_box.number = score;

	this.clues_used_box.update_number();
	this.n_wrong_box.update_number();
	this.n_correct_box.update_number();
	this.score_box.update_number();
    }
    this.display = function(){ // show whole puzzle, showing texts or not as indicated by text_shown

	this.ctx.lineWidth=heavy_line_width; // heavy box (holds the answer cells)
	this.ctx.strokeRect(x_offset + tile_size, y_offset + tile_size, 3*tile_size, 3*tile_size);
	this.ctx.lineWidth=2;
	for (var box_coord in this.product_boxes.items) {
	    if (this.product_boxes.hasItem(box_coord)) {
		this.product_boxes.items[box_coord].show_box();
	    }
	}
	for (var box_coord in this.factor_boxes.items) {
	    if (this.factor_boxes.hasItem(box_coord)) {
		this.factor_boxes.items[box_coord].show_box();
	    }
	}
    }

    this.show_box_number = function(ix, iy){
	var box_coord = ix + ',' + iy;
	console.log("top of show_a_box");
	if(this.product_boxes.hasItem(box_coord)){	    
	    var abox = this.product_boxes.items[box_coord];
	    abox.text_shown = 'number';
	    abox.show_box();
	}else if(this.factor_boxes.hasItem(box_coord)){	    
	    var abox = this.factor_boxes.items[box_coord];
	    abox.text_shown = 'number';
	    abox.show_box();
	}
    }
    this.hide_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.product_boxes.hasItem(box_coord)){
	    console.log("in hide_a_box");
	    var abox = this.product_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.hide_text();
	}else if(this.factor_boxes.hasItem(box_coord)){	    
	    var abox = this.factor_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.hide_text();
	}
    }
    this.toggle_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.product_boxes.hasItem(box_coord)){
	    this.product_boxes.items[box_coord].toggle_text();
	}else if(this.factor_boxes.hasItem(box_coord)){
	    this.factor_boxes.items[box_coord].toggle_text();
	}
    }
    this.input_box_number= function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.product_boxes.hasItem(box_coord)){
	    this.product_boxes.items[box_coord].input_number();
	}else if(this.factor_boxes.hasItem(box_coord)){
	    this.factor_boxes.items[box_coord].input_number();
	}
    }

  this.box_text_shown= function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.product_boxes.hasItem(box_coord)){
	    return this.product_boxes.items[box_coord].text_shown;
	}else if(this.factor_boxes.hasItem(box_coord)){
	    return this.factor_boxes.items[box_coord].text_shown;
	}
    }


} // end of fs_puzzle_3x3_type2


// ************************************************************************************

// a clue_box has a rectangle containing a number, which can be shown or hidden
function number_box(box_size, x_offset, y_offset, number, text_shown, canvas, puzzle){
    this.box_size = box_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.number = number;
    this.text_shown = text_shown; // blank | number | user_input
    var the_box = this;
    this.user_input_value = '';
    this.count_inputs = 0;

    var canvas_margin_etc =
	parseFloat(canvas.style.margin) +
	parseFloat(canvas.style.padding) +
	parseFloat(canvas.style.border);

    this.ctx = canvas.getContext("2d");
    console.log("Context font: ", this.ctx.font);

    this.text_x = this.x_offset + this.box_size/2;
    this.text_y = this.y_offset + (0.5 - 0.0)*this.box_size;

    this.show_box = function(){ // show the box, with text specified by text_shown
	this.ctx.strokeStyle = "#000000";
	this.ctx.strokeRect( this.x_offset, this.y_offset, this.box_size, this.box_size);
	if(this.text_shown == 'number'){
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.number, this.text_x, this.text_y);
	}else if(this.text_shown == 'user_input'){
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	}
    }
    this.show_number = function (){ // show the number and set text_shown to 'number'
	this.ctx.fillStyle = "#000000";
	this.ctx.fillText(this.number, this.text_x, this.text_y);
	this.text_shown = 'number';
    }
    this.update_number = function(){ // erase text, then show number
	this.hide_text();
	this.show_number();
    }
    this.show_input_value = function (){ // write the user-input value on the canvas
	this.ctx.fillStyle = "#00A000";
	this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	this.text_shown = 'user_input';
    }
    this.hide_text = function(){ // hide the text 
	console.log("In number_box.hid.");
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
	ac.className = "text";
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
	    console.log("old/new values: " + the_box.user_input_value + "; " + this.value);
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
	    puzzle.update_score(); // 4*n_right_factor_answers + 2*n_right_clue_answers - (3*n_clues_shown + 2*n_answersinput + n_clues_input)
	}, false);
	
	ac.style.font = " bold " + this.ctx.font; // font_size + " px Arial";
	ac.style.fillStyle = "#008800";
	console.log(ac.style.font);
	console.log("ac.style.font: " + ac.style.font);
	ac.style.top = (this.y_offset + canvas_margin_etc + 0.28*this.box_size ) + "px";
	ac.style.left = (this.x_offset + canvas_margin_etc + (0.58 - width_coeff/2)*this.box_size ) + "px"
	ac.value = the_box.user_input_value || '';
	document.body.appendChild(ac);
	ac.select()
	console.log("in function input_number!!!!");
    }
}

function handle_canvas_click(event, canvas, puzzle_obj){
    console.log("puzzleobj tilesize: " + puzzle_obj.tile_size);
    var canvas_margin_etc = 
	parseFloat(canvas.style.margin) + 
	parseFloat(canvas.style.padding) + 
	parseFloat(canvas.style.border); // assuming all 4 margins, etc. are equal

    // use event.pageX to get position relative to the upper left hand corner of page. clientX gives coords rel to 
    // upper left corner of visible area of window. So if there is, for example, a word which moves up and down as you scroll
    // clientX when you click on that word will change as you scroll, but pageX when you click on that word will be the same.


    this.x = event.pageX - canvas_margin_etc; // location of mouse click in canvas coords
    this.y = event.pageY - canvas_margin_etc;
    console.log("mouse x,y rel to canvas UL corner: " + this.x + " " + this.y);
    this.puzzle_obj = puzzle_obj;
    var dx0 = (this.x - (puzzle_obj.x_offset + 0.5*tile_size)); // distance from center of first square
    var dy0 = (this.y - (puzzle_obj.y_offset + 0.5*tile_size));
    
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
    if(event.type == 'contextmenu'){
	event.preventDefault();
	puzzle_obj.hide_box_text(ix, iy);
	puzzle_obj.show_box_number(ix, iy);
	puzzle_obj.update_score();
    }else if(event.type == 'click'){
	if(puzzle_obj.box_text_shown(ix, iy) != 'number'){
	puzzle_obj.input_box_number(ix, iy);
    }

    }
    //    puzzle_obj.toggle_box_text(ix, iy); 

}
