import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  Colour palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  'GPT-4':      '#38bdf8',
  'Claude 3':   '#34d399',
  'Gemini 1.5': '#f97316',
  shared:       '#a78bfa',
};

function nodeColor(node) {
  return node.isShared ? C.shared : (C[node.models[0]] ?? '#ccc');
}

// similarity → fraction of max radius  (high sim = close to centre)
function simFrac(sim) {
  const lo = 0.72, hi = 0.95;
  return 1 - Math.max(0, Math.min(1, (sim - lo) / (hi - lo)));
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);     ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.lineTo(x + r, y + h);     ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.lineTo(x,     y + r);     ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────
const GraphContainer = forwardRef(({ data, visibleModels, onNodeClick, selectedNode }, ref) => {
  const canvasRef = useRef(null);

  const S = useRef({
    nodes:    [],
    hover:    null,
    selected: null,
    data:     null,
    raf:      null,
    zoom:     1.0,
    offX:     0,
    offY:     0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    lastTouchDist: 0,
  });

  useImperativeHandle(ref, () => ({
    zoomIn: () => { S.current.zoom = Math.min(10, S.current.zoom * 1.2); },
    zoomOut: () => { S.current.zoom = Math.max(0.1, S.current.zoom / 1.2); },
    reset: () => { S.current.zoom = 1.0; S.current.offX = 0; S.current.offY = 0; }
  }));

  S.current.selected = selectedNode ?? null;
  S.current.data     = data ?? null;

  useEffect(() => {
    function layout() {
      const canvas = canvasRef.current;
      if (!canvas || !data) { S.current.nodes = []; return; }
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) { S.current.nodes = []; return; }

      const cx = 0, cy = 0; 
      const minR = Math.min(W, H) * 0.15;
      const maxR = Math.min(W, H) * 0.44;

      const map = {};
      (visibleModels || []).forEach(model => {
        (data.models[model] || []).forEach(({ word, similarity }) => {
          if (!map[word]) map[word] = { sim: 0, models: [] };
          if (similarity > map[word].sim) map[word].sim = similarity;
          map[word].models.push(model);
        });
      });

      const words = Object.entries(map)
        .map(([word, v]) => ({ word, sim: v.sim, models: v.models, isShared: v.models.length > 1 }))
        .sort((a, b) => b.sim - a.sim);

      S.current.nodes = words.map((w, i) => {
        const angle = (i / words.length) * Math.PI * 2 - Math.PI / 2;
        const r     = minR + simFrac(w.sim) * (maxR - minR);
        return { ...w, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
      });
    }

    layout();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [data, visibleModels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      S.current.raf = requestAnimationFrame(draw);
      const lW = canvas.offsetWidth;
      const lH = canvas.offsetHeight;
      if (!lW || !lH) return;

      if (canvas.width !== lW || canvas.height !== lH) {
        canvas.width  = lW;
        canvas.height = lH;
        return;
      }

      const { nodes, hover, selected, data: d, zoom, offX, offY } = S.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, lW, lH);

      ctx.save();
      ctx.translate(lW/2 + offX, lH/2 + offY);
      ctx.scale(zoom, zoom);

      const cx = 0, cy = 0;

      // Rings
      ctx.save();
      ctx.setLineDash([2, 12]);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1/zoom;
      [0.15, 0.23, 0.31, 0.44].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(lW, lH) * f, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // Spokes
      nodes.forEach(node => {
        const active = hover?.word === node.word || selected?.word === node.word;
        const col    = nodeColor(node);
        const g      = ctx.createLinearGradient(cx, cy, node.x, node.y);
        g.addColorStop(0, 'rgba(255,255,255,0.03)');
        g.addColorStop(1, active ? col + 'dd' : col + '22');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = g;
        ctx.lineWidth   = (active ? 1.5 : 0.6) / zoom;
        ctx.stroke();
      });

      // Nodes
      nodes.forEach(node => {
        const active = hover?.word === node.word || selected?.word === node.word;
        const col    = nodeColor(node);
        const nr     = active ? 9 : (node.isShared ? 6.2 : 4.5);

        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur  = active ? 24 : (node.isShared ? 12 : 0);
        ctx.beginPath();
        ctx.arc(node.x, node.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        if (node.isShared) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth   = 1/zoom;
          ctx.stroke();
        }
        ctx.restore();

        const fs = (active ? 12 : 10) / Math.sqrt(zoom); 
        ctx.font = `${active ? '700' : '500'} ${fs}px Outfit, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        const dx   = node.x - cx, dy = node.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const lx   = node.x + (dx / dist) * (nr + 12 / zoom);
        const ly   = node.y + (dy / dist) * (nr + 12 / zoom);

        const tw = ctx.measureText(node.word).width;
        ctx.fillStyle = 'rgba(5,5,8,0.85)';
        rrect(ctx, lx - tw / 2 - 4/zoom, ly - fs / 2 - 3/zoom, tw + 8/zoom, fs + 6/zoom, 4/zoom);
        ctx.fill();

        ctx.fillStyle = active ? '#ffffff' : 'rgba(255,255,255,0.75)';
        ctx.fillText(node.word, lx, ly);
      });

      // Center Hub
      if (d) {
        const pulse = 1 + 0.05 * Math.sin(Date.now() / 600);
        const hr    = 38 * pulse;
        ctx.save();
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur  = 40;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a  = (i * Math.PI) / 3 - Math.PI / 6;
          ctx.lineTo(cx + hr * Math.cos(a), cy + hr * Math.sin(a));
        }
        ctx.closePath();
        const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr);
        hg.addColorStop(0, 'rgba(167,139,250,0.30)');
        hg.addColorStop(1, 'rgba(12,12,20,0.95)');
        ctx.fillStyle   = hg;
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth   = 2/zoom;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.font         = `800 ${12/zoom}px Outfit, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#ffffff';
        ctx.fillText(d.name.toUpperCase(), cx, cy);
      }
      ctx.restore();
    }
    S.current.raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(S.current.raf);
  }, []);

  function mouseToWorld(mx, my) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const { zoom, offX, offY } = S.current;
    return {
      x: (mx - (canvas.offsetWidth/2 + offX)) / zoom,
      y: (my - (canvas.offsetHeight/2 + offY)) / zoom,
    };
  }

  function hit(mx, my) {
    const { x, y } = mouseToWorld(mx, my);
    for (const n of S.current.nodes) {
      if (Math.hypot(n.x - x, n.y - y) < 14 / S.current.zoom) return n;
    }
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseDown={(e) => {
        S.current.isDragging = true;
        S.current.lastMouseX = e.clientX;
        S.current.lastMouseY = e.clientY;
      }}
      onMouseMove={(e) => {
        if (!canvasRef.current) return;
        if (S.current.isDragging) {
          S.current.offX += e.clientX - S.current.lastMouseX;
          S.current.offY += e.clientY - S.current.lastMouseY;
          S.current.lastMouseX = e.clientX;
          S.current.lastMouseY = e.clientY;
        } else {
          const rect = canvasRef.current.getBoundingClientRect();
          const h = hit(e.clientX - rect.left, e.clientY - rect.top);
          S.current.hover = h;
          canvasRef.current.style.cursor = h ? 'pointer' : 'default';
        }
      }}
      onMouseUp={() => { S.current.isDragging = false; }}
      onMouseLeave={() => { S.current.isDragging = false; S.current.hover = null; }}
      onWheel={(e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.92 : 1.08;
        S.current.zoom = Math.max(0.1, Math.min(10, S.current.zoom * factor));
      }}
      onClick={(e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        onNodeClick?.(hit(e.clientX - rect.left, e.clientY - rect.top));
      }}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          S.current.isDragging = true;
          S.current.lastMouseX = e.touches[0].clientX;
          S.current.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          S.current.isDragging = false;
          S.current.lastTouchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1 && S.current.isDragging) {
          S.current.offX += e.touches[0].clientX - S.current.lastMouseX;
          S.current.offY += e.touches[0].clientY - S.current.lastMouseY;
          S.current.lastMouseX = e.touches[0].clientX;
          S.current.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (S.current.lastTouchDist) {
            const factor = dist / S.current.lastTouchDist;
            S.current.zoom = Math.max(0.1, Math.min(10, S.current.zoom * factor));
          }
          S.current.lastTouchDist = dist;
        }
      }}
      onTouchEnd={() => {
        S.current.isDragging = false;
        S.current.lastTouchDist = 0;
      }}
    />
  );
});

export default GraphContainer;
