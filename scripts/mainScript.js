const shapesArray = [];
let shapeIndex = 0;
let selectedIndex = 0;
let borderThickness = 5;
const startingCursorPosition = new PositionCoordinates();
let releaseBorderButton = false;
let mode = "draw";
let formOfShape = "square";
const colorArray = [
	"#FF0000",
	"#00FF00",
	"#8844FF",
	"#FFFF00",
	"#00BBFF",
	"#FF00FF",
];
let colorIndex = 0;

const draggableArea = document.querySelector(".drawing-area");

const documentListenerState = new ElementListenerState(document);
const draggableAreaListenerState = new ElementListenerState(draggableArea);

// Takes array of shape objects and makes a sorted copy to apply sorted z-index
const sortShapesBySize = (arr) => {
	let arrayToSort = [...arr];
	arrayToSort.sort((shapeA, shapeB) => {
		return (
			stringToSize(shapeB.element.style.width) +
			stringToSize(shapeB.element.style.height) -
			(stringToSize(shapeA.element.style.width) +
				stringToSize(shapeA.element.style.height))
		);
	});
	arrayToSort.forEach((shape, index) => {
		shape.element.style.zIndex = index + 1;
	});
};

const createNewShape = (clientX, clientY) => {
	// Create new DOM element and ElementState object for said array
	const newShapeListenerState = new ElementListenerState(
		document.createElement("div")
	);
	shapesArray.push(newShapeListenerState);
	const newShapeEl = newShapeListenerState.element;
	// Add necessary classes and styles to new DOM element and print it on the page
	newShapeEl.className = `shape shape--${formOfShape}`;
	newShapeEl.style.border = `${sizeToString(borderThickness, "px")} solid ${
		colorArray[colorIndex]
	}`;
	newShapeEl.style.zIndex = shapesArray.length + 1;
	draggableArea.appendChild(newShapeEl);
	selectedIndex = shapeIndex;
	// Set initial values for position of shape
	startingCursorPosition.setX(clientX);
	startingCursorPosition.setY(clientY);
	newShapeEl.style.top = sizeToString(
		startingCursorPosition.getY() - 80,
		"px"
	);
	newShapeEl.style.left = sizeToString(startingCursorPosition.getX(), "px");
};

// DRAW MODE HANDLERS
// onClick for draggable area, creates new div and appends to draggable area. This function is unique to Draw mode.
const clickNewShape = (e) => {
	// Redirect to touch handler if event type was touch
	if (e.touches) {
		touchNewShape(e);
		return;
	}
	// create new shape and add mouse listeners
	createNewShape(e.clientX, e.clientY);
	draggableAreaListenerState.addListener({
		eventType: "mousemove",
		handler: sizeNewShapeMouse,
	});
	draggableAreaListenerState.addListener({
		eventType: "mouseup",
		handler: releaseNewShapeMouse,
	});
};

const touchNewShape = (e) => {
	e.preventDefault();
	const touchCoordinates = e.targetTouches[0];
	if (e.touches.length > 1) {
		draggableAreaListenerState.removeListener(
			"touchmove",
			sizeNewShapeTouch
		);
		return;
	}
	// Create new shape and add touch listeners
	createNewShape(
		parseInt(touchCoordinates.clientX),
		parseInt(touchCoordinates.clientY)
	);
	draggableAreaListenerState.addListener({
		eventType: "touchmove",
		handler: sizeNewShapeTouch,
	});
	draggableAreaListenerState.addListener({
		eventType: "touchend",
		handler: releaseNewShapeTouch,
	});
};

const sizeShapeMath = (shape, clientX, clientY) => {
	shape.style.width = sizeToString(
		Math.abs(clientX - startingCursorPosition.getX()),
		"px"
	);
	shape.style.height = sizeToString(
		Math.abs(clientY - startingCursorPosition.getY()),
		"px"
	);
	// Handling for cases where user drags up or left
	if (clientX < startingCursorPosition.getX()) {
		shape.style.left = clientX.toString() + "px";
	}
	if (clientY < startingCursorPosition.getY()) {
		shape.style.top = (clientY - 80).toString() + "px";
	}
};

const sizeNewShapeTouch = (e) => {
	e.preventDefault();
	const currentShapeEl = shapesArray[shapeIndex].element;
	const currentTouchCoords = e.touches[0];
	sizeShapeMath(
		currentShapeEl,
		parseInt(currentTouchCoords.clientX),
		parseInt(currentTouchCoords.clientY)
	);
};

// mousemove handler for draggable area, updates size of new shape div until mouse is released.
const sizeNewShapeMouse = (e) => {
	const currentShapeEl = shapesArray[shapeIndex].element;
	// Resize shape based on cursor movement
	sizeShapeMath(currentShapeEl, e.clientX, e.clientY);
	// Backup way to force call mouseup handler in case mouseup doesn't register
	if (!e.buttons) {
		releaseNewShapeMouse(e);
	}
};

const finalizeShape = () => {
	sortShapesBySize(shapesArray);
	// Cycle through color array and change preview color
	colorIndex++;
	if (colorIndex >= colorArray.length) {
		colorIndex = 0;
	}
	preview.style.borderColor = colorArray[colorIndex];
	// Move on to next shape
	shapeIndex++;
};

const releaseNewShapeTouch = (e) => {
	draggableAreaListenerState.removeListener({
		eventType: "touchmove",
		handler: sizeNewShapeTouch,
	});
	draggableAreaListenerState.removeListener({
		eventType: "touchend",
		handler: releaseNewShapeTouch,
	});
	finalizeShape();
};

