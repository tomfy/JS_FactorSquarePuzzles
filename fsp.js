var tile_size = 75; // tile size is tile_size x tile_size pixels.
var columns = 5; // number of columns of squares
var rows = 5; // number of rows of squares
// var canvas;
var ctx;
var offset_x = 0; // position of puzzle bounding rectangle UL corner rel to canvas UL corner.
var offset_y = 0;
var dc = false;
var heavy_line_width = 4; 

var n_steps = 0;

function load(){

    if(dc){return}

    var canvas = document.getElementById("the_canvas");
    canvas.width = columns * tile_size + 2*offset_x;
    canvas.height = rows * tile_size + 2*offset_y;
    
    ctx = canvas.getContext("2d");   

    var factors = new Array(1,2,3,5,7,11,13,2,3); 
    
    shuffle(factors);

    ctx.font="22px Arial";
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    var the_puzzle_obj = new fs_puzzle_3x3(tile_size, offset_x, offset_y, factors);
    the_puzzle_obj.display();
    // document.getElementById("the_canvas")
    canvas.onclick = function(event){handle_canvas_click(event, canvas, the_puzzle_obj)};

    
} // end of function load

function shuffle(array){ // randomize order of elements in array
    var length = array.length;
    var i,j;
    for(i=0; i<length; i++){
	for(j=0; j<length; j++){
	    var tmp = array[j];
	    var k =  Math.floor( Math.random() * length );
	    array[j] = array[k];
	    if(Math.random() < 0.6){ // swap two elements
		array[k] = tmp;
	    }else{ // 3-way swap
		var l = Math.floor( Math.random() * length );
		array[k] = array[l];
		array[l] = tmp;
	    }
	}
    }
}

// **************************************************************

function fs_puzzle_3x3(tile_size, x_offset, y_offset, factors)
{
    // methods:
    this.display = function(){ // show whole puzzle, showing texts or not as indicated by text_shown

	ctx.lineWidth=4; // heavy_line_width; // heavy box (holds the answer cells)
	ctx.strokeRect(x_offset + tile_size, y_offset + tile_size, 3*tile_size, 3*tile_size);
	ctx.lineWidth=2;
	for (var box_coord in this.answer_boxes.items) {
	    if (this.answer_boxes.hasItem(box_coord)) {
		this.answer_boxes.items[box_coord].show_box();
	    }
	}
    }

    this.show_w_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	console.log("top of show_a_box");
	if(this.answer_boxes.hasItem(box_coord)){	    
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = true;
	    abox.show_box();
	}
    }
    this.show_wo_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.answer_boxes.hasItem(box_coord)){
	    console.log("in hide_a_box");
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.show_box();
	}
    }
    this.toggle_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.answer_boxes.hasItem(box_coord)){
	    this.answer_boxes.items[box_coord].toggle_text();
	}
    }

    this.tile_size = tile_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.factors = factors;
    this.rows = 3;
    this.columns = 3;
    this.answer_boxes = new HashTable({});
    this.clue_boxes = new HashTable({});
    var i,j;
    for(i=1; i<=this.rows; i++){
	for(j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    var the_factor = this.factors[factor_index];
	    console.log("i,j: ", i + " " + j + " " + factor_index + " factor: " + the_factor );
	    var the_box = new number_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size, the_factor, false);
	    //   the_box.show();
	    console.log("after the_box.show()");
	    this.answer_boxes.setItem(key, the_box ); 
	}
    }
    this.display();

} // end of fs_puzzle_3x3

// ********************************************************

function number_box(box_size, x_offset, y_offset, number, text_shown){
    this.box_size = box_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.number = number;
    this.text_shown = text_shown;

    this.show_box = function(){
	ctx.strokeStyle = "#000000";
	ctx.strokeRect( this.x_offset, this.y_offset, this.box_size, this.box_size);
	if(this.text_shown){
	    ctx.fillStyle = "#000000";
	    ctx.fillText(this.number, this.x_offset + this.box_size/2, this.y_offset + this.box_size/2 );
	}
    }
    this.show_text = function (){
	ctx.fillStyle = "#000000";
	ctx.fillText(this.number, this.x_offset + this.box_size/2, this.y_offset + this.box_size/2 );
	this.text_shown = true;
    }
    this.hide_text = function(){
	console.log("In number_box.hid.");
	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect( this.x_offset+5, this.y_offset+5, this.box_size-10, this.box_size-10);
	this.text_shown = false;
    }
    this.toggle_text = function(){
	if(this.text_shown){
	    this.hide_text();
	}else{
	    this.show_text();
	}
    }

}

function handle_canvas_click(event, canvas, puzzle_obj){
    console.log("puzzleobj tilesize: " + puzzle_obj.tile_size);
    var canvas_minus_mouse_coord = 
	parseFloat(canvas.style.margin) + 
	parseFloat(canvas.style.padding) + 
	parseFloat(canvas.style.border); // assuming all 4 margins, etc. are equal

    // use event.pageX to get position relative to the upper left hand corner of page. clientX gives coords rel to 
    // upper left corner of visible area of window. So if there is, for example, a word which moves up and down as you scroll
    // clientX when you click on that word will change as you scroll, but pageX when you click on that word will be the same.
    this.x = event.pageX - canvas_minus_mouse_coord; // location of mouse click in canvas coords
    this.y = event.pageY - canvas_minus_mouse_coord;
    console.log("mouse x,y rel to canvas UL corner: " + this.x + " " + this.y);
    this.puzzle_obj = puzzle_obj;
    var dx0 = (this.x - (offset_x + 0.5*tile_size)); // distance from center of first square
    var dy0 = (this.y - (offset_y + 0.5*tile_size));
    
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
    puzzle_obj.toggle_text(ix, iy);
    

}
