//(function(){

var world_width = 400,
	world_height = 400,
	controlbox_width = 400,
	controlbox_height = 400,
	n_grid_x = 24,
	n_grid_y = 24;
	
var world = d3.selectAll("#cxpbox_hopfed-turingles_display").append("canvas")
	.attr("width",world_width)
	.attr("height",world_height)
	.attr("class","explorable_display")
	
var context = world.node().getContext("2d");
			context.translate(world_width/2, world_height/2);		
	
var controls = d3.selectAll("#cxpbox_hopfed-turingles_controls").append("svg")
	.attr("width",controlbox_width)
	.attr("height",controlbox_height)
	.attr("class","explorable_widgets")	
	
var g = widget.grid(controlbox_width,controlbox_height,n_grid_x,n_grid_y);



var anchors = g.lattice(); // g has a method that returns a lattice with x,y coordinates

/*controls.selectAll(".grid").data(anchors).enter().append("circle")
	.attr("class","grid")
	.attr("transform",function(d){return "translate("+d.x+","+d.y+")"})
	.attr("r",1)
	.style("fill","rgb(200,200,200)")
	.style("stroke","none")*/


// fixed parameters 


// this are the default values for the slider variables

var N = 70,
	dt=.5;
	
var pixel_width = world_width / N;
var pixel_height = world_height / N;	

var def_q =0,
	def_s = 0.06;

var D = 0.08;

var Fk = sq2fk(def_s,def_q);

var C_U = d3.interpolateRdGy;
var C_V = d3.interpolateRdGy;
	
var parsets = [
	{q:0.00020399999999999845,s:0.06,name:"Keith Haring"},
	{q:-0.002748000000000002,s:0.016207000000000003,name:"Lava Lamp"},
	{q:-0.004620000000000003,s:0.03629500000000001,name:"Cell Division"},
	{q:0.0010679999999999986,s:0.08205100000000003,name:"Alien Grafiti"},
	{q:-0.0037560000000000024,s:0.022903000000000003,name:"Dirk's Favorite"},
	{q:0.002003999999999999,s:0.013975000000000001,name:"Targets and Spirals"},
	{q:0.0017519999999999992,s:0.05666200000000001,name:"Bacteria"}
]	

var playblock = g.block({x0:5,y0:21,width:0,height:0});
var buttonblock = g.block({x0:3,y0:16.5,width:4,height:0}).Nx(2);
var sliderblock = g.block({x0:12,y0:6,width:10,height:5}).Ny(3);
var plotblock = g.block({x0:12,y0:12,width:10,height:8});
var radioblock = g.block({x0:2.5,y0:1.5,width:10,height:12});
var uv_radio = g.block({x0:12.5,y0:1.5,width:12,height:3});
var FK_label = g.block({x0:11,y0:22,width:7,height:0}).Nx(2);
var plotblock2 = g.block({x0:12,y0:2,width:10,height:1});
var toggleblock = g.block({x0:2,y0:1,width:0,height:0});

// here are the buttons

var playpause = { id:"b1", name:"", actions: ["play","pause"], value: 0};
var back = { id:"b2", name:"", actions: ["back"], value: 0};
var reset = { id:"b3", name:"", actions: ["rewind"], value: 0};

var playbutton = [
	widget.button(playpause).size(g.x(5)).symbolSize(0.6*g.x(5)).update(runpause)
]

var buttons = [
	widget.button(back).update(function(){init1();draw()}).size(g.x(3)).symbolSize(0.6*g.x(3)),
	widget.button(reset).update(resetparameters).size(g.x(3)).symbolSize(0.6*g.x(3))
]

var orli = {id:"t1", name: "Orli's switch",  value: false};

var toggles = [
	new widget.toggle(orli).update(switchcolor).label("right")
]


// now the sliders for the fish

/*function sq2fk(s,q){
	return {k:0.5*Math.sqrt(s)-s+q,F:s}
}*/

function sq2fk(s,q){
	let n = Math.sqrt(1+(0.25/Math.sqrt(s)-1)*(0.25/Math.sqrt(s)-1))
	return {F:s+q*(0.25/Math.sqrt(s)-1)/n,k:Math.sqrt(s)/2-s-q/n}
}

var s = {id:"s", name: "tangent", range: [0.007,0.1], value: def_s};
var q = {id:"q", name: "normal", range: [0.006,-0.006], value: def_q};

var sliderwidth = sliderblock.w();
var handleSize = 10, trackSize = 8, fs=14;

var slider = [
	widget.slider(s).width(sliderwidth).trackSize(trackSize).handleSize(handleSize).fontSize(fs).update(setpar),
	widget.slider(q).width(sliderwidth).trackSize(trackSize).handleSize(handleSize).fontSize(fs).update(setpar)
]	

var form=d3.format(".3f")
// radios

var c1 = {
	id:"parsets", 
	name:"parsets", 
	choices: parsets.map(function(d){return d.name}), 
	value:0
}

var radios = [ widget.radio(c1).size(radioblock.h()).update(selectpattern)]
var uv = {id:"uv", name:"uv", choices: ["Show U Concentration","Show V Concentration"], value:0}
var radio_uv = [widget.radio(uv).size(uv_radio.h()).shape("circ").update(draw)]

