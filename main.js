const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const score_el= document.getElementById("score-text")

const fontFamily = "Pixelify Sans"

const Key = {
	UP: 38,
	DOWN: 40,
	LEFT: 37,
	RIGHT: 39,
	SPACEBAR: 32
}

const State = {
	playing: 1,
	paused: 2,
	game_over: 3
}

const DeathType = {
	wall: 1,
	tail: 2
}

var snake
var apple
var type_death
var user_score = 0
var game_state = State.paused

const snake_segment_size = 20
const apple_size = 20

function generateRandomApplePosition() {
	return {
		x: Math.floor(Math.random() * (canvas.width / apple_size)) * apple_size,
		y: Math.floor(Math.random() * (canvas.height / apple_size)) * apple_size,
	}
}

class InputHandler {
	constructor() {
		this.pressedKeys = {}

		window.addEventListener('keydown', this.handleKeyDown.bind(this))
		window.addEventListener('keyup', this.handleKeyUp.bind(this))
		InputHandler.instance = this
	}

	static get() {
		if (!InputHandler.instance) {
			InputHandler.instance = new InputHandler()
		}
		return InputHandler.instance
	}

	isKeyPressed(keyCode) {
		return this.pressedKeys[keyCode]
	}

	handleKeyDown(event) {
		this.pressedKeys[event.keyCode] = true
	}

	handleKeyUp(event) {
		this.pressedKeys[event.keyCode] = false
	}
}

class Snake {
	constructor(ctx) {
		this.ctx = ctx;
		this.size = snake_segment_size
		this.direction = "right"
		this.speed = 1;
		this.intervalId = null
		this.moveInterval = 75
		this.updateRate = 3
		this.updateRateCounter = 0
		this.inputHandler = new InputHandler()
		this.body = [
			{ x: canvas.width / 2, y: canvas.height / 2 }
		]
	}

	update(apple) {
		let currDirection = this.direction

		this.checkAppleCollision(apple)
		if (this.checkSelfCollision()) {
			this.stopMoving();
			type_death = DeathType.tail;
			game_state = State.game_over;
		}
		this.checkWallCollision()

		this.updateRateCounter = (this.updateRateCounter + 1) % this.updateRate
		if (this.updateRateCounter === 0) {
			this.changeDirection()
			if (currDirection != this.direction) {
				this.stopMoving()
				this.startMoving()
			}
		}
	}

	move() {
		for (let i = 0; i < this.speed; i++) {
			var head = { x: this.body[0].x, y: this.body[0].y }
			if (this.direction == "up") {
				head.y -= snake_segment_size
			}
			if (this.direction == "down") {
				head.y += snake_segment_size
			}
			if (this.direction == "left") {
				head.x -= snake_segment_size
			}
			if (this.direction == "right") {
				head.x += snake_segment_size
			}

			this.body.pop() // Remove a última parte do corpo para manter o tamanho
			this.body.unshift(head) // Adiciona uma nova cabeça à frente
		}
	}

	changeDirection() {
		if (this.inputHandler.isKeyPressed(Key.UP) && this.direction !== "down")
			this.direction = "up"
		if (this.inputHandler.isKeyPressed(Key.DOWN) && this.direction !== "up")
			this.direction = "down"
		if (this.inputHandler.isKeyPressed(Key.LEFT) && this.direction !== "right")
			this.direction = "left"
		if (this.inputHandler.isKeyPressed(Key.RIGHT) && this.direction !== "left")
			this.direction = "right"
	}

	startMoving() {
		if (!this.intervalId) {
			this.intervalId = setInterval(() => {
				this.move();
			}, this.moveInterval);
		}
	}

	stopMoving() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	render() {

		this.body.forEach(segment => {
			this.ctx.beginPath();
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = "#5E7CE2";
			this.ctx.strokeRect(segment.x, segment.y, this.size, this.size);

			this.ctx.fillStyle = "#A4F9C8"
			this.ctx.fillRect(segment.x, segment.y, this.size, this.size)
			this.ctx.stroke()
		})
	}

