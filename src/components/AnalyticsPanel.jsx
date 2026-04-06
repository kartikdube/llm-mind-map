import React from 'react';
import { TrendingUp, BarChart2, Zap } from 'lucide-react';

const MC = {
  'GPT-4':      '#38bdf8',
  'Claude 3':   '#34d399',
  'Gemini 1.5': '#f97316',
};

function ModelPip({ model }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: MC[model] ?? '#888',
      boxShadow: `0 0 4px ${MC[model] ?? '#888'}88`,
      flexShrink: 0,
    }} />
  );
}

export default function AnalyticsPanel({ data, visibleModels }) {
  if (!data) return null;

  const wordMap = {};
  visibleModels.forEach(model => {
    (data.models[model] || []).forEach(({ word, similarity }) => {
      if (!wordMap[word]) wordMap[word] = { count: 0, total: 0, models: [] };
      wordMap[word].count++;
      wordMap[word].total += similarity;
      wordMap[word].models.push(model);
    });
  });

  const sorted = Object.entries(wordMap)
    .map(([word, { count, total, models }]) => ({ word, count, avg: total / count, models }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
    .slice(0, 10);

  const topByModel = {};
  visibleModels.forEach(m => {
    const words = data.models[m] || [];
    if (words.length) topByModel[m] = words[0];
  });

  const sharedCount = sorted.filter(w => w.count > 1).length;

  return (
    <aside className="analytics-panel glass-panel">

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 4 }}>
          Analytics
        </h2>
        <p style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
          {data.name.toUpperCase()} · {visibleModels.length} model{visibleModels.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divider" />

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card glass-panel">
          <span className="sidebar-label" style={{ fontSize: '0.55rem' }}>Nodes</span>
          <span className="stat-val">{Object.keys(wordMap).length}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="sidebar-label" style={{ fontSize: '0.55rem' }}>Shared</span>
          <span className="stat-val" style={{ color: '#a78bfa' }}>{sharedCount}</span>
        </div>
      </div>

      {/* Top word per model */}
      {visibleModels.length > 0 && (
        <div className="sidebar-section">
          <span className="sidebar-label"><TrendingUp size={9} /> Closest per Model</span>
          {visibleModels.map(model => {
            const top = topByModel[model];
            if (!top) return null;
            const pct = Math.round(top.similarity * 100);
            return (
              <div key={model} style={{
                padding: '11px 14px',
                borderRadius: 12,
                background: `${MC[model]}0c`,
                border: `1px solid ${MC[model]}22`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: MC[model] }}>{top.word}</div>
                  <div style={{ fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{model}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{pct}%</div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)' }}>similarity</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="divider" />

      {/* Consensus ranking */}
      <div className="sidebar-section">
        <span className="sidebar-label"><BarChart2 size={9} /> Consensus Ranking</span>
        <div className="top-words-list">
          {sorted.map(({ word, avg, count, models }, idx) => {
            const pct = (avg * 100).toFixed(1);
            const barW = ((avg - 0.70) / 0.26 * 100).toFixed(0);
            return (
              <div key={word} className="top-word-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{word}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {models.map(m => <ModelPip key={m} model={m} />)}
                    </div>
                  </div>
                  {/* Mini similarity bar */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barW}%`,
                      background: count > 1
                        ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
                        : `linear-gradient(90deg, ${MC[models[0]]}66, ${MC[models[0]]})`,
                      borderRadius: 4,
                    }} />
                  </div>
                </div>
                <div style={{ marginLeft: 12, textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#fff' }}>{pct}%</div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>{count}/{visibleModels.length}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
