//Declaración de variables
let video; //para guardar imagen de la cámara
let faceLandmarker; //sistema q detecta puntos de la cara
let faceLandmarks = []; //array con puntos de referencia de la cara
let startButton; //en esta variable se guarda el botón para comenzar

//variables para saber el estado de la cámara
let cameraStarted = false;
let cameraLoading = false;
let cameraReady = false;

//variables relacionadas con la apertura de la boca y el despertar del monstruo
let mouthOpen = false;
let mouthOpening = 0;
let wakeAmount = 0;

let particles = []; //array  con las partículas que se creen
let lastVideoTime = -1; //para evitar que se analice el mismo fotograma

//Sonidos del monstruo, cogidos de internet
let snoringSound;
let magicSound;
let soundsReady = false;
let wasAwake = false;

//posición de la boca del monstruo
let mouthCanvasX = 130;
let mouthCanvasY = 170;

function setup() { // se crea el lienzo principal con el siguiente tamaño y se determina la fuente principal
  createCanvas(640, 480);
  textFont("Trebuchet MS");

  // botón para empezar el proceso
  startButton = createButton("🎃 ENTRAR A LA CUEVA");
  startButton.position(20, 20);
  startButton.mousePressed(startCamera);

  //para cargar sonidos 
  snoringSound = new Audio("sounds/snoring.mp3");
  snoringSound.loop = true;
  snoringSound.volume = 0.35;

  magicSound = new Audio("sounds/magic.mp3");
  magicSound.volume = 0.6;

  //Ronquidos después de tocar la pantalla
  window.addEventListener("pointerdown", startSnoring);
  window.addEventListener("keydown", startSnoring);

  //Para comprobar que los archivos existen, problema en consola
  Promise.all([
    fetch("sounds/snoring.mp3"),
    fetch("sounds/magic.mp3")
  ])
    .then(function (respuestas) {
      if (respuestas.every(function (respuesta) {
        return respuesta.ok;
      })) {
        console.log("Los dos archivos de sonido existen.");
      } else {
        console.error("No se ha encontrado algún archivo de sonido.");
      }
    })
    .catch(function (error) {
      console.error("Error comprobando los sonidos:", error);
    });

  //comprobar que los sonidos se pueden cargar
  Promise.all([
    new Promise(function (resolve, reject) {
      snoringSound.addEventListener("canplaythrough", resolve, {
        once: true
      });
      snoringSound.addEventListener("error", reject, {
        once: true
      });
      snoringSound.load();
    }),

    new Promise(function (resolve, reject) {
      magicSound.addEventListener("canplaythrough", resolve, {
        once: true
      });
      magicSound.addEventListener("error", reject, {
        once: true
      });
      magicSound.load();
    })
  ])
    .then(function () {
      soundsReady = true;
      console.log("¡Los dos sonidos están listos!");
      startSnoring();
    })
    .catch(function (error) {
      console.error("Error al cargar los sonidos:", error);
    });
}

//Ronquidos del monstruo al despertar
function startSnoring() {
  if (!soundsReady || !snoringSound || wasAwake) return; //no hacer nada si el archivo no funciona 

  if (snoringSound.paused) {
    snoringSound.play().catch(function (error) {
      console.log(
        "El navegador espera una interacción para reproducir el sonido:",
        error
      );
    });
  }
}

async function startCamera() { //Si el proceso ya se ha iniciado, esto evita repetirlo.
  if (cameraStarted) return;

  cameraStarted = true; //la cámara se inicia
  cameraLoading = true; 
  startButton.hide();  //para ocultar el botón durante la experiencia

  // preparamos el audio después de pulsar el botón
  if (snoringSound) {
    snoringSound.play()
      .then(function () {
        snoringSound.pause();
        snoringSound.currentTime = 0;
      })
      .catch(function (error) {
        console.warn("El audio todavía no se ha activado:", error);
      });
  }

  if (magicSound) { //sonido de magia
    magicSound.play()
      .then(function () {
        magicSound.pause();
        magicSound.currentTime = 0;
      })
      .catch(function (error) {
        console.warn("No se ha podido preparar el audio mágico:", error);
      });
  }

  try { // Try para intentar iniciar la cámara y MediaPipe. Si ocurre un error, intentarcontrolarlo con catch.
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    //Preparación del MediaPipe para la cámara
    faceLandmarker = await window.mediaPipeReady;

    cameraReady = true;
    cameraLoading = false;

    //El monstruo empieza durmiendo y roncando
    if (soundsReady && !wasAwake) {
      snoringSound.currentTime = 0;

      snoringSound.play().catch(function (error) {
        console.error("Error al reproducir los ronquidos:", error);
      });
    }
  } catch (error) {
    console.error("Error al iniciar la cámara o MediaPipe:", error);

    cameraStarted = false;
    cameraLoading = false;
    cameraReady = false;

    if (video) {
      video.remove();
      video = null;
    }

    startButton.show();
  }
}

