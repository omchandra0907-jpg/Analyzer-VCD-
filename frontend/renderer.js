function drawWaveforms(canvas, ctx, state, deltaDisplay) {
    if (!state.parsedData) return;
    const rowHeight = 60; const waveHeight = 40; const startX = 20; const startY = 40; 
    const maxTime = state.parsedData.maxTime;
    const endX = startX + (maxTime * state.timeScale);
    
    canvas.width = Math.max(800, endX + 180);
    canvas.height = Math.max(600, (state.signalOrder.length * rowHeight) + startY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.cursorA !== null && state.cursorB !== null) {
        deltaDisplay.textContent = `Δt: ${Math.abs(state.cursorA - state.cursorB)} ns`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        const xA = startX + (state.cursorA * state.timeScale);
        const xB = startX + (state.cursorB * state.timeScale);
        ctx.fillRect(Math.min(xA, xB), 0, Math.abs(xA - xB), canvas.height);
    } else {
        deltaDisplay.textContent = `Δt: 0 ns`;
    }

    ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)'; ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px "Orbitron"'; ctx.textAlign = 'center';
    
    let gridStepTime = 10;
    if (state.timeScale < 4) gridStepTime = 20;
    if (state.timeScale < 2) gridStepTime = 50;
    if (state.timeScale < 0.8) gridStepTime = 100;

    for (let t = 0; t <= maxTime; t += gridStepTime) {
        const x = startX + (t * state.timeScale); 
        ctx.moveTo(x, startY - 10); ctx.lineTo(x, canvas.height); ctx.fillText(t, x, startY - 15);
    }
    ctx.stroke();

    let currentRow = 0;
    for (let symbol of state.signalOrder) {
        const changes = state.parsedData.data[symbol];
        if (!changes || changes.length === 0) { currentRow++; continue; }

        const yBase = startY + (currentRow * rowHeight);
        const yHigh = yBase; const yLow = yBase + waveHeight; const yMid = yBase + (waveHeight / 2);
        const isBus = changes.some(c => c.value.length > 1);

        if (isBus) {
            ctx.lineWidth = 2; 
            ctx.font = '12px "Orbitron"'; ctx.textAlign = 'center';

            for (let i = 0; i < changes.length; i++) {
                const change = changes[i]; const nextChange = changes[i + 1];
                const startX_seg = startX + (change.time * state.timeScale);
                const endX_seg = nextChange ? startX + (nextChange.time * state.timeScale) : endX;
                
                const segDec = parseInt(change.value, 2);
                if (state.highlightValue !== null && segDec === state.highlightValue) {
                    ctx.strokeStyle = '#ffee00'; ctx.fillStyle = '#ffee00'; 
                    ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(255, 238, 0, 0.8)'; 
                } else {
                    ctx.strokeStyle = '#b266ff'; ctx.fillStyle = '#b266ff'; // Neon Purple
                    ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(178, 102, 255, 0.4)';
                }

                ctx.beginPath(); ctx.moveTo(startX_seg, yMid); ctx.lineTo(startX_seg + 5, yHigh); ctx.lineTo(endX_seg - 5, yHigh);           
                ctx.lineTo(endX_seg, yMid); ctx.lineTo(endX_seg - 5, yLow); ctx.lineTo(startX_seg + 5, yLow); ctx.closePath(); ctx.stroke();
                
                ctx.shadowBlur = 0; 
                let availableWidth = (endX_seg - startX_seg) - 15; 
                if (availableWidth > 20) { 
                    let textToDraw = formatValue(change.value, state.radix);
                    if (ctx.measureText(textToDraw).width > availableWidth) {
                        while (textToDraw.length > 2 && ctx.measureText(textToDraw + '..').width > availableWidth) {
                            textToDraw = textToDraw.slice(0, -1);
                        }
                        textToDraw += '..';
                    }
                    if (ctx.measureText(textToDraw).width <= availableWidth + 10) {
                        ctx.fillText(textToDraw, startX_seg + (endX_seg - startX_seg)/2, yMid + 4);
                    }
                }
            }
        } else {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)'; 
            let lastValForFill = changes[0].value; let lastXForFill = startX;
            for (let i = 0; i < changes.length; i++) {
                const currentX = startX + (changes[i].time * state.timeScale);
                if (lastValForFill === '1') ctx.fillRect(lastXForFill, yHigh, currentX - lastXForFill, waveHeight);
                lastValForFill = changes[i].value; lastXForFill = currentX;
            }
            if (lastValForFill === '1') ctx.fillRect(lastXForFill, yHigh, endX - lastXForFill, waveHeight);

            ctx.beginPath(); ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; // Neon Cyan
            ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
            let lastVal = changes[0].value; ctx.moveTo(startX, lastVal === '1' ? yHigh : yLow);
            for (let i = 0; i < changes.length; i++) {
                const x = startX + (changes[i].time * state.timeScale);
                ctx.lineTo(x, lastVal === '1' ? yHigh : yLow); lastVal = changes[i].value; ctx.lineTo(x, lastVal === '1' ? yHigh : yLow);
            }
            ctx.lineTo(endX, lastVal === '1' ? yHigh : yLow); ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        const finalValStr = formatValue(changes[changes.length - 1].value, state.radix);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.font = '700 12px "Orbitron"';
        ctx.textAlign = 'left';
        ctx.fillText(finalValStr, endX + 12, yMid + 4);

        ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1; ctx.moveTo(0, yBase + 50); ctx.lineTo(canvas.width, yBase + 50); ctx.stroke();
        currentRow++;
    }

    ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)'; ctx.setLineDash([4, 4]); ctx.moveTo(endX, 0); ctx.lineTo(endX, canvas.height); ctx.stroke(); ctx.setLineDash([]);

    ctx.save();
    ctx.translate(endX + 50, (canvas.height / 2) + 20); 
    ctx.rotate(-Math.PI / 2); 
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'; 
    ctx.font = 'italic 900 32px "Audiowide"';
    ctx.textAlign = 'center';
    let endText = state.endMessage || "GIVE ME MORE DATA";
    ctx.fillText(endText.split('').join(' '), 0, 0); 
    ctx.restore();

    if (state.cursorA !== null) {
        ctx.beginPath(); ctx.strokeStyle = '#00ff66'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#00ff66';
        const x = startX + (state.cursorA * state.timeScale); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (state.cursorB !== null) {
        ctx.beginPath(); ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#ff007f';
        const x = startX + (state.cursorB * state.timeScale); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); ctx.shadowBlur = 0;
    }

    if (state.mouseX >= startX && state.mouseX <= endX) {
        ctx.beginPath(); ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.moveTo(state.mouseX, 0); ctx.lineTo(state.mouseX, canvas.height); ctx.stroke(); ctx.setLineDash([]); 
        let hoverTime = Math.floor((state.mouseX - startX) / state.timeScale); if (hoverTime < 0) hoverTime = 0;
        ctx.fillStyle = '#ff007f'; ctx.fillRect(state.mouseX + 5, 10, 85, 24); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Orbitron"'; ctx.textAlign = 'left'; ctx.fillText(hoverTime + ' ns', state.mouseX + 10, 27);
    }
}
