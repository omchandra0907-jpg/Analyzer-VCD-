function convertOutToVCD(outText) {
    const lines = outText.split('\n').map(l => l.trim()).filter(l => l);
    if(lines.length === 0) return outText;
    
    // Check if it is a valid .out table
    if(!lines[0].includes('|')) return outText; 
    
    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
    if(headers.length === 0) return outText;
    
    // UPGRADED: Detect if this is a Sequential chip (has time) or Combinational (no time)
    const hasTime = headers[0].toLowerCase() === 'time';
    
    let vcdOutput = "$timescale 1ns$end\n$scope module Nand2Tetris_Chip$end\n";
    const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;':,.<>/?".split('');
    
    let symbolMap = [];
    let startIndex = hasTime ? 1 : 0; // Skip time column if it exists
    
    for (let i = startIndex; i < headers.length; i++) {
        let sym = symbols[i - startIndex] || ('s' + i);
        vcdOutput += `$var wire 16 ${sym} ${headers[i]} $end\n`;
        symbolMap.push({ name: headers[i], sym: sym, index: i });
    }
    vcdOutput += "$upscope $end\n$enddefinitions $end\n$dumpvars\n";
    
    let lastState = Array(headers.length).fill(null);
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split('|').map(val => val.trim()).filter(val => val);
        if (row.length === 0) continue;
        
        let timeChanged = false;
        let rowVCD = "";
        // If it has no time column, we simulate 10ns per row
        let currentTime = hasTime ? (parseInt(row[0]) * 10) : ((i - 1) * 10);
        
        for (let map of symbolMap) {
            let j = map.index;
            if (row[j] !== lastState[j]) {
                if (!timeChanged) {
                    rowVCD += `#${currentTime}\n`;
                    timeChanged = true;
                }
                
                let num = parseInt(row[j], 10);
                if (!isNaN(num) && row[j].toUpperCase() !== "X") {
                    let binVal = ((num & 0xFFFF) >>> 0).toString(2); 
                    rowVCD += `b${binVal} ${map.sym}\n`;
                } else {
                    rowVCD += `b${row[j]} ${map.sym}\n`;
                }
                lastState[j] = row[j];
            }
        }
        vcdOutput += rowVCD;
    }
    return vcdOutput;
}

function parseVCD(vcdText) {
    const lines = vcdText.split('\n');
    let symbolMap = {}; let waveforms = {};
    let currentTime = 0; let maxTime = 0;

    for (let line of lines) {
        line = line.trim();
        if (line.length === 0) continue;

        if (line.startsWith('$var wire')) {
            const words = line.split(' ');
            const width = words[2]; const symbol = words[3]; const name = words[4];
            symbolMap[symbol] = { name: name, width: width }; 
            waveforms[symbol] = []; 
        } else if (line.startsWith('#')) {
            currentTime = parseInt(line.substring(1));
            if (currentTime > maxTime) maxTime = currentTime;
        } else if (line.startsWith('0') || line.startsWith('1')) {
            if (waveforms[line.substring(1)]) waveforms[line.substring(1)].push({ time: currentTime, value: line[0] });
        } else if (line.startsWith('b') || line.startsWith('B')) {
            const parts = line.split(' ');
            if (parts.length >= 2 && waveforms[parts[1]]) {
                waveforms[parts[1]].push({ time: currentTime, value: parts[0].substring(1) });
            }
        }
    }
    return { signals: symbolMap, data: waveforms, maxTime: maxTime };
}

function formatValue(binStr, radix) {
    if (binStr === 'x' || binStr.length === 1) return binStr;
    const num = parseInt(binStr, 2);
    if (radix === 16) return "0x" + num.toString(16).toUpperCase();
    if (radix === 10) return num.toString(10);
    if (radix === 2) return "0b" + binStr;
}

function getValueAtTime(parsedData, symbol, targetTime, radix) {
    const changes = parsedData.data[symbol];
    if (!changes || changes.length === 0) return 'x';
    let val = changes[0].value;
    for (let i = 0; i < changes.length; i++) {
        if (changes[i].time <= targetTime) val = changes[i].value; else break;
    }
    return formatValue(val, radix);
}