function draw() {
  //Pantalla de inicio o loading antes de acceder al "Laboratorio"
  if (!cameraStarted) {
    drawWelcomeScreen();
    return;
  }

  background(35, 20, 55);
  drawBackground();

  //Código para mostrar la cámara en vivo
  if (video) {
    push();
    translate(240, 90);
    scale(-1, 1);
    image(video, 0, 0, 220, 165);
    pop();

    noFill();  //marco para la cámara
    stroke(255, 160, 70); 
    strokeWeight(3);
    rect(20, 90, 220, 165, 12);
  }

  // Detectar la cara en cada fotograma
  if (
    cameraReady &&
    video &&
    video.elt.readyState >= 2 &&
    video.elt.currentTime !== lastVideoTime
  ) {
    const resultado = faceLandmarker.detectForVideo(
      video.elt,
      performance.now()
    );

    faceLandmarks = resultado.faceLandmarks || [];
    lastVideoTime = video.elt.currentTime;
  }

  // para medir cuánto abre la persona la boca
  mouthOpen = false;
  mouthOpening = 0;

  if (faceLandmarks.length > 0) {
    const puntos = faceLandmarks[0];
    const labioSuperior = puntos[13];
    const labioInferior = puntos[14];

    mouthOpening = dist(
      labioSuperior.x * 640,
      labioSuperior.y * 480,
      labioInferior.x * 640,
      labioInferior.y * 480
    );

    mouthOpen = mouthOpening > 12;

    const centroX =
      (labioSuperior.x + labioInferior.x) / 2;

    const centroY =
      (labioSuperior.y + labioInferior.y) / 2;

    mouthCanvasX = 240 - centroX * 220;
    mouthCanvasY = 90 + centroY * 165;
  }

  //El monstruo despierta al detectar que abres la boca. Si la boca está abierta, aumentamos poco a poco el despertar
  if (mouthOpen) {
    wakeAmount = min(wakeAmount + 0.025, 1);
  } else {
    wakeAmount = max(wakeAmount - 0.012, 0); //Si la boca se cierra, el monstruo vuelve a dormirse progresivamente
  }

  //Que salga la magia al despertar
  if (wakeAmount >= 0.35 && !wasAwake) {
    wasAwake = true;

    if (soundsReady) {
      snoringSound.pause();
      snoringSound.currentTime = 0;

      magicSound.pause();
      magicSound.currentTime = 0;

      magicSound.play().catch(function (error) {
        console.error("Error al reproducir la magia:", error);
      });
    }
  }

  //Ronquidos si se duerme
  if (wakeAmount < 0.2 && wasAwake) {
    wasAwake = false;

    if (soundsReady && cameraReady) {
      snoringSound.currentTime = 0;

      snoringSound.play().catch(function (error) {
        console.error("Error al reanudar los ronquidos:", error);
      });
    }
  }

  // Que aparezcan partículas mágicas al abrir la boca
  if (mouthOpen && random() < 0.5) {
    particles.push(
      new Particle(
        mouthCanvasX + random(-10, 10),
        mouthCanvasY + random(-8, 8)
      )
    );
  }

  //Actualizamos y dibujamos las partículas
  for (let i = particles.length - 1; i >= 0; i--) {  //Recorremos las partículas desde la última hasta la primera.
    particles[i].update();
    particles[i].display();

    if (particles[i].finished()) { //Comprobar si la partícula ha terminado su animación.
      particles.splice(i, 1);
    }
  }

  //Dibujar el monstruo
  drawMonster(
    width * 0.68,
    height * 0.49,
    wakeAmount
  );

  //Solo el título Creepster
  noStroke();
  fill(255, 160, 70);
  textAlign(CENTER, CENTER);
  textFont("Creepster");
  textSize(25);
  text("SPOOKY SMILE LAB", width / 2, 35);
  textFont("Trebuchet MS");

  //Mensajes según el estado
  fill(255);
  textSize(14);

  if (cameraLoading) {
    fill(220, 190, 255);
    textSize(16);
    text("✨ CARGANDO LA MAGIA...", width / 2, 335);

    noFill();
    stroke(190, 140, 255);
    strokeWeight(4);

    arc(
      width / 2,
      255,
      24,
      24,
      frameCount * 0.12,
      frameCount * 0.12 + PI * 1.4
    );
  } else if (!cameraReady) {
    text("Preparando el laboratorio...", width / 2, 335);
  } else if (faceLandmarks.length === 0) { //Si no se detecta ninguna cara, se pide al usuario que se coloque delante de la cámara.
    text(
      "Coloca tu cara delante de la cámara 👻",
      width / 2,
      335
    );
  } else if (wakeAmount > 0.7) {
    fill(130, 255, 190);
    textSize(18);
    text(
      "¡EL MONSTRUO ESTÁ DESPIERTO!",
      width / 2,
      335
    );
  } else if (mouthOpen) {
    fill(220, 190, 255);
    textSize(16);
    text(
      "¡LA MAGIA LO ESTÁ DESPERTANDO!",
      width / 2,
      335
    );
  } else {
    text(
      "Abre la boca para despertar al monstruo",
      width / 2,
      335
    );
  }

  //Barra que indica cuánto se ha despertado
  noStroke();
  fill(65, 45, 85);
  rect(width / 2 - 100, 365, 200, 12, 6);
  fill(190, 140, 255);
  rect(
    width / 2 - 100,
    365,
    200 * wakeAmount,
    12,
    6
  );

  fill(210, 195, 225);
  textSize(12);
  text("NIVEL DE DESPERTAR", width / 2, 390);
}

