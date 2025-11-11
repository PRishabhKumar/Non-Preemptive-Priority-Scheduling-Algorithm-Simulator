// Process structure
class Process {
    constructor(pid, at, bt, pr) {
        this.pid = pid;
        this.at = at;    // arrival time
        this.bt = bt;    // burst time
        this.pr = pr;    // priority (lower number = higher priority)
        this.ct = 0;     // completion time
        this.tat = 0;    // turnaround time
        this.wt = 0;     // waiting time
        this.rt = 0;     // response time
        this.start = 0;  // start time
        this.done = false;
    }
}

let processes = [];
let currentTime = 0;
let completed = 0;
let isRunning = false;
let ganttChart = [];
let readyQueue = [];

// Generate input fields based on number of processes
function generateInputFields() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    
    if (numProcesses < 1 || numProcesses > 15) {
        alert('Please enter a number between 1 and 15');
        return;
    }
    
    const container = document.getElementById('processInputFields');
    container.innerHTML = '';
    
    for (let i = 1; i <= numProcesses; i++) {
        const card = document.createElement('div');
        card.className = 'process-input-card';
        card.innerHTML = `
            <h3>Process ${i}</h3>
            <div class="input-group">
                <label>Arrival Time:</label>
                <input type="number" id="at${i}" min="0" value="${i - 1}" required>
            </div>
            <div class="input-group">
                <label>Burst Time:</label>
                <input type="number" id="bt${i}" min="1" value="${Math.floor(Math.random() * 5) + 1}" required>
            </div>
            <div class="input-group">
                <label>Priority (Lower = Higher Priority):</label>
                <input type="number" id="pr${i}" min="1" value="${Math.floor(Math.random() * 5) + 1}" required>
            </div>
        `;
        container.appendChild(card);
    }
}

// Load sample data
function loadSampleData() {
    document.getElementById('numProcesses').value = 7;
    generateInputFields();
    
    // Sample data
    const sampleData = [
        { at: 0, bt: 4, pr: 2 },
        { at: 1, bt: 3, pr: 1 },
        { at: 2, bt: 1, pr: 4 },
        { at: 3, bt: 5, pr: 3 },
        { at: 4, bt: 2, pr: 5 },
        { at: 5, bt: 4, pr: 1 },
        { at: 6, bt: 6, pr: 2 }
    ];
    
    sampleData.forEach((data, index) => {
        const i = index + 1;
        document.getElementById(`at${i}`).value = data.at;
        document.getElementById(`bt${i}`).value = data.bt;
        document.getElementById(`pr${i}`).value = data.pr;
    });
}

// Validate and start simulation with user inputs
function startWithInputs() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    
    if (!numProcesses || numProcesses < 1) {
        alert('Please generate input fields first');
        return;
    }
    
    // Collect input data
    processes = [];
    let isValid = true;
    
    for (let i = 1; i <= numProcesses; i++) {
        const at = parseInt(document.getElementById(`at${i}`).value);
        const bt = parseInt(document.getElementById(`bt${i}`).value);
        const pr = parseInt(document.getElementById(`pr${i}`).value);
        
        if (isNaN(at) || isNaN(bt) || isNaN(pr) || bt < 1 || pr < 1 || at < 0) {
            alert(`Please enter valid values for Process ${i}`);
            isValid = false;
            break;
        }
        
        processes.push(new Process(i, at, bt, pr));
    }
    
    if (!isValid) return;
    
    // Hide input section and show main content
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'grid';
    document.getElementById('controls').style.display = 'flex';
    
    // Initialize the simulation
    initializeTable();
    resetSimulation();
}

