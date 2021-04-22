// Population health options: Normal, Infected, Recovered, Protected
var population = [];
//Time to recover (seconds * 50)
var recoveryConstant = 400;

//var vaccinated = document.getElementById("txtVaccinated");
var vaccinated = 0;

var stopRun = false;

//This is the canvas we're defining and drawing on
var cityArea = {
	canvas : document.getElementById("cityArea"),
  
	start : function() {
		stopRun = false;
		this.context = this.canvas.getContext("2d");
		this.clear();
		this.interval = setInterval(updateArea, 20);
	},
	clear : function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	stop : function() {
		clearInterval(this.interval);
		for (i = 0; i < 200; i++) population.pop();
		document.getElementById("btnStart").disabled = false;
	}
}

var popGraph = {
	canvas : document.getElementById("popGraph"),
	
	start : function() {
		document.getElementById("btnStart").disabled = true;
		this.context = this.canvas.getContext("2d");
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.x = 0;
		this.y = 0;
	},
	
	//This function draws a single column on the bar graph, then sets the y pointer to the next pixel to the right
	drawBar : function(healthy, infected, recovered, protect) {
		ctx = popGraph.context;
		var i = 0;
		
		//Draw the graph bar, from top to bottom: protected, healthy, recovered, infected
		while (protect > 0) {
			ctx.fillStyle = "purple";
			ctx.fillRect(this.y, i, 1, 1);
			protect -= 1;
			i += 1;
		}
		while (healthy > 0) {
			ctx.fillStyle = "grey";
			ctx.fillRect(this.y, i, 1, 1);
			healthy -= 1;
			i += 1;
		}
		while (recovered > 0) {
			ctx.fillStyle = "blue";
			ctx.fillRect(this.y, i, 1, 1);
			recovered -= 1;
			i += 1;
		}
		while (infected > 0) {
			ctx.fillStyle = "red";
			ctx.fillRect(this.y, i, 1, 1);
			infected -= 1;
			i += 1;
		}
		
		this.y += 1;
	}
}

//Defines a new person, their attributes, and their functions
function pawn(id, x, y, initialAngle) {
	//General characteristics
	this.id = id;
	this.width = 10;
	this.height = 10;
	this.color = "grey";
	
	//Movement attributes
	this.x = x;
	this.y = y;
	this.speed = 1;
	//Angle is in radians. Neat.
	this.angle = initialAngle;
	
	//Health attributes
	this.health = "Healthy";
	this.recoveryTime = 0;
	
	this.update = function() {
		ctx = cityArea.context;
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		
		//Infection status update
		if (this.recoveryTime > 0) {
			this.recoveryTime -= 1;
			if (this.recoveryTime == 0) {
				this.health = "Recovered";
			}
		}
		if (this.health == "Infected") this.color = "red";
		if (this.health == "Recovered") this.color = "blue";
		if (this.health == "Protected") this.color = "purple";
		if (this.health == "Healthy") this.color = "grey";
	},
	
	this.hitWall = function() {
		var collide = false;
		if (this.x <= 0 || this.x >= 790 || this.y <= 0 || this.y >= 390) collide = true;
		return collide;
	},
	
	this.collideWith = function(otherobj) {
		var myleft = this.x;
		var myright = this.x + 10;
		var mytop = this.y;
		var mybottom = this.y + 10;
		var otherleft = otherobj.x;
		var otherright = otherobj.x + 10;
		var othertop = otherobj.y;
		var otherbottom = otherobj.y + 10;
		var collide = true;
		if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
			collide = false;
		}
		return collide;
	},
	
	this.newPos = function() {
		this.x += this.speed * Math.sin(this.angle);
		this.y -= this.speed * Math.cos(this.angle);
	}
}

//Kick it all off
function startScript() {
	vaccinated = parseInt(document.getElementById("txtVaccinated").value);
	if (vaccinated >= 0 && vaccinated < 200) {
		cityArea.start();
		popGraph.start();
		initializePopulation();
	}
}