var pb = controls.selectAll(".button .playbutton").data(playbutton).enter().append(widget.buttonElement)
	.attr("transform",function(d,i){return "translate("+playblock.x(0)+","+playblock.y(0)+")"});	

var bu = controls.selectAll(".button .others").data(buttons).enter().append(widget.buttonElement)
	.attr("transform",function(d,i){return "translate("+buttonblock.x(i)+","+buttonblock.y(0)+")"});	

var sl = controls.selectAll(".slider").data(slider).enter().append(widget.sliderElement)
	.attr("transform",function(d,i){return "translate("+sliderblock.x(0)+","+sliderblock.y(i)+")"});

var rad = controls.selectAll(".radio .sys").data(radios).enter().append(widget.radioElement)
	.attr("transform",function(d,i){return "translate("+radioblock.x(0)+","+radioblock.y(0)+")"});	

var uvrad = controls.selectAll(".radio .uv").data(radio_uv).enter().append(widget.radioElement)
	.attr("transform",function(d,i){return "translate("+uv_radio.x(0)+","+uv_radio.y(0)+")"});	
	
var tg = controls.selectAll(".toggle").data(toggles).enter().append(widget.toggleElement)
	.attr("transform",function(d,i){return "translate("+toggleblock.x(0)+","+toggleblock.y(0)+")"});	
	
	
var plt = controls.append("g").attr("class","plot")
	.attr("transform","translate("+plotblock.x(0)+","+plotblock.y(0)+")")
	
var colors = controls.append("g").attr("class","plot")
	.attr("transform","translate("+plotblock2.x(0)+","+plotblock2.y(0)+")")	

var fklabel = controls.selectAll(".plot .label").data([Fk.F,Fk.k]).enter().append("text")
	.attr("transform",function(d,i){return "translate("+FK_label.x(i)+","+FK_label.y(0)+")"})
	.text(function(d,i){return i==0 ? "F="+form(d) : "k="+form(d)})
	.attr("class","plot label");	

var Frange = [0.00,0.1];	
var krange = [0.03,0.08];

var sc_x = d3.scaleLinear().domain(krange).range([0, plotblock.w()]);
var sc_y = d3.scaleLinear().domain(Frange).range([0,-plotblock.h()]);
var xAxis = d3.axisBottom(sc_x).ticks(4) ;
var yAxis = d3.axisLeft(sc_y).ticks(5);
var line = d3.line().x(function(d) { return sc_x(d.x); }).y(function(d) { return sc_y(d.y); });

plt.append("g").call(xAxis).attr("class","xaxis");
plt.append("g").call(yAxis).attr("class","yaxis");
plt.append("text").text("k").attr("transform","translate("+sc_x(krange[1])+10+","+30+")")
	.style("text-anchor","middle").style("font-size",14)	
plt.append("text").text("F").attr("transform","translate("+(-30)+","+(sc_y(Frange[1]) -10)+")")
	.style("text-anchor","middle").style("font-size",14)

var ka = d3.range(krange[0],krange[1],(krange[1]-krange[0])/100);
var Fa = d3.range(Frange[0],Frange[1],(Frange[1]-Frange[0])/100);

var sn1 = ka.map(function(x){return {x:x,y:(1-8*x+Math.sqrt(1-16*x))/8}}).filter(function(d){
	return d.x>krange[0] && d.x<krange[1] && d.y>Frange[0] && d.y<Frange[1]
})
var sn2 = ka.map(function(x){return {x:x,y:(1-8*x-Math.sqrt(1-16*x))/8}}).filter(function(d){
	return d.x>krange[0] && d.x<krange[1] && d.y>Frange[0] && d.y<Frange[1]
})
var hopf = ka.map(function(x){return {x:x,y:(Math.sqrt(x)-2*x-Math.sqrt(x*(1-4*Math.sqrt(x))))/2}}).filter(function(d){
	return d.x>krange[0] && d.x<krange[1] && d.y>Frange[0] && d.y<Frange[1]
})
var critical = Fa.map(function(x){return {x:(Math.sqrt(x)-2*x)/2,y:x}}).filter(function(d){
	return d.x>krange[0] && d.x<krange[1] && d.y>Frange[0] && d.y<Frange[1]
})



plt.append("path").datum(hopf).attr("d",line)
		.style("stroke","black").style("stroke-width","1px")
		.style("fill","none")
		.style("stroke-dasharray",4)

plt.append("path").datum(critical).attr("d",line)
		.style("stroke","black").style("stroke-width","1px")
		.style("fill","none")



plt.append("path").datum(critical).attr("d",line)
		.style("stroke","darkred").style("stroke-width","30px")
		.style("fill","none")
		.style("opacity",0.2)
		.style("stroke-linecap","round")

plt.append("circle")
	.attr("class","parpoint")
	.attr("cx",sc_x(Fk.k))
	.attr("cy",sc_y(Fk.F))
	.attr("r",6)
	.style("fill","darkred")
	.style("opacity",0.7)

