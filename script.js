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

// Sample processes data
let processes = [
    new Process(1, 0, 4, 2),
    new Process(2, 1, 3, 1),
    new Process(3, 2, 1, 4),
    new Process(4, 3, 5, 3),
    new Process(5, 4, 2, 5),
    new Process(6, 5, 4, 1),
    new Process(7, 6, 6, 2)
];

let currentTime = 0;
let completed = 0;
let isRunning = false;
let ganttChart = [];
let readyQueue = [];

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

function updateTimeDisplay() {
    document.getElementById('currentTime').textContent = currentTime;
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

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

function startSimulation() {
    resetSimulation();
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('nextBtn').disabled = false;
    updateStatus('Simulation started. Click Next Step to proceed.');
    updateReadyQueue();
}

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

function finishSimulation() {
    updateStatus('All processes completed! Calculating final results...');
    calculateResults();
    displayResults();
    document.getElementById('nextBtn').disabled = true;
}

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
    
    document.getElementById('resultsSection').style.display = 'block';
}

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
    emptyItem.textContent = 'Click Start to begin';
    document.getElementById('queueItems').appendChild(emptyItem);
}

// Initialize the application
window.onload = function() {
    initializeTable();
    resetSimulation();
};