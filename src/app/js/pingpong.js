const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

const { exec, fork, execSync } = require('child_process');
const path = require('path');

var child = fork(__dirname + "\\js\\spawn_process.js");

const VEL_MYO = 0.10;
const VEL_BALL = 2;

let gameState = 'start';
let paddle_1 = document.querySelector('.paddle_1');
let paddle_2 = document.querySelector('.paddle_2');
let board = document.querySelector('.board');
let initial_ball = document.querySelector('.ball');
let ball = document.querySelector('.ball');
let score_1 = document.querySelector('.player_1_score');
let score_2 = document.querySelector('.player_2_score');
let message = document.querySelector('.message');
let paddle_1_coord = paddle_1.getBoundingClientRect();
let paddle_2_coord = paddle_2.getBoundingClientRect();
let initial_ball_coord = ball.getBoundingClientRect();
let ball_coord = initial_ball_coord;
let board_coord = board.getBoundingClientRect();
let paddle_common = document.querySelector('.paddle').getBoundingClientRect();

let dx = Math.floor(Math.random() * 4) + 3;
let dy = Math.floor(Math.random() * 4) + 3;
let dxd = Math.floor(Math.random() * 2);
let dyd = Math.floor(Math.random() * 2);

let com;
let lastValue = 0;

document.addEventListener('keydown', (e) => {
	if (e.key == 'Enter') {
		document.querySelector('.control').classList.add('d-none')
		gameState = gameState == 'start' ? 'play' : 'start';

		if (gameState == 'play') {
			startMyo()

			document.querySelector('#goal-notification').style.animation = '';
			message.innerHTML = '';
			message.style.left = 42 + 'vw';
			
			requestAnimationFrame(() => {
					dx = Math.floor(Math.random() * VEL_BALL) + 3;
					dy = Math.floor(Math.random() * VEL_BALL) + 3;
					dxd = Math.floor(Math.random() * VEL_BALL);
					dyd = Math.floor(Math.random() * VEL_BALL);
					moveBall(dx, dy, 2, dyd);
			});
		}
	}

	if (gameState == 'play') {

		if (e.key == 'ArrowUp') {
		paddle_2.style.top =
			Math.max(
			board_coord.top,
			paddle_2_coord.top - window.innerHeight * 0.1
			) + 'px';
		paddle_2_coord = paddle_2.getBoundingClientRect();
		}
		if (e.key == 'ArrowDown') {
		paddle_2.style.top =
			Math.min(
			board_coord.bottom - paddle_common.height,
			paddle_2_coord.top + window.innerHeight * 0.1
			) + 'px';
		paddle_2_coord = paddle_2.getBoundingClientRect();
		}
	}
});

async function moveBall(dx, dy, dxd, dyd) {
	console.log(dx,dy,dxd,dyd);
	if (ball_coord.top <= board_coord.top) {
		dyd = 1;
	}
	if (ball_coord.bottom >= board_coord.bottom) {
		dyd = 0;
	}
	if (
		ball_coord.left <= paddle_1_coord.right &&
		ball_coord.top >= paddle_1_coord.top &&
		ball_coord.bottom <= paddle_1_coord.bottom
	) {
		dxd = 1;
		dx = Math.floor(Math.random() * VEL_BALL) + 3;
		dy = Math.floor(Math.random() * VEL_BALL) + 3;
	}
	if (
		ball_coord.right >= paddle_2_coord.left &&
		ball_coord.top >= paddle_2_coord.top &&
		ball_coord.bottom <= paddle_2_coord.bottom
	) {
		dxd = 0;
		dx = Math.floor(Math.random() * VEL_BALL) + 3;
		dy = Math.floor(Math.random() * VEL_BALL) + 3;
	}
	if ( ball_coord.left <= board_coord.left || ball_coord.right >= board_coord.right) {
		if (ball_coord.left <= board_coord.left) {
			score_2.innerHTML = +score_2.innerHTML + 1;
		} else {
			score_1.innerHTML = +score_1.innerHTML + 1;
		}


		// Stop action
		child.send({
			'action': 'stop',
			'id': currentDevice.innerText,
			'com': com,
		})

		document.querySelector('.left-wall').style.animation = 'left-animation-enter 0.5s linear forwards'
		document.querySelector('.right-wall').style.animation = 'right-animation-enter 0.5s linear forwards'
		document.querySelector('#goal-notification').style.animation = 'pop-enter 1.7s linear';
		await sleep(1700)

		document.querySelector('.left-wall').style.animation = 'left-animation-leave 0.5s linear forwards'
		document.querySelector('.right-wall').style.animation = 'right-animation-leave 0.5s linear forwards'
		await sleep(501)

		gameState = 'start';


		ball_coord = initial_ball_coord;
		ball.style = initial_ball.style;
		message.innerHTML = 'Presionar Enter';
		document.querySelector('.control').classList.remove('d-none')
		message.style.left = 38 + 'vw';

		if(score_1.innerHTML >= 2){
			alert('Jugador 1 ganó')
			score_1.innerHTML = 0;
			score_2.innerHTML = 0;
		}else if(score_2.innerHTML >= 2){
			alert('Jugador 2 ganó')
			score_1.innerHTML = 0;
			score_2.innerHTML = 0;
		}

		return;
	}

    ball.style.top = ball_coord.top + dy * (dyd == 0 ? -1 : 1) + 'px';
    ball.style.left = ball_coord.left + dx * (dxd == 0 ? -1 : 1) + 'px';
    ball_coord = ball.getBoundingClientRect();

    requestAnimationFrame(() => {
        moveBall(dx, dy, dxd, dyd);
    });
}

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

