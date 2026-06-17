import React, { useEffect, useRef } from 'react';

export function NetworkCanvas({ wallets = [], transactions = [], onNodeSelected }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // 3D rotation angles & zoom factor
  const rotationRef = useRef({ yaw: -0.5, pitch: 0.3, zoom: 1.15 });
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  
  // Cache of node and particle positions
  const nodesRef = useRef([]);
  const particlesRef = useRef([]);
  const animatedTxsRef = useRef(new Set());

  // Helper: Project 3D coordinate to 2D Screen
  const project = (x, y, z, rotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, z: 0, visible: false };
    
    const w = canvas.width;
    const h = canvas.height;
    const { yaw, pitch, zoom } = rotation;

    // 1. Rotate around Y-axis (Yaw)
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);

    // 2. Rotate around X-axis (Pitch)
    const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);

    // 3. Perspective Scale
    const cameraDistance = 600;
    const scale = (cameraDistance * zoom) / (cameraDistance + z2);
    const projX = w / 2 + x1 * scale;
    const projY = h / 2 + y2 * scale;

    return {
      x: projX,
      y: projY,
      z: z2,
      visible: z2 > -cameraDistance
    };
  };

  // Setup event handlers for dragging (rotation), scroll wheel (zoom) and click selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      mouseRef.current.isDown = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      if (!mouseRef.current.isDown) return;
      const deltaX = e.clientX - mouseRef.current.lastX;
      const deltaY = e.clientY - mouseRef.current.lastY;
      
      rotationRef.current.yaw += deltaX * 0.007;
      rotationRef.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.pitch + deltaY * 0.007));
      
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      rotationRef.current.zoom = Math.max(0.4, Math.min(3.0, rotationRef.current.zoom - e.deltaY * 0.001));
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let clickedNode = null;
      let minDistance = 25; // Click selection radius

      nodesRef.current.forEach((node) => {
        const proj = project(node.x, node.y, node.z, rotationRef.current);
        if (proj.visible) {
          const dx = mx - proj.x;
          const dy = my - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            clickedNode = node;
          }
        }
      });

      if (clickedNode && onNodeSelected) {
        onNodeSelected(clickedNode);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleClick);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onNodeSelected]);

  // Sync data & build nodes in 3D coordinate space
  useEffect(() => {
    const newNodes = [];

    // 1. Genesis/Admin Node (3D Center) - WHITE outer, BLUE inner
    newNodes.push({
      id: 'admin',
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // Default contract address
      balance: '250.00', // Matches new total supply config
      label: 'SYSTEM CORE (SKH)',
      x: 0, y: -20, z: 0,
      radius: 15,
      color: '#0052FF',
      isFixed: true
    });

    // 2. Add other wallets as 3D points orbiting the center in a nice helix
    const maxDisplay = Math.min(wallets.length, 12);
    for (let i = 0; i < maxDisplay; i++) {
      const wallet = wallets[i];
      const angle = (i / maxDisplay) * Math.PI * 2;
      const distance = 210 + Math.random() * 40;
      
      newNodes.push({
        id: wallet.address.toLowerCase(),
        address: wallet.address,
        balance: wallet.balance ? parseFloat(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00',
        label: `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`,
        x: Math.cos(angle) * distance,
        y: -20 + (Math.random() - 0.5) * 100, // Height variance
        z: Math.sin(angle) * distance,
        radius: 10,
        color: '#888888',
        isFixed: false
      });
    }

    nodesRef.current = newNodes;

    // Trigger glowing 3D transaction pulses when new transactions arrive
    if (transactions && transactions.length > 0) {
      transactions.forEach(tx => {
        if (!tx.hash) return;
        const txHash = tx.hash.toLowerCase();

        // Check if we already animated this transaction hash
        if (!animatedTxsRef.current.has(txHash)) {
          animatedTxsRef.current.add(txHash);

          const fromId = tx.from.toLowerCase();
          const toId = tx.to.toLowerCase();

          // Only animate if both addresses are valid (non-null and length >= 40)
          if (fromId.length >= 40 && toId.length >= 40) {
            let fromNode = newNodes.find(n => n.id === fromId || (n.id === 'admin' && fromId.includes('admin')));
            let toNode = newNodes.find(n => n.id === toId);

            // Create fallback node if sender is not on the map yet
            if (!fromNode && fromId !== '0x0000000000000000000000000000000000000000') {
              const angle = Math.random() * Math.PI * 2;
              fromNode = {
                id: fromId,
                address: tx.from,
                balance: '0.00',
                label: `${tx.from.substring(0, 6)}...`,
                x: Math.cos(angle) * 230,
                y: (Math.random() - 0.5) * 100,
                z: Math.sin(angle) * 230,
                radius: 9,
                color: '#555555',
                isFixed: false
              };
              newNodes.push(fromNode);
            }

            // Create fallback node if recipient is not on the map yet
            if (!toNode) {
              const angle = Math.random() * Math.PI * 2;
              toNode = {
                id: toId,
                address: tx.to,
                balance: '0.00',
                label: `${tx.to.substring(0, 6)}...`,
                x: Math.cos(angle) * 230,
                y: (Math.random() - 0.5) * 100,
                z: Math.sin(angle) * 230,
                radius: 9,
                color: '#555555',
                isFixed: false
              };
              newNodes.push(toNode);
            }

            if (fromNode && toNode) {
              // Pulse animation (electric blue pulse!)
              particlesRef.current.push({
                from: fromNode,
                to: toNode,
                progress: 0,
                speed: 0.008,
                value: tx.value,
                message: tx.message,
                color: '#0052FF'
              });
            }
          }
        }
      });
    }
  }, [wallets, transactions]);

  // Main 3D render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Helper: Draw 3D Solid Shaded Cube
    const drawSolidCube = (x, y, z, size, color, rotation, isHovered = false) => {
      const s = size / 2;
      const time = Date.now() * 0.0006;
      
      const localYaw = time * 1.5;
      const localPitch = time * 0.8;
      
      const rotateLocal = (vx, vy, vz) => {
        // Yaw
        const x1 = vx * Math.cos(localYaw) - vz * Math.sin(localYaw);
        const z1 = vx * Math.sin(localYaw) + vz * Math.cos(localYaw);
        // Pitch
        const y2 = vy * Math.cos(localPitch) - z1 * Math.sin(localPitch);
        const z2 = vy * Math.sin(localPitch) + z1 * Math.cos(localPitch);
        return { x: x1, y: y2, z: z2 };
      };

      const rawVertices = [
        { x: -s, y: -s, z: -s }, // 0
        { x: s, y: -s, z: -s },  // 1
        { x: s, y: s, z: -s },   // 2
        { x: -s, y: s, z: -s },  // 3
        { x: -s, y: -s, z: s },  // 4
        { x: s, y: -s, z: s },   // 5
        { x: s, y: s, z: s },    // 6
        { x: -s, y: s, z: s }    // 7
      ];

      const worldVertices = rawVertices.map(v => {
        const rv = rotateLocal(v.x, v.y, v.z);
        return { x: x + rv.x, y: y + rv.y, z: z + rv.z };
      });

      const projVertices = worldVertices.map(v => project(v.x, v.y, v.z, rotation));

      if (projVertices.some(v => !v.visible)) return;

      const faces = [
        { indices: [0, 1, 2, 3], shade: 1.0 },
        { indices: [1, 5, 6, 2], shade: 0.85 },
        { indices: [5, 4, 7, 6], shade: 0.65 },
        { indices: [4, 0, 3, 7], shade: 0.8 },
        { indices: [4, 5, 1, 0], shade: 1.15 },
        { indices: [3, 2, 6, 7], shade: 0.55 }
      ];

      const faceDepths = faces.map((face, idx) => {
        const sumZ = face.indices.reduce((sum, i) => sum + projVertices[i].z, 0);
        return { idx, avgZ: sumZ / 4 };
      });
      faceDepths.sort((a, b) => b.avgZ - a.avgZ);

      const parseColor = (c) => {
        if (c.startsWith('#')) {
          const hex = c.replace('#', '');
          return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
          };
        }
        return { r: 0, g: 82, b: 255 };
      };

      const rgb = parseColor(color);

      faceDepths.forEach(({ idx }) => {
        const face = faces[idx];
        ctx.beginPath();
        ctx.moveTo(projVertices[face.indices[0]].x, projVertices[face.indices[0]].y);
        for (let i = 1; i < 4; i++) {
          ctx.lineTo(projVertices[face.indices[i]].x, projVertices[face.indices[i]].y);
        }
        ctx.closePath();

        const intensity = face.shade;
        const r = Math.min(255, Math.max(0, rgb.r * intensity));
        const g = Math.min(255, Math.max(0, rgb.g * intensity));
        const b = Math.min(255, Math.max(0, rgb.b * intensity));

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.45 : 0.2})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.95 : 0.45})`;
        ctx.lineWidth = isHovered ? 2.5 : 1.2;
        ctx.stroke();
      });
    };

    // Render loop function
    const render = () => {
      // Pure Black Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const rotation = { ...rotationRef.current };
      const time = Date.now() * 0.001;
      
      // Auto-rotation when NOT dragging
      if (!mouseRef.current.isDown) {
        rotationRef.current.yaw += 0.0008;
      }

      // 1. Draw 3D Tron Grid Floor (Y = 135)
      const floorY = 135;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      const gridSize = 450;
      const gridSteps = 12;
      
      for (let i = -gridSteps; i <= gridSteps; i++) {
        const val = (i / gridSteps) * gridSize;
        const startZ = project(val, floorY, -gridSize, rotation);
        const endZ = project(val, floorY, gridSize, rotation);
        if (startZ.visible && endZ.visible) {
          ctx.beginPath();
          ctx.moveTo(startZ.x, startZ.y);
          ctx.lineTo(endZ.x, endZ.y);
          ctx.stroke();
        }

        const startX = project(-gridSize, floorY, val, rotation);
        const endX = project(gridSize, floorY, val, rotation);
        if (startX.visible && endX.visible) {
          ctx.beginPath();
          ctx.moveTo(startX.x, startX.y);
          ctx.lineTo(endX.x, endX.y);
          ctx.stroke();
        }
      }

      const nodes = nodesRef.current;
      const particles = particlesRef.current;

      // 2. Identify Hovered Node (Check distance in 2D projected space)
      let hoveredNode = null;
      let minDistance = 25;
      nodes.forEach((node) => {
        const proj = project(node.x, node.y, node.z, rotation);
        if (proj.visible) {
          const dx = mousePosRef.current.x - proj.x;
          const dy = mousePosRef.current.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            hoveredNode = node;
          }
        }
      });

      // 3. Draw 3D Network Bridges (animated dashed data pipelines)
      nodes.forEach((node, i) => {
        if (node.id !== 'admin') {
          const start = project(nodes[0].x, nodes[0].y, nodes[0].z, rotation);
          const end = project(node.x, node.y, node.z, rotation);

          if (start.visible && end.visible) {
            const isBridgeHovered = hoveredNode?.id === node.id || hoveredNode?.id === 'admin';

            ctx.strokeStyle = isBridgeHovered ? 'rgba(0, 82, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = isBridgeHovered ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.setLineDash([8, 20]);
            ctx.lineDashOffset = -time * 45;
            ctx.strokeStyle = isBridgeHovered ? 'rgba(0, 82, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = isBridgeHovered ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      });

      // 4. Update & Draw Transaction Particles (Glowing spheres traveling along bridges)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        const curX = p.from.x + (p.to.x - p.from.x) * p.progress;
        const curY = p.from.y + (p.to.y - p.from.y) * p.progress;
        const curZ = p.from.z + (p.to.z - p.from.z) * p.progress;

        const proj = project(curX, curY, curZ, rotation);

        if (proj.visible) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#0052FF';
          ctx.shadowColor = '#0052FF';
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px var(--font-mono)';
          ctx.textAlign = 'left';
          
          let displayTag = `${parseFloat(p.value).toFixed(2)} SKH`;
          if (p.message) {
            displayTag += ` ("${p.message.substring(0, 15)}")`;
          }
          ctx.fillText(displayTag, proj.x + 14, proj.y - 4);
        }
      }

      // 5. Draw 3D Blocks (Cubes) - ENLARGED ON HOVER!
      nodes.forEach((node) => {
        if (!node.isFixed) {
          const orbitSpeed = 0.0007;
          const cos = Math.cos(orbitSpeed);
          const sin = Math.sin(orbitSpeed);
          
          const nx = node.x * cos - node.z * sin;
          const nz = node.x * sin + node.z * cos;
          node.x = nx;
          node.z = nz;
        }

        const isNodeHovered = hoveredNode?.id === node.id;
        
        if (node.id === 'admin') {
          // Draw outer large white wireframe core (Enlarged from 30 to 48 on hover)
          drawSolidCube(node.x, node.y, node.z, isNodeHovered ? 48 : 30, '#FFFFFF', rotation, isNodeHovered);
          // Draw inner fast-spinning electric blue core (Enlarged from 15 to 24 on hover)
          const innerRotation = {
            yaw: -rotation.yaw * 1.5,
            pitch: -rotation.pitch * 1.5,
            zoom: rotation.zoom
          };
          drawSolidCube(node.x, node.y, node.z, isNodeHovered ? 24 : 15, '#0052FF', innerRotation, isNodeHovered);
        } else {
          // Draw normal client node (Enlarged from 17 to 32 on hover!)
          drawSolidCube(node.x, node.y, node.z, isNodeHovered ? 32 : 17, '#888888', rotation, isNodeHovered);
        }

        // Draw flat labels floating above cubes
        const centerProj = project(node.x, node.y, node.z, rotation);
        if (centerProj.visible) {
          ctx.fillStyle = isNodeHovered ? '#0052FF' : '#E0E0E0';
          ctx.font = isNodeHovered ? 'bold 13px var(--font-mono)' : '10px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, centerProj.x, centerProj.y - (node.id === 'admin' ? (isNodeHovered ? 36 : 26) : (isNodeHovered ? 28 : 18)));
        }
      });

      // 6. Draw HUD Tooltip overlay for Hovered Node (GIGANTIC & Highly Readable)
      if (hoveredNode) {
        const proj = project(hoveredNode.x, hoveredNode.y, hoveredNode.z, rotation);
        
        if (proj.visible) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.0;
          const bSize = 30; // Larger brackets
          const lineLen = 10;
          
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(proj.x - bSize, proj.y - bSize + lineLen);
          ctx.lineTo(proj.x - bSize, proj.y - bSize);
          ctx.lineTo(proj.x - bSize + lineLen, proj.y - bSize);
          ctx.stroke();

          // Top-Right
          ctx.beginPath();
          ctx.moveTo(proj.x + bSize, proj.y - bSize + lineLen);
          ctx.lineTo(proj.x + bSize, proj.y - bSize);
          ctx.lineTo(proj.x + bSize - lineLen, proj.y - bSize);
          ctx.stroke();

          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(proj.x - bSize, proj.y + bSize - lineLen);
          ctx.lineTo(proj.x - bSize, proj.y + bSize);
          ctx.lineTo(proj.x - bSize + lineLen, proj.y + bSize);
          ctx.stroke();

          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(proj.x + bSize, proj.y + bSize - lineLen);
          ctx.lineTo(proj.x + bSize, proj.y + bSize);
          ctx.lineTo(proj.x + bSize - lineLen, proj.y + bSize);
          ctx.stroke();

          // Draw HUD Box (larger size for high readability)
          const boxX = proj.x + 40;
          const boxY = proj.y - 80;
          const bw = 430; // Expanded width
          const bh = 155; // Expanded height

          const actualX = boxX + bw > width ? proj.x - bw - 40 : boxX;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.0; // Thicker border
          ctx.fillRect(actualX, boxY, bw, bh);
          ctx.strokeRect(actualX, boxY, bw, bh);

          // HUD Title Bar
          ctx.fillStyle = 'rgba(0, 82, 255, 0.25)';
          ctx.fillRect(actualX + 1, boxY + 1, bw - 2, 34);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px var(--font-mono)'; // Bigger font!
          ctx.textAlign = 'left';
          ctx.fillText(hoveredNode.id === 'admin' ? 'SYSTEM CORE (GENESIS)' : 'CLIENT PEER NODE', actualX + 16, boxY + 22);

          ctx.beginPath();
          ctx.arc(actualX + bw - 18, boxY + 17, 6, 0, Math.PI * 2);
          ctx.fillStyle = hoveredNode.id === 'admin' ? '#0052FF' : '#00E676';
          ctx.fill();

          // Data content (extremely readable)
          ctx.fillStyle = '#AAAAAA';
          ctx.font = '12px var(--font-mono)';
          
          ctx.fillText('ADDRESS:', actualX + 16, boxY + 54);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px var(--font-mono)';
          ctx.fillText(hoveredNode.address, actualX + 16, boxY + 72);

          ctx.fillStyle = '#AAAAAA';
          ctx.font = '12px var(--font-mono)';
          ctx.fillText('BALANCE:', actualX + 16, boxY + 102);
          ctx.fillStyle = '#0052FF';
          ctx.font = 'bold 17px var(--font-mono)'; // Enlarged balance
          ctx.fillText(`${hoveredNode.balance} SKH`, actualX + 16, boxY + 122);

          ctx.fillStyle = '#666666';
          ctx.font = '11px var(--font-mono)';
          ctx.fillText(hoveredNode.id === 'admin' ? 'CORE: ONLINE' : 'LATENCY: <1ms', actualX + bw - 145, boxY + 122);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [wallets, transactions]);

  return (
    <div className="network-canvas-container" style={{ height: '700px', position: 'relative' }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: '16px', left: '16px', 
          zIndex: 10, 
          fontSize: '0.85rem', 
          color: '#0052FF',
          background: 'rgba(0,0,0,0.92)',
          padding: '10px 20px',
          border: '2px solid var(--border)', // Thicker border
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.85)',
          fontWeight: 'bold'
        }}
      >
        3D İNTERAKTİF BLOKZİNCİR AĞI [FARE: DÖNDÜR | TEKERLEK: ZOOM | TIKLA: SEÇ | HOVER: HUD]
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
    </div>
  );
}

export default NetworkCanvas;
