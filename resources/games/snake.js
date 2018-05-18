var snake = new Snake();
var apple = new Apple();

var NORTH = 0,
    SOUTH = 1,
    WEST = 2,
    EAST = 3;

//this is so we use the oldest input of the user to change the snake's direction in draw
//otherwise, there was a discrepancy between the input and snake's update and the snake could hit itself erroneously
var moveQueue = [];

var SCREEN_SIZE = 600;
var CELL_SIZE = 25;

var START = 0,
    PLAY = 1,
    END = 2;
var gameScreen = START;

function setup() {
    var canvas = createCanvas(SCREEN_SIZE, SCREEN_SIZE);
    canvas.parent("game");
    document.getElementById("game").style = "width: " + width +
        "px; height: " + height + "px";
    textFont(loadFont("/../style/arcade_font.ttf"));
    frameRate(15);
}

function draw() {
    background(0);
    switch (gameScreen) { //switch based on the game screen
        case START: //draw start screen
            rectMode(CORNER);
            stroke("#FFFFFF");
            fill("#a1deff");
            rect(SCREEN_SIZE / 2 + 50, SCREEN_SIZE / 2 - 75, CELL_SIZE, CELL_SIZE);
            fill("#FF0000");
            rect(SCREEN_SIZE / 2 + 50, SCREEN_SIZE / 2 - 50, CELL_SIZE, CELL_SIZE);

            noStroke();
            fill(255);
            textSize(15);
            textAlign(LEFT);
            text("SNAKE:", SCREEN_SIZE / 2 - 50, SCREEN_SIZE / 2 - 50);
            text("APPLE:", SCREEN_SIZE / 2 - 50, SCREEN_SIZE / 2 - 25)
            textAlign(CENTER);
            text("move with WASD or the arrow keys\neat the apple\n don't hit yourself or the walls\nPress SPACE to begin", SCREEN_SIZE / 2, SCREEN_SIZE / 2 + 50);
            break;
        case PLAY:
            stroke("#FFFFFF");
            apple.display(); //draw apple
            if (moveQueue.length > 0) { //if there's a move
                snake.direction = moveQueue[0]; //use the oldest move
                moveQueue.splice(0, 1); //get that corn outta here
            }
            snake.update(apple); //updating the snake given the apple (this handles walls, touching self, and eating apples)
            snake.display(); //draw snake
            noStroke();
            textAlign(LEFT);
            fill(255);
            textSize(50);
            text(snake.length, 25, 75);
            break;
        case END: //draw end screen
            noStroke();
            textAlign(CENTER);
            textSize(30);
            text("your score is " + snake.length, SCREEN_SIZE / 2, SCREEN_SIZE / 2 - 50);
            textSize(15);
            text("press ENTER to submit your score\nor press BACKSPACE to discard it", SCREEN_SIZE / 2, SCREEN_SIZE / 2 + 50);
            break;
        default:
            break;
    }
}

//does everything needed to start the game
function startGame() {
    gameScreen = PLAY;
    snake.respawn();
    apple.respawn(snake);
}

function keyPressed() {
    if (gameScreen === START && key === " ") {
        startGame();
    } else if (gameScreen === PLAY) {
        //we're checking if the snake is either one cell long or the user's not trying to go directly backwards before we add the input to the moveQueue
        if ((key === "W" || keyCode === UP_ARROW) &&
            (snake.length === 1 || (moveQueue[moveQueue.length - 1] !== SOUTH && snake.direction !== SOUTH))) {
            moveQueue.push(NORTH);
        } else if ((key === "S" || keyCode === DOWN_ARROW) &&
            (snake.length === 1 || (moveQueue[moveQueue.length - 1] !== NORTH && snake.direction !== NORTH))) {
            moveQueue.push(SOUTH);
        } else if ((key === "A" || keyCode === LEFT_ARROW) &&
            (snake.length === 1 || (moveQueue[moveQueue.length - 1] !== EAST && snake.direction !== EAST))) {
            moveQueue.push(WEST);
        } else if ((key === "D" || keyCode === RIGHT_ARROW) &&
            (snake.length === 1 || (moveQueue[moveQueue.length - 1] !== WEST && snake.direction !== WEST))) {
            moveQueue.push(EAST);
        }
    } else if (gameScreen === END) {
        if (keyCode === ENTER) {
            postScore({
                game: "snake",
                score: snake.length
            });
        } else if (keyCode === BACKSPACE) {
            gameScreen = START;
        }
    }
}

