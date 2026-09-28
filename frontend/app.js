const fileInput = document.getElementById('vcd-upload');
const canvas = document.getElementById('waveform-canvas');
const ctx = canvas.getContext('2d');
const signalList = document.getElementById('signal-list'); 
const radixBtn = document.getElementById('radix-toggle');
const searchBox = document.getElementById('trigger-search');
const deltaDisplay = document.getElementById('delta-time-display');
const resetBtn = document.getElementById('reset-cursors');
const viewerArea = document.querySelector('.viewer-area');
const globalTooltip = document.getElementById('global-tooltip');

const state = {
    parsedData: null, signalOrder: [], timeScale: 10, mouseX: -1, mouseY: -1, radix: 16,
    cursorA: null, cursorB: null, highlightValue: null, cursorToUpdate: 'A',
    isDragging: false, dragStartX: 0, scrollStartX: 0, endMessage: "GIVE ME MORE DATA" 
};

const phrases = [
    "GIVE ME MORE DATA", "SIMULATION HALTED", "END OF LOG RECORD", 
    "NO MORE CYCLES", "SIGNAL TERMINATED", "EOF REACHED", "SYSTEM OFFLINE"
];

function triggerUpdate() {
    updateSidebar(); drawWaveforms(canvas, ctx, state, deltaDisplay);
    if (state.cursorA !== null || state.cursorB !== null) resetBtn.classList.add('visible');
    else resetBtn.classList.remove('visible');
}

fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const isOutFile = file.name.toLowerCase().endsWith('.out');
    const reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;
        if (isOutFile) text = convertOutToVCD(text);
        state.parsedData = parseVCD(text);
        state.signalOrder = Object.keys(state.parsedData.signals);
        state.cursorA = null; state.cursorB = null; state.highlightValue = null;
        state.endMessage = phrases[Math.floor(Math.random() * phrases.length)];
        searchBox.value = ''; triggerUpdate(); 
    };
    reader.readAsText(file);
});

radixBtn.addEventListener('click', () => {
    if (state.radix === 16) { state.radix = 10; radixBtn.textContent = 'FORMAT: DECIMAL'; }
    else if (state.radix === 10) { state.radix = 2; radixBtn.textContent = 'FORMAT: BINARY'; }
    else { state.radix = 16; radixBtn.textContent = 'FORMAT: HEX'; }
    if (state.highlightValue !== null && searchBox.value.trim() !== '') {
        if (state.radix === 16) searchBox.value = '0x' + state.highlightValue.toString(16).toUpperCase();
        else if (state.radix === 2) searchBox.value = '0b' + state.highlightValue.toString(2);
        else searchBox.value = state.highlightValue.toString(10);
    }
    triggerUpdate();
});

searchBox.addEventListener('input', (e) => {
    if (!state.parsedData) return;
    let query = e.target.value.trim().toLowerCase();
    if (!query) { state.highlightValue = null; triggerUpdate(); return; }
    query = query.replace(/0?\*/g, '0x');
    let searchDec = null;
    if (query.startsWith('0b')) searchDec = parseInt(query.substring(2), 2);
    else if (query.startsWith('0x')) searchDec = parseInt(query.substring(2), 16);
    else searchDec = parseInt(query, state.radix); 
    if (isNaN(searchDec)) { state.highlightValue = null; triggerUpdate(); return; }
    state.highlightValue = searchDec;
    let targetTime = -1;
    for (let sym of state.signalOrder) {
        let changes = state.parsedData.data[sym];
        let found = changes.find(c => parseInt(c.value, 2) === searchDec);
        if (found && (targetTime === -1 || found.time < targetTime)) targetTime = found.time;
    }
    if (targetTime !== -1) {
        state.cursorA = targetTime; state.cursorToUpdate = 'B'; 
        const targetX = 20 + (targetTime * state.timeScale);
        viewerArea.scrollLeft = targetX - (viewerArea.clientWidth / 2); 
    }
    triggerUpdate();
});

viewerArea.addEventListener('mousedown', (e) => {
    if (e.button === 0) { 
        state.isDragging = true; state.dragStartX = e.clientX;
        state.scrollStartX = viewerArea.scrollLeft; viewerArea.style.cursor = 'grabbing';
    }
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) { state.isDragging = false; viewerArea.style.cursor = 'auto'; } });
window.addEventListener('mousemove', (e) => { if (state.isDragging) { viewerArea.scrollLeft = state.scrollStartX - (e.clientX - state.dragStartX); } });
window.addEventListener('contextmenu', e => e.preventDefault()); 

canvas.addEventListener('dblclick', (e) => {
    if (!state.parsedData) return;
    const time = Math.floor((e.offsetX - 20) / state.timeScale);
    if (time < 0) return;
    if (state.cursorToUpdate === 'A') { state.cursorA = time; state.cursorToUpdate = 'B'; } 
    else { state.cursorB = time; state.cursorToUpdate = 'A'; }
    triggerUpdate();
});

resetBtn.addEventListener('click', () => { state.cursorA = null; state.cursorB = null; state.cursorToUpdate = 'A'; triggerUpdate(); });