//Dibujar la pantalla de bienvenida
function drawWelcomeScreen() {
  background(35, 20, 55);
  drawBackground();

  //Título principal con fuente Creepster
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255, 160, 70);
  textFont("Creepster");
  textSize(30);
  text("SPOOKY SMILE LAB", width / 2, 65);
  textFont("Trebuchet MS");

  //Subtítulo
  fill(225, 210, 245);
  textSize(16);
  text(
    "El laboratorio de las sonrisas mágicas",
    width / 2,
    105
  );

  //Para que aparezca el monstruo dormido
  drawMonster(width / 2, 245, 0);

  //Estrellas que se mueven
  for (let i = 0; i < 8; i++) {
    let x = 90 + i * 65;
    let y = 175 + sin(frameCount * 0.04 + i) * 10;

    fill(255, 195, 100, 180);
    circle(
      x,
      y,
      4 + sin(frameCount * 0.08 + i) * 2
    );
  }

  // Instrucciones para empezar
  fill(255);
  textSize(16);
  text(
    "¡Despierta al monstruo con tu sonrisa!",
    width / 2,
    385
  );

  fill(190, 170, 220);
  textSize(13);
  text(
    "Pulsa el botón para comenzar la experiencia",
    width / 2,
    415
  );
}

function drawBackground() { //Elementos del fondo
  noStroke();

  //Estrellas de fondo del juego
  fill(255, 190, 100);
  circle(290, 110, 5);
  circle(590, 130, 4);
  circle(320, 220, 4);
  circle(570, 250, 6);

  // LUNA
  fill(255, 205, 125);
  circle(570, 75, 38);
}

// Clase para crear las partículas mágicas
class Particle {
  constructor(x, y) {
    this.position = createVector(x, y);

    this.velocity = createVector(
      random(-0.8, 0.8),
      random(-1.5, 0.3)
    );

    this.size = random(3, 7);
    this.life = 255;
    this.colorChoice = floor(random(3));
  }

  update() {
    this.position.add(this.velocity);
    this.life -= 4;
    this.size *= 0.995;
  }