closeBtn.addEventListener('click', () =>{
    ipc.send('closeGame');
})

ipc.on('enviar-dispositivos', (e, args) => {
	var myModal = new bootstrap.Modal(document.getElementById("editableDevice"), {});
	myModal.show();

	cards_zone.innerHTML = ''
	com = args.com;
	args.devices.forEach((value, key) => {
		cards_zone.innerHTML += `
			<div class="col-3 px-2" id="${key}">
				<div class="card-device px-1 index-${value._index} clickable">
					<div class="icon d-flex align-items-center justify-content-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" viewBox="0 0 400 400">
							<path fill="currentColor" d="M284.24,166.81a32.9,32.9,0,1,1-32.9,32.89,32.92,32.92,0,0,1,32.9-32.89m0-10a42.9,42.9,0,1,0,42.89,42.89,42.9,42.9,0,0,0-42.89-42.89Z"/>
							<path fill="currentColor" d="M142,31a59.24,59.24,0,0,1,59.18,59.17V228.49a59.18,59.18,0,1,1-118.35,0V90.13A59.23,59.23,0,0,1,142,31m0-10A69.17,69.17,0,0,0,72.87,90.13V228.49a69.18,69.18,0,1,0,138.35,0V90.13A69.17,69.17,0,0,0,142,21Z"/>
							<line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="10px" x1="142.04" y1="124.77" x2="142.04" y2="193.85"/>
							<path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="10px" d="M142,297.67V308a71.1,71.1,0,0,0,142.2,0V242.6"/>
						</svg>
					</div>
					<div class="footer d-flex align-items-center justify-content-center">
						${key}
					</div>
				</div>
			</div>
		` 
	});

	updateClickable();
})

function updateClickable(){
	var _elements = document.querySelectorAll('.clickable')


	_elements.forEach( element => {
		element.addEventListener('click', function(){
			if(document.querySelector('.selected'))
				document.querySelector('.selected').classList.remove('selected')

			this.classList.add('selected')
			currentDevice.innerText = this.parentNode.getAttribute('id')
			
			child.send({
				'action': 'init',
				'id': currentDevice.innerText,
				'com': com
			})

			cards_zone.classList.add('d-none')
			document.querySelector('.loader').classList.remove('d-none')

			child.on('message', (msg) => {
				switch(msg.action){
					case 'stop': stopMyo();
						break;
					case 'movement': //console.log('Valor actual: ', lastValue, ' Valor que llega: ', msg.last);
									if(msg.last > 1000){ //Sube
										paddle_1.style.top =
											Math.max(
												board_coord.top,
												paddle_1_coord.top - window.innerHeight * VEL_MYO
											) + 'px';
										paddle_1_coord = paddle_1.getBoundingClientRect();
									}else{ //Baja
										paddle_1.style.top =
											Math.min(
												board_coord.bottom - paddle_common.height,
												paddle_1_coord.top + window.innerHeight * VEL_MYO
											) + 'px';
										paddle_1_coord = paddle_1.getBoundingClientRect();
									}
									lastValue = msg.last;
							break;
					case 'continue': cards_zone.classList.remove('d-none') 
									 bootstrap.Modal.getInstance(document.getElementById("editableDevice")).hide();
									 document.querySelector('.control').classList.remove('d-none');
						break;
					case 'failed': 	gameState = 'start';
									cards_zone.classList.remove('d-none') 
									document.querySelector('.loader').classList.add('d-none');
									alert('Error al conectar dispositivo')
						break;
				}
			})
		})
	})
}

function startMyo(){
	// Play action
	child.send({
		'action': 'play',
		'id': currentDevice.innerText,
		'com': com,
		'_pid': child.pid
	})
}

function stopMyo(){
	child.send({ 
		'action': 'stop',
		'id': currentDevice.innerText,
		'com': com
	})
}

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