	checkAppleCollision(apple) {
		const head = this.body[0]
		if (
			this.body[0].x === apple.position.x &&
			this.body[0].y === apple.position.y
		) {

			const tail = this.body[this.body.length - 1]
			this.body.push(tail)

			apple.position = generateRandomApplePosition()
			user_score++
			score_el.innerHTML = user_score
		}
	}

	checkWallCollision() {
		const head = this.body[0]
		if (
			head.x < 0 ||
			head.x + snake_segment_size > canvas.width ||
			head.y < 0 ||
			head.y + snake_segment_size > canvas.height
		) {
			this.stopMoving()
			type_death = DeathType.wall
			game_state = State.game_over
		}
	}

	checkSelfCollision() {
		const head = this.body[0];

		for (let i = 3; i < this.body.length; i++) {
			const segment = this.body[i];
			if (head.x === segment.x && head.y === segment.y) {
				return true
			}
		}
		return false;
	}
}

class Apple {
	constructor(ctx) {
		this.ctx = ctx
		this.size = apple_size
		this.position = generateRandomApplePosition()
	}

	update() { }

	render() {
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = "#220901";
		this.ctx.strokeRect(this.position.x, this.position.y, this.size, this.size);
		this.ctx.fillStyle = "#941B0C"
		this.ctx.fillRect(this.position.x, this.position.y, this.size, this.size)
		this.ctx.stroke()
	}
}

function gameOverMessage() {
	ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "white"
	ctx.font = `35px ${fontFamily}`
	ctx.textAlign = "center"
	ctx.fillText("Morreu Otário(a)", canvas.width / 2, canvas.height / 2 - 55)

	ctx.font = `30px ${fontFamily}`
	if (type_death == DeathType.wall) {
		ctx.fillText("Ta cego(a)? Não ta vendo a parede ?", canvas.width / 2, canvas.height / 2 - 20)
	}

	if (type_death == DeathType.tail) {
		ctx.fillText("A fome é tanta que queria comer o próprio rabo ?", canvas.width / 2, canvas.height / 2 - 20)
	}


	ctx.fillText(`Pontuação: ${user_score}`, canvas.width / 2, canvas.height / 2 + 35);


	ctx.fillText('Espaço para tentar de novo', canvas.width / 2, canvas.height / 2 + 75);
}

function pausedMessage() {
	ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "white"
	ctx.font = `35px ${fontFamily}`
	ctx.textAlign = "center"

	ctx.font = `25px ${fontFamily}`
	ctx.fillText("CIMA, BAIXO, ESQUERDA ou DIREITA para Controlar", canvas.width / 2, canvas.height / 2 - 50)
	ctx.fillText("", canvas.width / 2, canvas.height / 2 - 10)

	ctx.font = `35px ${fontFamily}`
	ctx.fillText("Pressione ESPAÇO para iniciar", canvas.width / 2, canvas.height / 2 + 50)
}

function start() {
	type_death = null
	user_score = 0

	score_el.innerHTML = user_score

	snake = new Snake(ctx)
	apple = new Apple(ctx)

	snake.startMoving()

	loop()
}

function drawBackground() {
	for (let row = 0; row < canvas.width / snake_segment_size; row++) {
		for (let col = 0; col < canvas.height / snake_segment_size; col++) {
			if ((row + col) % 2 === 0) {
				ctx.fillStyle = '#007200';
			} else {
				ctx.fillStyle = '#008000';
			}
			ctx.fillRect(col * snake_segment_size, row * snake_segment_size, snake_segment_size, snake_segment_size);
		}
	}
}

function update() {
	if (game_state == State.playing) {
		snake.update(apple)
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	drawBackground()
	

	if (game_state === State.playing) {
		snake.render()
		apple.render()
	} else if (game_state == State.game_over) {
		gameOverMessage()
	} else if (game_state == State.paused) {
		pausedMessage()
	}
}

function loop() {
	if (InputHandler.get().isKeyPressed(Key.SPACEBAR) && (game_state == State.paused || game_state == State.game_over)) {
		game_state = State.playing
		start()
	}

	update()
	render()

	requestAnimationFrame(loop)
}

start()