canvas.addEventListener('wheel', function(event) {
    if (!state.parsedData) return;
    event.preventDefault(); 
    const zoomIntensity = 1 + Math.min(Math.abs(event.deltaY) * 0.001, 0.03); 
    if (event.deltaY < 0) state.timeScale *= zoomIntensity; else state.timeScale /= zoomIntensity; 
    state.timeScale = Math.max(0.1, Math.min(state.timeScale, 150)); 
    triggerUpdate();
});

let lastTap = 0;
viewerArea.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { state.isDragging = true; state.dragStartX = e.touches[0].clientX; state.scrollStartX = viewerArea.scrollLeft; }
});
window.addEventListener('touchend', () => { state.isDragging = false; });
window.addEventListener('touchmove', (e) => {
    if (state.isDragging && e.touches.length === 1) { viewerArea.scrollLeft = state.scrollStartX - (e.touches[0].clientX - state.dragStartX); }
});
canvas.addEventListener('touchstart', (e) => {
    if (!state.parsedData || e.touches.length !== 1) return;
    const currentTime = new Date().getTime(); const tapLength = currentTime - lastTap;
    const rect = canvas.getBoundingClientRect(); state.mouseX = e.touches[0].clientX - rect.left;
    if (tapLength < 300 && tapLength > 0) {
        const time = Math.floor((state.mouseX - 20) / state.timeScale);
        if (time >= 0) {
            if (state.cursorToUpdate === 'A') { state.cursorA = time; state.cursorToUpdate = 'B'; } 
            else { state.cursorB = time; state.cursorToUpdate = 'A'; }
        }
        e.preventDefault();
    }
    lastTap = currentTime; triggerUpdate();
});

canvas.addEventListener('mousemove', function(event) {
    if (!state.parsedData) return;
    state.mouseX = event.offsetX; state.mouseY = event.offsetY;
    let isHoveringBus = false;
    let row = Math.floor((state.mouseY - 40) / 60);
    if (row >= 0 && row < state.signalOrder.length && state.mouseX >= 20) {
        let symbol = state.signalOrder[row];
        let isBus = state.parsedData.data[symbol].some(c => c.value.length > 1);
        if (isBus) {
            let hoverTime = Math.floor((state.mouseX - 20) / state.timeScale);
            if (hoverTime >= 0 && hoverTime <= state.parsedData.maxTime) {
                isHoveringBus = true;
                let val = getValueAtTime(state.parsedData, symbol, hoverTime, state.radix);
                globalTooltip.textContent = val; globalTooltip.classList.add('visible');
                globalTooltip.style.left = (event.clientX + 15) + 'px'; globalTooltip.style.top = (event.clientY + 15) + 'px';
            }
        }
    }
    if (!isHoveringBus) globalTooltip.classList.remove('visible');

    const xA = 20 + (state.cursorA * state.timeScale); const xB = 20 + (state.cursorB * state.timeScale);
    if ((state.cursorA !== null && Math.abs(state.mouseX - xA) < 10) || (state.cursorB !== null && Math.abs(state.mouseX - xB) < 10)) resetBtn.classList.add('glow');
    else resetBtn.classList.remove('glow');
    triggerUpdate();               
});

canvas.addEventListener('mouseleave', function() {
    state.mouseX = -1; state.mouseY = -1; globalTooltip.classList.remove('visible'); resetBtn.classList.remove('glow');
    if (state.parsedData) triggerUpdate(); 
});

function updateSidebar() {
    if (!state.parsedData) return;
    signalList.innerHTML = ''; 
    const headerSpacer = document.createElement('div'); headerSpacer.style.height = '40px'; headerSpacer.style.borderBottom = '1px solid rgba(255,255,255,0.05)'; signalList.appendChild(headerSpacer);
    
    let hoverTime = -1;
    if (state.mouseX >= 20 && state.mouseX <= 20 + (state.parsedData.maxTime * state.timeScale)) { hoverTime = Math.floor((state.mouseX - 20) / state.timeScale); } 
    else if (state.cursorA !== null) { hoverTime = state.cursorA; } else { hoverTime = 0; }

    for (let symbol of state.signalOrder) {
        const div = document.createElement('div'); div.className = 'signal-item';
        div.draggable = true;
        div.addEventListener('dragstart', () => { state.draggedSymbol = symbol; div.style.opacity = '0.5'; });
        div.addEventListener('dragend', () => { div.style.opacity = '1'; });
        div.addEventListener('dragover', (e) => e.preventDefault());
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            if (state.draggedSymbol && state.draggedSymbol !== symbol) {
                const fromIdx = state.signalOrder.indexOf(state.draggedSymbol);
                const toIdx = state.signalOrder.indexOf(symbol);
                state.signalOrder.splice(fromIdx, 1);
                state.signalOrder.splice(toIdx, 0, state.draggedSymbol);
                triggerUpdate();
            }
        });

        const nameSpan = document.createElement('span'); nameSpan.className = 'sig-name';
        nameSpan.innerHTML = `${state.parsedData.signals[symbol].name} <span class="sig-width">(${state.parsedData.signals[symbol].width}-BIT)</span>`;
        
        const valSpan = document.createElement('span'); valSpan.className = 'sig-val';
        if (hoverTime >= 0 && hoverTime <= state.parsedData.maxTime) {
            valSpan.textContent = getValueAtTime(state.parsedData, symbol, hoverTime, state.radix);
        }

        div.appendChild(nameSpan); div.appendChild(valSpan); signalList.appendChild(div);
    }
}