  display() {
    noStroke();

    if (this.colorChoice === 0) {
      fill(190, 140, 255, this.life);
    } else if (this.colorChoice === 1) {
      fill(235, 200, 255, this.life);
    } else {
      fill(255, 195, 90, this.life);
    }

    circle(
      this.position.x,
      this.position.y,
      this.size
    );
  }

  finished() {
    return this.life <= 0;
  }
}

function drawMonster(x, y, despertar) { 
  push();
  translate(x, y);

  let movimiento = sin(frameCount * 0.06) * 3;
  translate(0, movimiento - despertar * 4);

  //sombra del monstruo
  noStroke();
  fill(15, 8, 30, 100);
  ellipse(0, 94, 145, 20);

  // patas
  fill(130, 85, 200);
  stroke(65, 35, 110);
  strokeWeight(2);
  ellipse(-32, 70, 28, 30);
  ellipse(32, 70, 28, 30);

  // oreja izquierda
  noStroke();
  push();
  translate(-52, -25);
  rotate(-PI / 10);
  fill(150, 105, 220);
  triangle(-10, 15, -25, -35, 15, -10);
  fill(235, 145, 190);
  triangle(-8, 5, -18, -25, 8, -8);
  pop();

  // oreja derecha
  push();
  translate(52, -25);
  rotate(PI / 10);
  fill(150, 105, 220);
  triangle(-15, -10, 25, -35, 10, 15);
  fill(235, 145, 190);
  triangle(-8, -8, 18, -25, 8, 5);
  pop();

  // cuernos verdes
  fill(130, 255, 190);
  triangle(-48, -53, -43, -88, -24, -57);
  triangle(24, -57, 43, -88, 48, -53);

  // cuerpo del monstruo
  fill(150, 105, 220);
  stroke(210, 180, 255);
  strokeWeight(3);
  ellipse(0, 0, 132, 145);

  // brazos
  fill(150, 105, 220);
  stroke(100, 65, 165);
  strokeWeight(2);
  ellipse(-67, 25, 24, 34);
  ellipse(67, 25, 24, 34);

  // barriga
  noStroke();
  fill(190, 155, 240);
  ellipse(0, 40, 76, 55);

  // dibujamos los ojos según si está despierto
  if (despertar < 0.2) { //  // Si el nivel de despertar es inferior a 0.2, el monstruo todavía tiene los ojos cerrados.
    noFill();
    stroke(45, 18, 45);
    strokeWeight(3);
    arc(-26, -17, 29, 10, 0, PI);
    arc(26, -17, 29, 10, 0, PI);
  } else {
    let alturaOjo = 4 + despertar * 20; 
    //Se calcula la altura de los ojos según el nivel de despertar. Contra más despierto, más abiertos estarán.

    noStroke();
    fill(255);
    ellipse(-26, -20, 31, alturaOjo);
    ellipse(26, -20, 31, alturaOjo);

    fill(35, 20, 55);
    circle(-24, -20, 11);
    circle(28, -20, 11);

    fill(255);
    circle(-27, -23, 4);
    circle(25, -23, 4);
  }

  //mejillas
  noStroke();
  fill(255, 140, 145, 190);
  ellipse(-44, 10, 21, 12);
  ellipse(44, 10, 21, 12);

  // Boca y colmillos
  if (despertar > 0.35) {
    fill(45, 18, 45);

    arc(  // Su altura aumenta según el nivel de despertar.
      0,
      17,
      40,
      15 + despertar * 20,
      0,
      PI,
      CHORD
    );

    fill(255, 250, 225);
    triangle(-14, 17, -7, 17, -11, 26);
    triangle(7, 17, 14, 17, 11, 26);

    fill(255, 130, 160);
    ellipse(0, 27, 12, 5);
  } else {
    noFill();
    stroke(45, 18, 45);
    strokeWeight(3);
    arc(0, 10, 24, 10, 0, PI);
  }

  //Para mostrar las z mientras duerme
  if (despertar < 0.25) {
    noStroke();
    fill(210, 195, 255);
    textAlign(CENTER, CENTER);
    textSize(18);

    text(
      "Z",
      48,
      -77 + sin(frameCount * 0.04) * 4
    );

    textSize(13);

    text(
      "z",
      62,
      -93 + sin(frameCount * 0.04 + 1) * 4
    );
  }

  pop();  //Recuperar los ajustes gráficos anteriores al dibujo del monstruo.
}