// Initialize process table
function initializeTable() {
    const tbody = document.getElementById('processTableBody');
    tbody.innerHTML = '';
    
    processes.forEach(p => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>P${p.pid}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.pr}</td>
        `;
    });
}

// Update time display
function updateTimeDisplay() {
    document.getElementById('currentTime').textContent = currentTime;
}

// Update status message
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Update ready queue display
function updateReadyQueue() {
    const queueContainer = document.getElementById('queueItems');
    queueContainer.innerHTML = '';
    
    // Get all processes that have arrived and are not done
    const availableProcesses = processes.filter(p => p.at <= currentTime && !p.done);
    
    // Sort by priority (lower number = higher priority)
    availableProcesses.sort((a, b) => a.pr - b.pr);
    
    availableProcesses.forEach(p => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item ready';
        queueItem.textContent = `P${p.pid} (Priority: ${p.pr})`;
        queueContainer.appendChild(queueItem);
    });
    
    if (availableProcesses.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'queue-item';
        emptyItem.textContent = 'No processes ready';
        queueContainer.appendChild(emptyItem);
    }
}

// Add block to Gantt chart
function addToGanttChart(process, startTime, endTime) {
    const ganttContainer = document.getElementById('ganttChart');
    const block = document.createElement('div');
    block.className = 'gantt-block';
    block.textContent = `P${process.pid}`;
    block.style.width = `${(endTime - startTime) * 40}px`;
    
    const timeLabel = document.createElement('div');
    timeLabel.style.fontSize = '0.8rem';
    timeLabel.textContent = `${startTime}-${endTime}`;
    block.appendChild(timeLabel);    
    ganttContainer.appendChild(block);
}

// Start simulation
function startSimulation() {
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('nextBtn').disabled = false;
    updateStatus('Simulation started. Click Next Step to proceed.');
    updateReadyQueue();
}

// Execute next step in simulation
function nextStep() {
    if (completed >= processes.length) {
        finishSimulation();
        return;
    }

    // Find the process with highest priority among those that have arrived
    let selectedIndex = -1;
    let bestPriority = Infinity;
    
    for (let i = 0; i < processes.length; i++) {
        if (!processes[i].done && processes[i].at <= currentTime) {
            if (processes[i].pr < bestPriority) {
                bestPriority = processes[i].pr;
                selectedIndex = i;
            }
        }
    }
    
    if (selectedIndex === -1) {
        // No process is ready, advance time
        currentTime++;
        updateTimeDisplay();
        updateStatus(`No process ready at time ${currentTime}. Advancing time...`);
        updateReadyQueue();
        return;
    }
    
    const selectedProcess = processes[selectedIndex];
    selectedProcess.start = currentTime;
    
    updateStatus(`Executing Process P${selectedProcess.pid} (Priority: ${selectedProcess.pr}) from time ${currentTime} to ${currentTime + selectedProcess.bt}`);
    
    // Add to Gantt chart
    addToGanttChart(selectedProcess, currentTime, currentTime + selectedProcess.bt);
    
    // Update time and completion
    currentTime += selectedProcess.bt;
    selectedProcess.ct = currentTime;
    selectedProcess.done = true;
    completed++;
    
    updateTimeDisplay();
    updateReadyQueue();
    
    if (completed >= processes.length) {
        document.getElementById('nextBtn').disabled = true;
        setTimeout(finishSimulation, 500);
    }
}

// Finish simulation and show results
function finishSimulation() {
    updateStatus('All processes completed! Calculating final results...');
    calculateResults();
    displayResults();
    document.getElementById('nextBtn').disabled = true;
}

// Calculate turnaround, waiting, and response times
function calculateResults() {
    let totalTAT = 0, totalWT = 0, totalRT = 0;
    
    processes.forEach(p => {
        p.tat = p.ct - p.at;  // Turnaround time
        p.wt = p.tat - p.bt;  // Waiting time
        p.rt = p.start - p.at; // Response time
        
        totalTAT += p.tat;
        totalWT += p.wt;
        totalRT += p.rt;
    });
    
    const n = processes.length;
    document.getElementById('avgTAT').textContent = (totalTAT / n).toFixed(2);
    document.getElementById('avgWT').textContent = (totalWT / n).toFixed(2);
    document.getElementById('avgRT').textContent = (totalRT / n).toFixed(2);
}

// Display final results in table
function displayResults() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    processes.forEach(p => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>P${p.pid}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.pr}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
            <td>${p.rt}</td>
        `;
    });
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    resultsSection.setAttribute('data-loading', 'true');
}

// Reset simulation
function resetSimulation() {
    // Reset all processes
    processes.forEach(p => {
        p.ct = 0;
        p.tat = 0;
        p.wt = 0;
        p.rt = 0;
        p.start = 0;
        p.done = false;
    });
    
    currentTime = 0;
    completed = 0;
    isRunning = false;
    
    // Reset UI
    document.getElementById('ganttChart').innerHTML = '';
    document.getElementById('queueItems').innerHTML = '';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('nextBtn').disabled = true;
    
    updateTimeDisplay();
    updateStatus('Ready to start simulation');
    
    // Add empty queue message
    const emptyItem = document.createElement('div');
    emptyItem.className = 'queue-item';
    emptyItem.textContent = 'Click Start Execution to begin';
    document.getElementById('queueItems').appendChild(emptyItem);
}

// Reset to input screen
function resetToInput() {
    // Show input section
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Reset processes
    processes = [];
    currentTime = 0;
    completed = 0;
    isRunning = false;
}

// Initialize the application on page load
window.onload = function() {
    generateInputFields();
};