var bars = colors.selectAll(".bars")
    .data(d3.range(plotblock2.w()), function(d) { return d; })
  .enter().append("rect")
    .attr("class", "bars")
    .attr("x", function(d, i) { return i; })
    .attr("y", 0)
    .attr("height", 10)
    .attr("width", 1)
    .style("fill", function(d, i ) { return C_U(d/plotblock2.w()); })

var lh = colors.selectAll(".plot").data(["low","high"]).enter().append("text")
	.text(function(d){return d})
	.attr("transform",function(d,i){
		console.log(i)
		return "translate("+(i*plotblock2.w())+",25)"
	})
	.attr("class","plot")
	.style("font-size",12)
	.style("text-anchor","middle")
	

function switchcolor(a){
	if(a.value==1){
		C_U = d3.interpolateRainbow;
		C_V = d3.interpolateRainbow;		
	} else {
		C_U = d3.interpolateRdGy;
		C_V = d3.interpolateRdGy;
	}
	colors.selectAll(".bars")
    .style("fill", function(d, i ) { return C_U(d/plotblock2.w()); })
	update()
	draw()
}

function setpar(){
	Fk=sq2fk(s.value,q.value);
	plt.select(".parpoint")
	.attr("cx",sc_x(Fk.k))
	.attr("cy",sc_y(Fk.F))
	fklabel.data([Fk.F,Fk.k])
	.text(function(d,i){return i==0 ? "F="+form(d) : "k="+form(d)})
	
	
}

function selectpattern(d){

	let p = parsets[d.value()]
	slider[0].click(p.s);
	slider[1].click(p.q);
	setpar()
	init1()
	draw()
}

var X = d3.scaleLinear().domain([-N,N]).range([-world_width/2,world_width/2]);
var Y = d3.scaleLinear().domain([-N,N]).range([-world_width/2,world_width/2]);
var color = d3.scaleLinear().domain([0,1]).range([0,1]);

var cell = d3.line().x(function(d) { return X(d.x); }).y(function(d) { return Y(d.y);; });

var G = lattice.square4(N).scale(1).boundary("periodic");
var nodes = G.nodes;

nodes.forEach(function(d){ d.u=0; d.v=0; })

init1()



// timer variable for the simulation

var t,tick=0; 
var updates_per_frame = 10;

// functions for the action buttons

function runpause(d){ d.value == 1 ? t = d3.timer(
	function() {
	            for(let step=0; step<updates_per_frame; step++)
	            {
	                update();
	            }
	            draw();
	            }
	,1) : t.stop(); }



function resetparameters(){
	let q = parsets[c1.value].q
	let s = parsets[c1.value].s
	slider[0].click(s);
	slider[1].click(q);
}


/// THIS IS THE INITIAL SETUP



function init1(){
	nodes.forEach(function(d){
		d.u=1;
		d.v=0;
	})
	
	let M = 40;
	let wmin=5;
	let wmax=20;

	let rects = d3.range(M).map(function(d){
		let x0 = wmax+Math.floor(Math.random()*(2*N+1-2*wmax)+0.5);
		let y0 = wmax+Math.floor(Math.random()*(2*N+1-2*wmax)+0.5);
		return {
			x0:x0,
			y0:y0,
			x1:x0+wmin+Math.floor((wmax-wmin)*Math.random()+0.5),		
			y1:y0+wmin+Math.floor((wmax-wmin)*Math.random()+0.5)
		}
	})
	
	rects.forEach(function(R){
		let u = Math.random();
		let v = Math.random();
		nodes.filter(function(z){
			return (z.m > R.x0 && z.m < R.x1 && z.n > R.y0 && z.n < R.y1)
		}).forEach(function(x){x.u = u; x.v=v})
		
	})
	
update()
draw()
update()
draw()
update()
draw()
}



/// HERE'S THE LOCAL DYNAMICS OF GRAY-SCOTT


function f(x){
		var z = x[0]*x[1]*x[1];
		return [ - z + Fk.F * (1-x[0]), z - (Fk.F+Fk.k)*x[1] ]		
}


// THIS IS THE ITERATION THAT TAKES TIME


function update(){
	nodes.forEach(function(d){
		let dx = f([d.u,d.v])
		d.du = dt*dx[0] + 
			2 * D * dt * ( -d.neighbors.length*d.u + d3.sum(d.neighbors,function(x){return x.u}));
		d.dv = dt*dx[1] + 
			D * dt * ( -d.neighbors.length*d.v + d3.sum(d.neighbors,function(x){return x.v})); 			
	})	
	nodes.forEach(function(d){
		d.u += d.du; d.v += d.dv;
	})
}

function draw(){
	uv.value ? draw_V() : draw_U();
}

function draw_U(){
	
	nodes.forEach(function(d){
		context.fillStyle=C_U(d.u);
		context.fillRect(X(d.x), Y(d.y), pixel_width/2, pixel_width/2);
	})
		
}

function draw_V(){
	
	nodes.forEach(function(d){
		context.fillStyle=C_V(d.v);
		context.fillRect(X(d.x), Y(d.y), pixel_width/2, pixel_width/2);
	})
	
}


//})()