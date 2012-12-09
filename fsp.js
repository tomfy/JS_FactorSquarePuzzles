
var tile_size = 60; // tile size is tile_size x tile_size pixels.
var columns = 5; // width in tiles of ant's world 
var rows = 5; // height in tiles of ant's world
var canvas;
var ctx;

var dc = false;
	
var n_steps = 0;

function load(x){
	if(dc && x === undefined){return}
	canvas = document.getElementById("the_canvas");

		canvas.width = (columns+1) * tile_size;
		canvas.height = (rows+1) * tile_size;

	ctx = canvas.getContext("2d");
	ctx.fillStyle = "#FFF";
	ctx.strokeRect(2, 2, canvas.width - 2, canvas.height - 2);  //columns * tile_size + 400, rows * tile_size + 400);

    var factors = new Array(1,2,3,5,7,11,13,2,3); 


	rowsArray = new Array(rows);
  var i; var j;
	for(i = 0; i < rows; i++){
	    rowsArray[i] = new Array(columns);
	    for(j = 0; j < columns; j++){
		rowsArray[i][j] = Math.floor(Math.random() * factors.length);
	}
	}


	for(i = 0; i < rows; i++){
		for(j = 0; j < columns; j++){
		    ctx.strokeRect( (j+0.5)*tile_size, (i+0.5)*tile_size, tile_size - 4, tile_size - 4 );
		}
	}
	
} // end of function load


function key_press_handler(ev_charCode){
    //  alert(['ev.charCode: ', ev_charCode]);
    if(ev_charCode == 32){	// space bar
		if(interval === undefined){
			play(10);
		}else{
			pause();
		}
	}
	else if(ev_charCode >= 49 && ev_charCode <= 57){ // 1-9
	//	if(interval !== undefined){pause()}
		for(i = 0; i < ev_charCode-48; i++){
			step();
		}
		//		}else{
		//			pause();
		//		}
}
}




function uv(){ // implement changed values of tile_size, width, height?
	var rule_string = document.getElementById("rstr").value;
	rule_array = rule_string.split("");
	var i;	
for(i in rule_array){
	rule_array[i] = parseInt(rule_array[i]);
}
	dc = true; // if true doesn't rest canvas on resize.
	setTimeout(changable, 60000);
	load(true);
}
	

function set_tile_size(){
    var new_tile_size = document.getElementById("tilesize").value;
    tile_size = parseInt(new_tile_size);
    //   alert([new_tile_size, tile_size]);
    load(true);
}

function cycle_rule_string(){
    //  var rule_string = document.getElementById("rstr").value;
    // 	rule_array = rule_string.split("");
	var x = rule_array.shift();
	rule_array.push(x);

	var rule_string = rule_array.join('');
	document.getElementById("rstr").value = rule_string;
	dc = true; // if true doesn't rest canvas on resize.
	setTimeout(changable, 60000); // call changeable after 60000 milliseconds
	load(true);
}

function changable(){
	dc = false;
}
function amult(ar, t){
	var out = [];
	var i;
	for(i = 0; i < t; i++){
		out = out.concat(ar);
	}
	return out;
}

