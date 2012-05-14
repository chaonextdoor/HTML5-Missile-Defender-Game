$(function() {
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");
	
	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();
	
	// Game settings
	var playGame;
	var missiles; // Array that holds all the missiles
	var bullets; // Array that holds all the bullets
	var hitted;  //Array that holds hitted missiles
	var target;
	var shootAngle;
	var numBulletsLeft;
	var numMissilesLeft;
	var numClick;
	var numMissiles;
	var numHit;
	var missileSpeed;
	var bulletSpeed;
	
	// Game UI
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $(".gameReset");
	var uiScore = $(".gameScore");
	var uiBulletsLeft = $(".bulletsLeft");
	var uiMissilesLeft = $(".missilesLeft");
	
	// Sound
	var soundLaunch = $("#gameSoundLaunch").get(0);
	var soundHit = $("#gameSoundHit").get(0);
	
	// Missiles class
	var Missile = function(x, y, dX, v) {
		this.x = x;
		this.y = y;
		this.dX = dX;		//the x coordiante of destination that the missile is supposed to hit, y = canvasHeight
		this.width = 24;
		this.height = 24;
		this.halfWidth = this.height/2;
		this.halfHeight = this.height/2;
		if (!this.ratio || !this.sourceX || !this.sourceY || !this.angle) {
			this.sourceX = this.x;		// the coordinate X of the missile's starting point
			this.sourceY = this.y;		// the coordinate Y of the missile's starting point
			this.ratio = Math.abs(dX-this.sourceX)/(canvasHeight-this.sourceY);		
			this.angle = Math.atan(this.ratio);		//the flying angle of missile
		}	
		if (this.sourceX < dX) {
			this.vX = v*Math.sin(this.angle);
			this.vY = v*Math.cos(this.angle);
		}
		else if (this.sourceX > dX) {
			this.vX = -v*Math.sin(this.angle);
			this.vY = v*Math.cos(this.angle);
		} 
		else {
            this.vX = 0;
            this.vY = v;
		}
		this.flameLength = 20;
	};
	
	//Bullet class
	var Bullet = function(x, y, v) {
        this.radius = 6;		// the radius should be equal to half of the width property in Player class
        this.dX = x;		// x coordinate of bullet destination
        this.dY = y; 		// y coordinate of bullet destination
        this.x = canvasWidth/2+72*Math.cos(shootAngle);		// x coordinate of bullet starting point
        this.y = canvasHeight-72*Math.sin(shootAngle);		// y coordinate of bullet starting point
        if (canvasWidth/2-this.x === 0) {
        	this.vX = 0;
        	this.vY = -v;
        	this.angle = Math.PI/2;
        }
        else {
				this.vX = v*Math.cos(shootAngle);
				this.vY = -v*Math.sin(shootAngle);
        }
	};

	//Target class
	var Target = function(x, y) {
		this.x = x;
		this.y = y;
		this.innerRadius = 3;
		this.outerRadius = 10;
	} ;

	// Reset and start the game
	function startGame() {
		// Reset game stats
		uiScore.html("0");
		uiStats.show();
		
		// Set up initial game settings
		playGame = true;
		firstClick = true;
		missiles = new Array();
		bullets = new Array();
		hitted = new Array();
		numMissiles = +($("#num").val()) || 15;
		numBulletsLeft = Math.ceil(1.4*numMissiles);
		missileSpeed = 2;
		bulletSpeed = 10;

		uiMissilesLeft.html(numMissiles);
		uiBulletsLeft.html(numBulletsLeft);

		score = 0;
		numClick = 0;
		numHit = 0;
		
		target = new Target(-canvasWidth,-canvasHeight);
	
		// Set up missiles out of view
		for (var i = 0; i < numMissiles; i++) {
			var dX = Math.floor(Math.random()*canvasWidth);
			var x = Math.floor(Math.random()*canvasWidth);
			if (i >= 1) {
				var y = -Math.floor(((i+1)/2)*Math.random()*canvasHeight);  //
			}
			else {
				var y = -Math.floor(Math.random()*canvasHeight/4);  //
			}			
			missiles.push(new Missile(x, y, dX, missileSpeed));
		};
		
		// Set up mouseover event listener
		$(window).on('mousemove', function(e) {
			var canvasOffset = canvas.offset();
			var canvasX = Math.floor(e.pageX-canvasOffset.left);
			var canvasY = Math.floor(e.pageY-canvasOffset.top);
			target.x = canvasX;
			target.y = canvasY;
		});

		// Set up mouse click event listener
		$(window).on('click', function(e) {
			numClick++;
			if (numClick > 1) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
				if (canvasX === canvasWidth/2) {
					shootAngle = Math.PI/2;
				}
				else {
        			shootAngle = Math.atan((canvasHeight - canvasY)/(canvasX-canvasWidth/2));
        			if (shootAngle < 0) {
						shootAngle = shootAngle+Math.PI;
					}		
				}
				bullets.push(new Bullet(canvasX, canvasY, bulletSpeed));
				soundLaunch.currentTime = 0;
				soundLaunch.play();
				if (--numBulletsLeft >= 0) {
					uiBulletsLeft.html(numBulletsLeft);
				}
				else {
					playGame = false;
					uiStats.hide();
					uiComplete.show();
					$(window).unbind("click");
					$(window).unbind("mousemove");
				}				
			}	
		});
		

		// Start the animation loop
		animate();
	};
	
	// Inititialise the game environment
	function init() {
		uiStats.hide();
		uiComplete.hide();
		
		uiPlay.click(function(e) {
			uiIntro.hide();
			startGame();
		});
		
		uiReset.click(function(e) {
			e.preventDefault();
			uiComplete.hide();
			
			// Stop sound
			soundLaunch.pause();
			soundHit.pause();

			$(window).unbind('mousemove');
			$(window).unbind('click');
			
			startGame();
		});
	};
	
	
	// Animation loop that does all the fun stuff
	function animate() {
		// Clear
		context.clearRect(0, 0, canvasWidth, canvasHeight);	

		//Draw Cannon, base first barrel second
		context.fillStyle = "black";
		context.beginPath();
		context.arc(canvasWidth/2, canvasHeight, 30, 0, Math.PI, true);
		context.closePath();
		context.fill();
		context.save();
		context.strokeStyle = "black";
		context.lineWidth = 12; //barrel width
		context.beginPath();
		context.moveTo(canvasWidth/2, canvasHeight);
		context.lineTo(canvasWidth/2+72*Math.cos(shootAngle), canvasHeight-72*Math.sin(shootAngle)); //72 is the barrel length
		context.closePath();
		context.stroke();
		context.restore();

		//Draw target ring
		context.fillStyle = "red";
		context.beginPath();
		context.arc(target.x, target.y, target.innerRadius, 0, 2*Math.PI, true);
		context.closePath();
		context.fill();
		context.strokeStyle = "white";
		context.beginPath();
		context.arc(target.x, target.y, target.outerRadius, 0, 2*Math.PI, true);
		context.closePath();
		context.stroke();

		//Loop through every bullets
		if (bullets.length >= 1) {
			for (var j = 0; j < bullets.length; j++) {
				var tmpBullet = bullets[j];

				// Calculate new position
				tmpBullet.x += tmpBullet.vX;
				tmpBullet.y += tmpBullet.vY;
				// Draw bullet
				if (tmpBullet.y > tmpBullet.dY) {
					context.fillStyle = "red";
					context.beginPath();
					context.arc(tmpBullet.x, tmpBullet.y, tmpBullet.radius, 0, 2*Math.PI, true);
					context.closePath();
					context.fill();
				}
				else {
					if (tmpBullet.radius === 15) {
						context.clearRect(tmpBullet.dX, tmpBullet.dY, tmpBullet.radius, tmpBullet.radius);
					}
					else {
						context.fillStyle = "white";
						context.beginPath();
						context.arc(tmpBullet.dX, tmpBullet.dY, ++tmpBullet.radius, 0, 2*Math.PI, true);
						context.closePath();
						context.fill();
						for (k = 0; k < missiles.length; k++) {
							var disX = tmpBullet.dX - missiles[k].x;
							var disY = tmpBullet.dY - missiles[k].y;
							var distance = Math.sqrt((disX*disX)+(disY*disY));
							if (distance < missiles[k].halfHeight+tmpBullet.radius) {
								soundHit.currentTime = 0;
								soundHit.play();
								hitted.push(missiles[k]);
								uiScore.html(hitted.length);
								context.clearRect(missiles[k].x+missiles[k].halfWidth, missiles[k].y-missiles[k].halfHeight-missiles[k].flameLength, missiles[k].width, missiles[k].height);
								missiles.splice(k, 1);
							}					
						}
					}
				}
			}
		}
		
		// Loop through every missile
		numMissilesLeft = 0;
		for (var i = 0; i < missiles.length; i++) {
			var tmpMissile = missiles[i];
			
			// Calculate new position
			tmpMissile.x += tmpMissile.vX;
			tmpMissile.y += tmpMissile.vY;

			// Missile to ground collision detection			
			if (tmpMissile.y >= canvasHeight) {
				// Stop thrust sound
				//soundHit.pause();
				//soundLaunch.pause();
			
				// Game over				
				playGame = false;

				uiStats.hide();
				uiComplete.show();
		
				// Reset event handlers
				$(window).unbind("click");
				$(window).unbind("mousemove");
			};

			// Calculate the number of remaining missiles
			if (tmpMissile.y < 0) {
				numMissilesLeft++;
			}

			// Draw missile, flame first body second
			// Draw flame
			context.save();
			context.translate(tmpMissile.x, tmpMissile.y);		

			if (tmpMissile.flameLength == 20) {
				tmpMissile.flameLength = 15;
			} else {
				tmpMissile.flameLength = 20;
			};	

			context.fillStyle = "orange";
			context.beginPath();
			context.moveTo(0, -12-tmpMissile.flameLength);
			context.lineTo(5, 0);
			context.lineTo(-5, 0);
			context.closePath();
			context.fill();
			context.restore();

			// Draw body
			context.fillStyle = "rgb(255, 0, 0)";
			context.beginPath();
			context.moveTo(tmpMissile.x, tmpMissile.y+tmpMissile.halfWidth);
			context.lineTo(tmpMissile.x+tmpMissile.halfWidth, tmpMissile.y-tmpMissile.halfHeight);
			context.lineTo(tmpMissile.x-tmpMissile.halfWidth, tmpMissile.y-tmpMissile.halfHeight);
			context.closePath();
			context.fill();
		};
		// Update the number of remaining missiles in UI
		uiMissilesLeft.html(numMissilesLeft);

		// If there is no missiles left, game over
		if (numMissilesLeft ===0 && missiles.length ===0) {
			playGame = false;
			uiStats.hide();
			uiComplete.show();
			$(window).unbind("click");
			$(window).unbind("mousemove");
		}
		if (playGame) {
			// Run the animation loop again in 33 milliseconds
			setTimeout(animate, 33);
		}; 
	};
	
	init();
});
