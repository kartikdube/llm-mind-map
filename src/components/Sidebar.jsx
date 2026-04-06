import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Globe, Zap, ChevronDown, Circle } from 'lucide-react';

const MODEL_META = {
  'GPT-4':      { icon: Cpu,   color: '#38bdf8', cls: 'toggle-gpt',    label: 'GPT-4',      sub: 'OpenAI'   },
  'Claude 3':   { icon: Globe, color: '#34d399', cls: 'toggle-claude',  label: 'Claude 3',   sub: 'Anthropic' },
  'Gemini 1.5': { icon: Zap,   color: '#f97316', cls: 'toggle-gemini',  label: 'Gemini 1.5', sub: 'Google'   },
};

const LEGEND = [
  { color: '#38bdf8', label: 'GPT-4 exclusive'         },
  { color: '#34d399', label: 'Claude 3 exclusive'       },
  { color: '#f97316', label: 'Gemini 1.5 exclusive'     },
  { color: '#a78bfa', label: 'Shared consensus'         },
];

// ─── Custom dropdown ──────────────────────────────────────────────────────────
function CustomSelect({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = categories.find(c => c.id === value);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="custom-select-wrapper" ref={ref}>
      <div
        className={`custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.name ?? '—'}</span>
        <svg className="custom-select-arrow" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && (
        <div className="custom-select-dropdown">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`custom-select-option ${cat.id === value ? 'selected' : ''}`}
              onClick={() => { onChange(cat.id); setOpen(false); }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ categories, selectedCategoryId, onCategoryChange, visibleModels, onModelToggle }) {
  return (
    <aside className="sidebar glass-panel">

      {/* Brand */}
      <div className="sidebar-brand">
        <h1>LLM Mind Map</h1>
        <p>Semantic neighbour comparison across language models</p>
      </div>

      <div className="divider" />

      {/* Topic */}
      <div className="sidebar-section">
        <span className="sidebar-label">Topic</span>
        <CustomSelect
          categories={categories}
          value={selectedCategoryId}
          onChange={onCategoryChange}
        />
      </div>

      {/* Models */}
      <div className="sidebar-section">
        <span className="sidebar-label">Models</span>
        {Object.entries(MODEL_META).map(([model, meta]) => {
          const Icon   = meta.icon;
          const active = visibleModels.includes(model);
          return (
            <div
              key={model}
              className={`toggle-item ${active ? 'active' : ''}`}
              onClick={() => onModelToggle(model)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Colour dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: active ? meta.color + '18' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? meta.color + '44' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={13} color={active ? meta.color : 'rgba(255,255,255,0.22)'} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>
                    {meta.sub}
                  </div>
                </div>
              </div>
              <div className={`toggle-switch ${meta.cls}`} />
            </div>
          );
        })}
      </div>

      <div className="divider" />

      {/* Legend */}
      <div className="sidebar-section">
        <span className="sidebar-label">Node Colour</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="legend-item">
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: color,
                boxShadow: `0 0 6px ${color}88`, flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distance guide — pushed to bottom */}
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <span className="sidebar-label">Reading the Graph</span>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7 }}>
          Distance from centre = semantic dissimilarity. Nodes <strong style={{ color: 'rgba(255,255,255,0.70)' }}>closer in</strong> share more meaning with the topic in that model's embedding space.
        </p>
      </div>

    </aside>
  );
}