//helper functions are helpful
function getRandomLocation() {
    return CELL_SIZE * (parseInt(Math.random() * 19));
}

function Snake() { //object for the snake
    this.respawn = function () {
        this.length = 1;
        this.xs = [getRandomLocation()];
        this.ys = [getRandomLocation()];
        this.direction = null;
        this.amountToGrow = 0;
    }
    this.display = function () { //loop through every cell and draw it
        fill("#a1deff");
        for (var i = 0; i < this.length; i++) {
            rect(this.xs[i], this.ys[i], CELL_SIZE, CELL_SIZE);
        }
    }
    this.isTouchingApple = function (apple) {
        return (this.xs[0] === apple.x) && (this.ys[0] === apple.y); //if the apple and the 0'th cell are in the same location
    }
    this.isTouchingSelf = function () {
        if (this.length <= 2) { //can't be touching yourself if you're two cells or less
            return false;
        }
        for (var i = 1; i < this.length; i++) { //if any cell is in the same location as the 0'th
            if ((this.xs[0] === this.xs[i]) && (this.ys[0] === this.ys[i])) {
                return true;
            }
        }
        return false;
    }
    this.isTouchingWall = function () {
        return (this.xs[0] >= SCREEN_SIZE || this.xs[0] < 0 || this.ys[0] >= SCREEN_SIZE || this.ys[0] < 0); //if the 0'th cell is past any of the bounds of the screen
    }
    this.update = function (apple) {

        //we have to keep track of some locations before we move the snake

        //keep track of the location of the first cell, used to make the snake move
        var tempXs = [this.xs[0], null];
        var tempYs = [this.ys[0], null];

        //the spot of the last cell, incase we need to grow
        var oldLastX = this.xs[this.xs.length - 1];
        var oldLastY = this.ys[this.ys.length - 1];

        //move the first cell based on the direction
        switch (this.direction) {
            case NORTH:
                this.ys[0] -= CELL_SIZE;
                break;
            case SOUTH:
                this.ys[0] += CELL_SIZE;
                break;
            case WEST:
                this.xs[0] -= CELL_SIZE;
                break;
            case EAST:
                this.xs[0] += CELL_SIZE;
                break;
            default:
                break;
        }

        //go along the rest of the cells, and set them all to the old location of the one infront of them
        //(this was why we kept track of the 0th cell before we moved it)
        for (var i = 1; i < this.length; i++) {
            tempXs[1] = this.xs[i];
            tempYs[1] = this.ys[i];
            this.xs[i] = tempXs[0];
            this.ys[i] = tempYs[0];
            tempXs[0] = tempXs[1];
            tempYs[0] = tempYs[1];
        }

        //if we have to grow, add a cell to the old location of the last cell
        if (this.amountToGrow > 0) {
            this.xs.push(oldLastX);
            this.ys.push(oldLastY);
            this.length++;
            this.amountToGrow--;
        }

        //finish the game if we're touching a wall or ourselves
        if (this.isTouchingWall() || this.isTouchingSelf()) {
            gameScreen = END;
        }
        //if we're touching the apple, we have to grow on the next call of this function
        if (this.isTouchingApple(apple)) {
            this.amountToGrow++;
            apple.respawn(this); //also, respawn the apple given the current state of the snake
        }
    }
}

function Apple() { //object for the apple
    this.respawn = function (snake) {
        do {
            this.x = getRandomLocation();
            this.y = getRandomLocation();
        } while ((snake.xs.includes(this.x) && snake.ys.includes(this.y)));
        //run the loop while the location of the apple overlaps with the snake's - we can't have that
    }
    this.display = function () {
        fill("#FF0000");
        rect(this.x, this.y, CELL_SIZE, CELL_SIZE);
    }
}