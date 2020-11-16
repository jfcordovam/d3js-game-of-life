
let margin = { top: 50, right: 50, bottom: 50, left: 50 },
   width = 600,
   height = 600,
   data = [],
   numberOfLines = 60,
   lengthMultiplier = 10,
   liveCellsCount = 0,
   generationCount = 0,
   isPlaying = false,
   generationCountDiv = d3.select("#genCount"),
   cellsCountDiv = d3.select("#cellsCount"),
   mainInterval;

// Initialize data (all cells are dead)
for (let i = 0; i < numberOfLines; i++) {
   for (let j = 0; j < numberOfLines; j++) {
      data.push({ x: i * lengthMultiplier, y: j * lengthMultiplier, status: "dead" })
   }
}

// Add main SVG
let svg = d3.select("#mainContainer").append("svg")
   .attr("width", width)
   .attr("height", height)
   .on("click", function () {
      addInitialSeed(d3.mouse(this))
      countAliveCells()
   })
   .call(d3.drag()
      .on("drag", dragged)
   )

function dragged() {
   addInitialSeed(d3.mouse(this))
   countAliveCells()
}

// Draw grid
for (let i = 0; i < numberOfLines; i++) {
   svg.append("line")
      .attr("x1", i * lengthMultiplier)
      .attr("x2", i * lengthMultiplier)
      .attr("y1", 0)
      .attr("y2", height)
}

for (let j = 0; j < numberOfLines; j++) {
   svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", j * lengthMultiplier)
      .attr("y2", j * lengthMultiplier)
}

function addInitialSeed(coordinates) {
   let thisX = coordinates[0] - coordinates[0] % 10,
      thisY = coordinates[1] - coordinates[1] % 10,
      thisCell = data.find(function (d) {
         return d.x === thisX && d.y === thisY
      })

   if (thisCell.status === "dead") {
      thisCell.status = "alive"
   } else if (thisCell.status === "alive") {
      thisCell.status = "dead"
   }
   let rectSelection = svg.selectAll("rect.cell.alive").data(data.filter(function (d) { return d.status === "alive" }));

   rectSelection.exit().remove();

   rectSelection = rectSelection
      .enter()
      .append("rect")
      .merge(rectSelection)
      .attr("class", "cell alive")
      .attr("width", lengthMultiplier)
      .attr("height", lengthMultiplier)
      .attr("x", d => { return d.x })
      .attr("y", d => { return d.y })
}

// Returns boolean
function shouldThisCellLive(cell) {
   let aliveNeighbors = countAliveNeighbors(cell)

   if (cell.status === "alive") {
      if (aliveNeighbors < 2) {
         return false // underpopulation
      } else if (aliveNeighbors === 2 || aliveNeighbors === 3) {
         return true
      } else if (aliveNeighbors > 3) {
         return false // overpopulation
      }
   } else if (cell.status === "dead") {
      if (aliveNeighbors === 3) {
         return true // newborn
      } else return false
   }

}

// Returns integer
function countAliveNeighbors(cell) {

   let xPosition = cell.x / lengthMultiplier,
      yPosition = cell.y / lengthMultiplier,
      aliveNeighborsCount = 0

   // find neighbors
   for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
         if (!(i === 0 && j === 0)) {
            let inspectedCell = getCellByCoordinates({ x: (xPosition + i) * lengthMultiplier, y: (yPosition + j) * lengthMultiplier })
            if (inspectedCell) {
               // is found neighbor alive?
               if (inspectedCell.status === "alive") {
                  aliveNeighborsCount++
               }
            }
         }
      }
   }
   return aliveNeighborsCount
}

// Returns an array of two elements, position X and Y of given cell
function getCoordinatesXY(cell) {
   return [+cell.attr("x") / lengthMultiplier, +cell.attr("y") / lengthMultiplier]
}

// Returns a cell instance by given X and Y positions
function getCellByCoordinates(cords) {
   return data.find(function (d) { return d.x === cords.x && d.y === cords.y })
}

function passGeneration() {
   generationCount++;
   let survivingCells = [],
      dyingCells = [];

   generationCountDiv.text("Generation: " + generationCount)
   countAliveCells()

   data.forEach(function (d) {
      if (shouldThisCellLive(d)) {
         survivingCells.push(d)
      } else {
         dyingCells.push(d)
      }
   })

   survivingCells.forEach(function (d) {
      let thisCellData = data.find(function (e) {
         return d.x === e.x && d.y === e.y
      })
      thisCellData.status = "alive"
   })

   dyingCells.forEach(function (d) {
      let thisCellData = data.find(function (e) {
         return d.x === e.x && d.y === e.y
      })
      thisCellData.status = "dead"
   })


   rectSelection = svg.selectAll("rect.cell.alive").data(data.filter(function (d) { return d.status === "alive" }));

   rectSelection.exit().remove();

   rectSelection = rectSelection
      .enter()
      .append("rect")
      .merge(rectSelection)
      .attr("class", "cell alive")
      .attr("width", lengthMultiplier)
      .attr("height", lengthMultiplier)
      .attr("x", d => { return d.x })
      .attr("y", d => { return d.y })

}

function mainAlgorithm() {
   mainInterval = setInterval(function () {
      if (isPlaying) {
         setStatus("Running")
         passGeneration()
      }
   }, 50)
}

// Button functions
function startButton() {
   if (!isPlaying) {
      isPlaying = true
      mainAlgorithm()
   }

}

function pauseButton() {
   if (isPlaying) {
      isPlaying = false
      clearInterval(mainInterval)
      setStatus("Paused")
   }
}

function resetButton() {
   isPlaying = false
   clearInterval(mainInterval)
   setStatus("Not running")
   data.forEach(d => {
      d.status = "dead"
   })
   passGeneration()
   countAliveCells()
   generationCount = 0
   generationCountDiv.text("Generation: 0")
}


// UTILITARY FUNCTIONS

// Calculates and sets global count of live cells
function countAliveCells() {
   let count = 0
   data.forEach(function (d) {
      if (d.status === "alive") {
         count++
      }
   })
   cellsCountDiv.text("Live cells: " + count)
   return
}

function whoIsAlive() {
   data.forEach(function (d) {
      if (d.status === "alive") {
         console.log(d)
      }
   })
}

function setStatus(status) {
   d3.select("#status").text("Status: " + status)
}