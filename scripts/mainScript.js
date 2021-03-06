const shapesArray = [];
let borderThickness = 5;
let formOfShape = "square";
const colorArray = [
	"#FF0000",
	"#00FF00",
	"#8844FF",
	"#FFFF00",
	"#00BBFF",
	"#FF00FF",
];

const header = document.querySelector("header");

const documentListenerState = new ElementListenerState(document);
const draggableAreaListenerState = new ElementListenerState(
	document.querySelector(".drawing-area")
);

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
	const colorIndex =
		(shapesArray.length % colorArray.length || colorArray.length) - 1;
	const newShapeEl = newShapeListenerState.element;
	// Add necessary classes and styles to new DOM element and print it on the page
	newShapeEl.className = `shape shape--${formOfShape}`;
	newShapeEl.style.border = `${sizeToString(borderThickness, "px")} solid ${
		colorArray[colorIndex]
	}`;
	newShapeEl.style.zIndex = shapesArray.length + 1;
	draggableAreaListenerState.element.appendChild(newShapeEl);
	// Set initial values for position of shape
	newShapeEl.style.left = sizeToString(clientX, "px");
	newShapeEl.style.top = sizeToString(clientY - header.clientHeight, "px");
	return newShapeEl;
};

// DRAW MODE HANDLERS
// onClick for draggable area, creates new div and appends to draggable area. This function is unique to Draw mode.
const clickNewShape = (e) => {
	// create new shape and add mouse listeners
	const startingPosition = new PositionCoordinates(e.clientX, e.clientY);
	const currentShapeEl = createNewShape(
		startingPosition.getX(),
		startingPosition.getY()
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("mousemove", sizeNewShapeMouse, [
			currentShapeEl,
			startingPosition,
		])
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("mouseup", releaseNewShapeMouse)
	);
};

const touchNewShape = (e) => {
	e.preventDefault();
	const touchCoordinates = e.targetTouches[0];
	const startingPosition = new PositionCoordinates(
		touchCoordinates.clientX,
		touchCoordinates.clientY
	);
	if (e.touches.length > 1) {
		draggableAreaListenerState.removeListenerType("touchmove");
		return;
	}
	// Create new shape and add touch listeners
	const currentShapeEl = createNewShape(
		parseInt(startingPosition.getX()),
		parseInt(startingPosition.getY())
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("touchmove", sizeNewShapeTouch, [
			currentShapeEl,
			startingPosition,
		])
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("touchend", releaseNewShapeTouch)
	);
};

const sizeShapeMath = (shape, oldCoords, newCoords) => {
	clientX = parseInt(newCoords.getX());
	clientY = parseInt(newCoords.getY());
	shape.style.width = sizeToString(
		Math.abs(clientX - oldCoords.getX()),
		"px"
	);
	shape.style.height = sizeToString(
		Math.abs(clientY - oldCoords.getY()),
		"px"
	);
	// Handling for cases where user drags up or left
	if (clientX < oldCoords.getX()) {
		shape.style.left = clientX.toString() + "px";
	}
	if (clientY < oldCoords.getY()) {
		shape.style.top = (clientY - 80).toString() + "px";
	}
};

const sizeNewShapeTouch = (e, currentShapeEl, startingPosition) => {
	e.preventDefault();
	const currentTouchCoords = new PositionCoordinates(
		e.touches[0].clientX,
		e.touches[0].clientY
	);
	sizeShapeMath(currentShapeEl, startingPosition, currentTouchCoords);
};

// mousemove handler for draggable area, updates size of new shape div until mouse is released.
const sizeNewShapeMouse = (e, currentShapeEl, startingPosition) => {
	// Resize shape based on cursor movement
	sizeShapeMath(
		currentShapeEl,
		startingPosition,
		new PositionCoordinates(e.clientX, e.clientY)
	);
	// Backup way to force call mouseup handler in case mouseup doesn't register
	if (!e.buttons) {
		releaseNewShapeMouse(e);
	}
};

const finalizeShape = () => {
	sortShapesBySize(shapesArray);
	// Cycle through color array and change preview color
	const colorIndex = shapesArray.length % colorArray.length;
	preview.style.borderColor = colorArray[colorIndex];
};

const releaseNewShapeTouch = (e) => {
	draggableAreaListenerState.removeListenerType("touchmove");
	draggableAreaListenerState.removeListenerType("touchend");
	finalizeShape();
};

// mouseup handler for draggable area, disables mousemove for draggable area and updated index for colorsArray and shapesArray
const releaseNewShapeMouse = (e) => {
	draggableAreaListenerState.removeListenerType("mousemove");
	draggableAreaListenerState.removeListenerType("mouseup");
	finalizeShape();
};