//Initialize the population
function initializePopulation() {
	//This array is a list of numbers from 0 to 199
	var popIndex = [];
	var refnum = 0;
	for (i = 0; i < 200; i++) {
		//This line checked to make sure the loop was iterating.
		//document.write(i);
		
		//Coordinates are set in place. Maybe one day I'll figure out how to make them random while preventing initial collisions.
		var xCoord = ((i * 32) + 11) % 800;
		var yCoord = ((i * 50) + 18) % 400;
		var angle = Math.PI * Math.random() * 2;
		
		population.push(new pawn(i, xCoord, yCoord, angle));
		popIndex.push(i);
	}
	//Randomizes the list. We'll pop numbers from this as indecies for infection/vaccination.
	popIndex = popIndex.sort(() => Math.random() - 0.5)
	
	//Infect someone
	refnum = popIndex.pop();
	population[refnum].health = "Infected";
	population[refnum].recoveryTime = recoveryConstant;
	
	//Now protect the vaccinated number of people
	for (i = 0; i < vaccinated; i++) {
		refnum = popIndex.pop();
		population[refnum].health = "Protected";
	}
}

function updateArea() {
	var healthy = 0;
	var infected = 0;
	var recovered = 0;
	var protect = 0;
	
	cityArea.clear();
	population.forEach(updatePerson);
	
	//Update status count
	for (i = 0; i < 200; i++) {
		if (population[i].health == "Infected") infected += 1;
		else if (population[i].health == "Recovered") recovered += 1;
		else if (population[i].health == "Protected") protect += 1;
		else if (population[i].health == "Healthy") healthy += 1;
	}
	
	//Write status to page
	document.getElementById("healthy").innerHTML = healthy;
	document.getElementById("infected").innerHTML = infected;
	document.getElementById("protect").innerHTML = protect;
	document.getElementById("recovered").innerHTML = recovered;
	document.getElementById("percent").innerHTML = ((healthy / (200 - protect)) * 100).toFixed(2);
	
	//Update graph bar
	popGraph.drawBar(healthy, infected, recovered, protect);
	
	//End the run if no more infected are left
	//stopRun is to let this run one more tick. Otherwise, the last infected person would still show as red when it stops.
	if (stopRun) {
		stopRun = false;
		cityArea.stop();
	}
	if (infected == 0) {
		stopRun = true;
	}
} 

function updatePerson(person) {
	person.newPos();
	
	//Check each person against contact with other people.
	//Step 1: infect, if necessary
	//Step 2: bounce off people (commented out for now)
	for (i = 0; i < 200; i++) {
		//Check if we have a new infection
		if (person.collideWith(population[i]) && person.id != i) {
			if (person.health == "Infected" && population[i].health == "Healthy") {
				//To infect, set their health to infected, then give them a time to recover
				population[i].health = "Infected";
				population[i].recoveryTime = recoveryConstant;
			}
			
			//Below is a lot of code intended to cause people to bounce off each other, but it keeps creating funky results.
			//For now, we'll allow pass-by and worry about fixing this later.
			/*
			var myleft = person.x;
			var myright = person.x + 10;
			var mytop = person.y;
			var mybottom = person.y + 10;
			var otherleft = population[i].x;
			var otherright = population[i].x + 10;
			var othertop = population[i].y;
			var otherbottom = population[i].y + 10;
			
			if (myright > otherleft) {
				person.angle = (Math.random() + 1) * Math.PI;
			} else if (myleft < otherright) {
				person.angle = (Math.random() + 0) * Math.PI;
			} else if (mybottom > othertop) {
				person.angle = (Math.random() + 1.5) * Math.PI;
			} else if (mytop < otherbottom) {
				person.angle = (Math.random() + 0.5) * Math.PI;
			}
			*/
		}
	}
	//Bounce off walls they come in contact with
	if (person.hitWall) {
		if (person.x <= 0 || person.x >= 790 ) person.angle = 2 * Math.PI - person.angle;
		if (person.y <= 0 || person.y >= 390 ) person.angle = Math.PI - person.angle;
	}
	
	//
	person.update();
}

//Random integer function
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}