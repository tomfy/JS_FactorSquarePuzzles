// various java script functions

function createArray(size, val) { // create array of size size, and with each element initialized to val.
    var arr = new Array(size);
    if (arguments.length == 2) {
        for (i = 0; i < size; ++i) {
            arr[i] = val;
        }
    } // else not initialized
    return arr;
}

function update_array(array, val){ // add a value (unshift), and discard oldest value (pop).
    array.unshift(val);
    array.pop();
}

function shuffle(array){ // randomize order of elements in array
    var length = array.length;
    var i,j;
    for(i=0; i<length; i++){
	for(j=0; j<length; j++){
	    var tmp = array[j];
	    var k =  Math.floor( Math.random() * length );
	    if(k != j){
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
    console.log("in shuffle, output array: " + array);
}

function randomize_array_order(array){
    var rarray = array.slice(0);
    for(var i=0; i<rarray.length; i++){
        rarray[i] = undefined;
    }
    for(var i = 0; i< array.length; i++){
        var el = array[i];
        var k = Math.floor(Math.random() * (array.length-i) );
        var undef_count = 0;
        for(var j=0; j< array.length; j++){
            if(rarray[j] == undefined){
                if(undef_count == k){
                    rarray[k] = el;
                    break; 
                }
                undef_count++;
            }
        }
    }
    return rarray;
}  


/* function randomize_array_order_new(array){
 //   var array = array.slice(0);
    for(var i=0; i<array.length; i++){
	array[i] = undefined;
    }
    for(var i = 0; i< array.length; i++){
	var el = array[i];
	var k = Math.floor(Math.random() * (array.length-i) );
	var undef_count = 0;
	for(var j=0; j< array.length; j++){
	    if(array[j] == undefined){
		if(undef_count == k){
		    array[k] = el;
		    break; 
		}
		undef_count++;
	    }
	}
    }
    return array;
} */  



function in_order_array(n){
 var indices = [];
    for(var i=0; i<n; i++){
	indices.push(i);
    }
    console.log("xxx: " + indices);
    return indices;
}

function slightly_out_of_order_array(indices){ // return an array with indices 0 - n-1
// but 'slightly' disordered by nearest neighbor swapping
    var maxjump = 1;
    var n = indices.length;
  //  for(var i=0; i<n; i++){
//	indices.push(i);
//    }
 //   console.log("length: " + indices.length + "\n");
    for(var i = 0; i<2; i++){
	for(var j = 0; j<n; j++){
//	    j = Number(j);
	while(1){
	    var k = j + Math.floor(Math.random()*(2*maxjump+1)) - maxjump; 
	    if(k >= 0 && k < indices.length){ 
		break; 
	    }
	}
	if(j != k){	 // swap    
	    var tmp = indices[k];
	    indices[k] = indices[j];
	    indices[j] = tmp;
	} 
    }
    }
 //   console.log("indices: " + JSON.stringify(indices) + "\n");
    return indices;
}