// SELECT MODE HANDLERS
// Take in clicked object and make it the selected object, update classList to reflect this change. This function is unique to select mode.
const shapeClickHandler = (e, selectedShape) => {
	const shapeEl = e.target;
	selectedShape.classList.remove("shape--selected");
	shapeEl.classList.add("shape--selected");
	borderThickness = stringToSize(shapeEl.style.borderWidth);
	preview.style.borderWidth = sizeToString(borderThickness, "px");
	refreshSelectMode(shapeEl);
};

// Delete key listener which deletes selected shape and calls functio to re-index event listeners
const deleteShape = (e, selectedShape) => {
	if (
		(e.key === "Delete" || e.key === "Backspace" || e.type === "click") &&
		selectedShape
	) {
		draggableAreaListenerState.element.removeChild(selectedShape);
		shapesArray.splice(
			shapesArray.findIndex((shape) => shape.element === selectedShape),
			1
		);
		refreshSelectMode(shapesArray[shapesArray.length - 1].element);
	}
};

// MOVE MODE HANDLERS
// Focus specific shape to move when clicked on
const grabShape = (shapeEl, clientX, clientY) => {
	shapeEl.classList.add("shape--selected");
	shapeEl.style.zIndex = shapesArray.length + 1;
	borderThickness = stringToSize(shapeEl.style.borderWidth);
	preview.style.borderWidth = sizeToString(borderThickness, "px");
	const cursorPosition = new PositionCoordinates(clientX, clientY);
	const startingShapePos = new PositionCoordinates(
		stringToSize(shapeEl.style.left),
		stringToSize(shapeEl.style.top)
	);
	const currentShapePos = new PositionCoordinates(
		startingShapePos.getX(),
		startingShapePos.getY()
	);
	return { cursorPosition, startingShapePos, currentShapePos };
};

const clickShape = (e) => {
	const shapeEl = e.target;
	// Maybe make these two lines of code into a function?
	const allCoordinates = grabShape(shapeEl, e.clientX, e.clientY);
	draggableAreaListenerState.addListener(
		new ListenerObject("mousemove", moveShapeMouse, [
			shapeEl,
			allCoordinates,
		])
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("mouseup", releaseShapeMouse, [shapeEl])
	);
};

const touchShape = (e) => {
	e.preventDefault();
	if (e.touches > 1) {
		draggableAreaListenerState.removeListenerType("touchmove");
		draggableAreaListenerState.removeListenerType("touchend");
		return;
	}
	const shapeEl = e.target;
	const touchCoordinates = e.touches[0];
	const allCoordinates = grabShape(
		shapeEl,
		parseInt(touchCoordinates.clientX),
		parseInt(touchCoordinates.clientY)
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("touchmove", moveShapeTouch, [
			shapeEl,
			allCoordinates,
		])
	);
	draggableAreaListenerState.addListener(
		new ListenerObject("touchend", releaseShapeTouch, [shapeEl])
	);
};

const movementMath = (shapeEl, clientX, clientY, allCoordinates) => {
	const { cursorPosition, startingShapePos, currentShapePos } =
		allCoordinates;
	const newX = sizeToString(
		startingShapePos.getX() + clientX - cursorPosition.getX(),
		"px"
	);
	const newY = sizeToString(
		startingShapePos.getY() + clientY - cursorPosition.getY(),
		"px"
	);
	currentShapePos.setX(stringToSize(newX));
	currentShapePos.setY(stringToSize(newY));
	shapeEl.style.left = newX;
	shapeEl.style.top = newY;
};

// Update x/y co-ordinates of shape based on cursor movement
const moveShapeMouse = (e, currentShapeEl, allCoordinates) => {
	movementMath(currentShapeEl, e.clientX, e.clientY, allCoordinates);
	// Fallback to remove listeners if mouseup is not registered in browser
	if (!e.buttons) {
		releaseShapeMouse(e);
	}
};

const moveShapeTouch = (e, currentShapeEl, allCoordinates) => {
	if (e.touches.length > 1) {
		draggableAreaListenerState.removeListenerType("touchmove");
		return;
	}
	const touchCoordinates = e.touches[0];
	movementMath(
		currentShapeEl,
		parseInt(touchCoordinates.clientX),
		parseInt(touchCoordinates.clientY),
		allCoordinates
	);
};

const releaseShapeMouse = (_e, shapeEl) => {
	draggableAreaListenerState.removeListenerType("mousemove");
	draggableAreaListenerState.removeListenerType("mouseup");
	shapeEl.classList.remove("shape--selected");
	sortShapesBySize(shapesArray);
};

const releaseShapeTouch = (_e, shapeEl) => {
	draggableAreaListenerState.removeListenerType("touchmove");
	draggableAreaListenerState.removeListenerType("touchend");
	shapeEl.classList.remove("shape--selected");
	sortShapesBySize(shapesArray);
};

// Function to re-index event listeners on all elements of shapesArray and reset all related index variables
const findShape = (shape) => {
	return shapesArray.indexOf(
		shapesArray.find((shapeInArray) => shapeInArray.element === shape)
	);
};
