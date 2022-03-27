const shapesArray=[];
let shapeIndex = 0;
let selectedIndex = 0;
let borderThickness = 5;
let startingPosition={};
let newShape = false;
let releaseBorderButton = false;
let mode = 'draw';
let formOfShape = 'square';
const colorArray = ['#FF0000', '#00FF00', '#8844FF', '#FFFF00', '#00BBFF', '#FF00FF']
let colorIndex = 0;

const draggableArea = document.querySelector('.drawing-area')

// Takes array of shape objects and makes a sorted copy to apply sorted z-index
const sortShapesBySize = (arr) => {
  let arrayToSort = [...arr]
  arrayToSort = arrayToSort.filter(shape => shape)
  arrayToSort.sort((shapeA, shapeB) => {
    return (stringToSize(shapeB.style.width) + stringToSize(shapeB.style.height)) - (stringToSize(shapeA.style.width) + stringToSize(shapeA.style.height))
  })
  arrayToSort.forEach((shape, index) => {
    shape.style.zIndex = index+1
  })
}

// Take in clicked object and make it the selected object, update classList to reflect this change.
const shapeClickHandler = (e, currentIndex) => {
    if(mode !== 'select') {
      return
    }
    shapesArray[selectedIndex].classList.remove('shape--selected')
    selectedIndex = currentIndex
    shapesArray[selectedIndex].classList.add('shape--selected')
    borderThickness = stringToSize(shapesArray[selectedIndex].style.borderWidth)
    preview.style.borderWidth = sizeToString(borderThickness, 'px')
}

// onClick for draggable area, creates new div and appends to draggable area.
const addNewBox = (e) => {
  if(mode !== 'draw' || newShape) {
    return
  }
  // newShape remains true as long as we are creating/resizing a shape
  newShape = true;
  const currentIndex = shapeIndex;
  // Store new shape inside of array, this makes it easier to add editing functionality later on
  shapesArray.push(document.createElement('div'))
  shapesArray[currentIndex].addEventListener('click', (e) => shapeClickHandler(e, currentIndex))
  if(shapesArray[selectedIndex]) {
    shapesArray[selectedIndex].classList.remove('shape--selected')
  }
  shapesArray[currentIndex].className = `shape shape--${formOfShape}`
  shapesArray[currentIndex].style.border= `${sizeToString(borderThickness, 'px')} solid ${colorArray[colorIndex]}` 
  draggableArea.appendChild(shapesArray[currentIndex])
  selectedIndex = currentIndex
  
  // Set initial values for position of shape
  startingPosition={x: e.clientX, y: e.clientY}
  shapesArray[currentIndex].style.top=sizeToString(startingPosition.y - 80, 'px')
  shapesArray[currentIndex].style.left=sizeToString(startingPosition.x, 'px')
}

// mousemove handler for draggable area, updates size of new shape div until mouse is released.
const sizeNewShape = (e) => {
  if (newShape && mode === 'draw') {
    // Resize shape based on cursor movement
    shapesArray[shapeIndex].style.width=sizeToString(Math.abs(e.clientX-startingPosition.x), 'px')
    shapesArray[shapeIndex].style.height=sizeToString(Math.abs(e.clientY-startingPosition.y), 'px')
    // Handling for cases where user drags up or left
    if(e.clientX < startingPosition.x) {
      shapesArray[shapeIndex].style.left=e.clientX.toString() +'px'
    }
    if(e.clientY < startingPosition.y) {
      shapesArray[shapeIndex].style.top=(e.clientY-80).toString() +'px'
    }
  }
}

// mouseup handler for draggable area, disables mousemove for draggable area and updated index for colorsArray and shapesArray
const releaseNewShape = (e) => {
  if(mode !== 'draw') {
    return
  }
  newShape = false
  sortShapesBySize(shapesArray)
  // Cycle through color array and change preview color
  colorIndex++
  if(colorIndex >= colorArray.length) {
    colorIndex=0;
  }
  preview.style.borderColor = colorArray[colorIndex]
  // Move on to next shape
  shapeIndex++
}

// Drawing area events
draggableArea.addEventListener('mousedown', addNewBox)
draggableArea.addEventListener('mousemove', sizeNewShape)
draggableArea.addEventListener('mouseup', releaseNewShape)

// Function to re-index event listeners on all elements of shapesArray and reset all related index variables
const reIndexShapes = () => {
  shapeIndex = shapesArray.length
  selectedIndex = shapeIndex-1
  shapesArray[selectedIndex].classList.add('shape--selected')
  shapesArray.forEach((shape, index) => {
    shape.addEventListener('click', (e) => shapeClickHandler(e, index))
  })
}

// Delete key listener which deletes selected shape and calls functio to re-index event listeners
document.addEventListener('keydown', (e) => {
  if((e.key==='Delete' || e.key==='Backspace') && mode==='select' && shapesArray[selectedIndex]) {
    draggableArea.removeChild(shapesArray[selectedIndex])
    shapesArray.splice(selectedIndex, 1)
    reIndexShapes()
  }
})