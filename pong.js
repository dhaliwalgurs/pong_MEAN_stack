// create the CANVAS element for the DOM
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

window.onload = function() {
    timeout(main);
    document.body.appendChild(canvas);
};

// add an action listener to the DOM
var keysDown = {};

window.addEventListener("keydown", function(event){
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function(event){
    delete keysDown[event.keyCode];
    player.paddle.x_speed = 0;
});

// the main methods and related methods
var player = new Player();
var computer = new Computer();
var ball = new Ball(canvas.width/2, canvas.height/2);

var main = function(){
    timeout(main);
    update();
    render();
};

var timeout = function(callback){
    window.setTimeout(callback,1000/60);
};

var update = function () {
    player.move();
    computer.move();
    ball.move();
};

var render = function (){
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    player.render();
    computer.render();
    ball.render();
};

// constructor methods for the paddle and ball objects
function Paddle(x, y){
    this.width = 50;
    this.height = 10;
    this.x = x;
    this.y = y;
    this.baseSpeed = 4;
    this.x_speed = 0;
    this.y_speed = 0;
}
function Player(){
    this.paddle = new Paddle(canvas.width/2 - 25, canvas.height - 10);
}
function Computer(){
    this.baseSpeed = 4;
    this.paddle = new Paddle(canvas.width/2 - 25, 0);
}
function Ball(x, y){
    this.radius = 5;
    this.x = x;
    this.y = y;
    this.x_speed = 0;
    this.y_speed = 3;
}

// render() methods for the paddle and ball objects
Paddle.prototype.render = function(){
    context.fillStyle = "#ffffff";
    context.fillRect(this.x, this.y, this.width, this.height);
};
Player.prototype.render = function(){
    this.paddle.render();
};
Computer.prototype.render = function(){
    this.paddle.render();
};
Ball.prototype.render = function(){
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    context.fill();
};

// move() methods for the paddle and ball objects
Player.prototype.move = function(){
    for (var key in keysDown){
        var value = Number(key);
        if (value == 37){//left
            this.paddle.x_speed = -1 * this.paddle.baseSpeed;
        }else if(value == 39){//right
            this.paddle.x_speed = this.paddle.baseSpeed;
        }else {// no key
            this.paddle.x_speed = 0;
        }
        this.paddle.checkBoundsMove(this.paddle.x_speed, 0);
    }
};
Computer.prototype.move = function(){
    if (Math.abs(this.paddle.x + this.paddle.width/2 - ball.predictBall) < 2){// anti-skipping for paddle
        this.paddle.x_speed = 0;
    } else if (this.paddle.x + this.paddle.width/2 - ball.predictBall > 0){// left
        this.paddle.x_speed = -1 * this.paddle.baseSpeed;
    } else if (this.paddle.x + this.paddle.width/2 - ball.predictBall < 0){// right
        this.paddle.x_speed = this.paddle.baseSpeed;
    } else {// don't move
        this.paddle.x_speed = 0;
    }
    this.paddle.checkBoundsMove(this.paddle.x_speed, 0);
};
Paddle.prototype.checkBoundsMove = function(x, y){
    this.x += x;
    this.y += y;

    if (this.x < 0){
        this.x = 0;
        this.x_speed = 0;
    }
    if (this.x + this.width > 400){
        this.x = 400 - this.width;
        this.x_speed = 0;
    }
};
Ball.prototype.move = function(){
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top = this.y - 5;
    var bottom = this.y + 5;
    var left = this.x - 5;
    var right = this.x + 5;

    // wall collision
    if (this.x - 5 < 0){
        this.x = 5;
        this.x_speed *= -1;
    }
    if (this.x + 5 > 400){
        this.x = 395;
        this.x_speed *= -1;
    }
    if (this.y < 0 || this.y > 600){// scoring wall collision
        ball = new Ball (canvas.width/2,canvas.height/2)
    }
    // paddle collision
    if(    bottom > player.paddle.y
        && left < player.paddle.x + player.paddle.width
        && right > player.paddle.x ){// player paddle
        this.y += -1 * player.paddle.baseSpeed;
        this.x_speed += player.paddle.x_speed/2;
        this.y_speed = -1 * player.paddle.baseSpeed;
        this.updatePrediction();
    }
    if(    top < computer.paddle.y + computer.paddle.height
        && left < computer.paddle.x + computer.paddle.width
        && right > computer.paddle.x ){// computer paddle
        this.y += computer.paddle.baseSpeed;
        this.x_speed += computer.paddle.x_speed/2;
        this.y_speed = computer.paddle.baseSpeed;
    }
};

Ball.prototype.updatePrediction = function (){// return where the ball will go out, given some ball state
    var simulatedX = ball.x;
    var simulatedY = ball.y;
    var simulated_x_speed = ball.x_speed;
    var simulated_y_speed = ball.y_speed;

    // tick n by one
    var n = 0;
    while (simulatedY >= computer.paddle.height) {
        simulatedX = simulatedX + n * simulated_x_speed;
        simulatedY = simulatedY + n * simulated_y_speed;
        n++;
        if (simulatedX - 5 < 0) { // left wall is hit
            simulatedX = 5;
            simulated_x_speed *= -1;
        }
        if (simulatedX + 5 > 400) { // right wall is hit
            simulatedX = 395;
            simulated_x_speed *= -1;
        }
        if (simulatedY < computer.paddle.height) {// computer wall is hit
            this.predictBall = simulatedX;    // this is where the ball will go out
            break;
        }
    }
};