// mouseup handler for draggable area, disables mousemove for draggable area and updated index for colorsArray and shapesArray
const releaseNewShapeMouse = (e) => {
	draggableAreaListenerState.removeListener({
		eventType: "mousemove",
		handler: sizeNewShapeMouse,
	});
	draggableAreaListenerState.removeListener({
		eventType: "mouseup",
		handler: releaseNewShapeMouse,
	});
	finalizeShape();
};

// SELECT MODE HANDLERS
// Take in clicked object and make it the selected object, update classList to reflect this change. This function is unique to select mode.
const shapeClickHandler = (e) => {
	const shapeEl = e.target;
	shapesArray[selectedIndex].element.classList.remove("shape--selected");
	selectedIndex = findShape(e.target);
	shapeEl.classList.add("shape--selected");
	borderThickness = stringToSize(shapeEl.style.borderWidth);
	preview.style.borderWidth = sizeToString(borderThickness, "px");
};

// Delete key listener which deletes selected shape and calls functio to re-index event listeners
const deleteShape = (e) => {
	if (
		(e.key === "Delete" || e.key === "Backspace") &&
		shapesArray[selectedIndex]
	) {
		draggableArea.removeChild(shapesArray[selectedIndex].element);
		shapesArray.splice(selectedIndex, 1);
		reIndexShapes();
	}
};

const startingShapePos = new PositionCoordinates();
const currentShapePos = new PositionCoordinates();

// MOVE MODE HANDLERS
// Focus specific shape to move when clicked on
const grabShape = (shapeEl, clientX, clientY) => {
	borderThickness = stringToSize(shapeEl.style.borderWidth);
	preview.style.borderWidth = sizeToString(borderThickness, "px");
	startingCursorPosition.setX(clientX);
	startingCursorPosition.setY(clientY);
	startingShapePos.setX(stringToSize(shapeEl.style.left));
	startingShapePos.setY(stringToSize(shapeEl.style.top));
	currentShapePos.setX(stringToSize(shapeEl.style.left));
	currentShapePos.setY(stringToSize(shapeEl.style.top));
};

const clickShape = (e) => {
	selectedIndex = findShape(e.target);
	const shapeEl = e.target;
	// Maybe make these two lines of code into a function?
	grabShape(shapeEl, e.clientX, e.clientY);
	draggableAreaListenerState.addListener({
		eventType: "mousemove",
		handler: moveShapeMouse,
	});
	draggableAreaListenerState.addListener({
		eventType: "mouseup",
		handler: releaseShapeMouse,
	});
};

const touchShape = (e) => {
	e.preventDefault();
	console.log(e);
	if (e.touches > 1) {
		draggableAreaListenerState.removeListener({
			eventType: "touchmove",
			handler: moveShapeTouch,
		});
		draggableAreaListenerState.removeListener({
			eventType: "touchend",
			handler: releaseShapeTouch,
		});
		return;
	}
	selectedIndex = findShape(e.target);
	const shapeEl = e.target;
	const touchCoordinates = e.touches[0];
	grabShape(
		shapeEl,
		parseInt(touchCoordinates.clientX),
		parseInt(touchCoordinates.clientY)
	);
	draggableAreaListenerState.addListener({
		eventType: "touchmove",
		handler: moveShapeTouch,
	});
	draggableAreaListenerState.addListener({
		eventType: "touchend",
		handler: releaseShapeTouch,
	});
};

const movementMath = (shapeEl, clientX, clientY) => {
	const newX = sizeToString(
		startingShapePos.getX() + clientX - startingCursorPosition.getX(),
		"px"
	);
	const newY = sizeToString(
		startingShapePos.getY() + clientY - startingCursorPosition.getY(),
		"px"
	);
	currentShapePos.setX(stringToSize(newX));
	currentShapePos.setY(stringToSize(newY));
	shapeEl.style.left = newX;
	shapeEl.style.top = newY;
};

// Update x/y co-ordinates of shape based on cursor movement
const moveShapeMouse = (e) => {
	const shapeEl = shapesArray[selectedIndex].element;
	movementMath(shapeEl, e.clientX, e.clientY);
	// Fallback to remove listeners if mouseup is not registered in browser
	if (!e.buttons) {
		releaseShapeMouse(e);
	}
};

const moveShapeTouch = (e) => {
	const shapeEl = shapesArray[selectedIndex].element;
	const touchCoordinates = e.touches[0];
	movementMath(
		shapeEl,
		parseInt(touchCoordinates.clientX),
		parseInt(touchCoordinates.clientY)
	);
};

const releaseShapeMouse = (e) => {
	draggableAreaListenerState.removeListener({
		eventType: "mousemove",
		handler: moveShapeMouse,
	});
	draggableAreaListenerState.removeListener({
		eventType: "mouseup",
		handler: releaseShapeMouse,
	});
};

const releaseShapeTouch = (e) => {
	draggableAreaListenerState.removeListener({
		eventType: "touchmove",
		handler: moveShapeTouch,
	});
	draggableAreaListenerState.removeListener({
		eventType: "touchend",
		handler: releaseShapeTouch,
	});
};

// Function to re-index event listeners on all elements of shapesArray and reset all related index variables
const reIndexShapes = () => {
	shapeIndex = shapesArray.length;
	if (!shapeIndex) {
		return;
	}
	selectedIndex = shapeIndex - 1;
	shapesArray[selectedIndex].element.classList.add("shape--selected");
};

const findShape = (shape) => {
	return shapesArray.indexOf(
		shapesArray.find((shapeInArray) => shapeInArray.element === shape)
	);
};
