import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import GraphContainer from './components/GraphContainer';
import AnalyticsPanel from './components/AnalyticsPanel';
import dataset from './data/dataset.json';
import { X, Crosshair, TrendingUp, Target, Plus, Minus, RotateCcw, Menu, BarChart2 } from 'lucide-react';
import './App.css';

const MC = {

  'GPT-4':      '#38bdf8',
  'Claude 3':   '#34d399',
  'Gemini 1.5': '#f97316',
};

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    dataset.categories.find(c => c.name === 'Power')?.id ?? dataset.categories[0].id
  );
  const [visibleModels, setVisibleModels] = useState(['GPT-4', 'Claude 3', 'Gemini 1.5']);
  const [selectedNode, setSelectedNode] = useState(null);

  // Mobile state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categoryData = dataset.categories.find(c => c.id === selectedCategoryId);

  const handleModelToggle = (model) => {
    setVisibleModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleCategoryChange = (id) => {
    setSelectedCategoryId(id);
    setSelectedNode(null);
    if (isMobile) setShowSidebar(false);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node || null);
  };

  const graphRef = useRef(null);

  return (
    <div className={`app-container ${isMobile ? 'is-mobile' : ''}`}>
      {/* Mobile Header */}
      {isMobile && (
        <header className="mobile-nav glass-panel">
          <button
            className={`nav-btn ${showSidebar ? 'active' : ''}`}
            onClick={() => { setShowSidebar(!showSidebar); setShowAnalytics(false); }}
          >
            <Menu size={20} />
          </button>
          <div className="mobile-brand">
            <h1>LLM Mind Map</h1>
          </div>
          <button
            className={`nav-btn ${showAnalytics ? 'active' : ''}`}
            onClick={() => { setShowAnalytics(!showAnalytics); setShowSidebar(false); }}
          >
            <BarChart2 size={20} />
          </button>
        </header>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}
      {isMobile && showAnalytics && <div className="sidebar-overlay" onClick={() => setShowAnalytics(false)} />}

      <div className={`sidebar-wrapper ${isMobile && !showSidebar ? 'hidden' : ''}`}>
        <Sidebar
          categories={dataset.categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={handleCategoryChange}
          visibleModels={visibleModels}
          onModelToggle={handleModelToggle}
        />
      </div>

      <div className="graph-viewport glass-panel">
        <div className="floating-label">
          <Target size={14} color="#a78bfa" />
          <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.15em' }}>
            Domain:
          </span>
          <span>{categoryData?.name.toUpperCase()}</span>
        </div>

        <GraphContainer
          ref={graphRef}
          data={categoryData}
          visibleModels={visibleModels}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />

        {/* Zoom Controls */}
        <div className="zoom-controls glass-panel">
          <button onClick={() => graphRef.current?.zoomIn()} title="Zoom In"><Plus size={16} /></button>
          <button onClick={() => graphRef.current?.zoomOut()} title="Zoom Out"><Minus size={16} /></button>
          <div className="divider-h" />
          <button onClick={() => graphRef.current?.reset()} title="Reset View"><RotateCcw size={16} /></button>
        </div>

        {/* Node inspector overlay */}

        {selectedNode && (
          <div className="inspector glass-panel glow-card">
            <button
              onClick={() => setSelectedNode(null)}
              className="inspector-close"
            >
              <X size={18} />
            </button>

            <div className="inspector-header">
              <div className="inspector-icon" style={{
                background: selectedNode.isShared
                  ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                  : `linear-gradient(135deg, ${MC[selectedNode.models[0]]}, #1a1a20)`,
                boxShadow: `0 8px 16px -4px ${selectedNode.isShared ? '#7c3aed44' : MC[selectedNode.models[0]] + '33'}`
              }}>
                <Crosshair color="#fff" size={24} />
              </div>
              <div className="inspector-title-group">
                <h3 className="inspector-title">
                  {selectedNode.word}
                </h3>
                <div className="inspector-model-tags">
                  {selectedNode.models.map(m => (
                    <span key={m} style={{
                      padding: '3px 9px', borderRadius: 6, fontSize: '0.62rem', fontWeight: 800,
                      background: MC[m] + '15',
                      color: MC[m],
                      border: `1px solid ${MC[m]}22`,
                      letterSpacing: '0.04em'
                    }}>
                      {m.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="inspector-body">
              <div>
                <div className="sidebar-label" style={{ fontSize: '0.55rem', marginBottom: 8 }}>
                   Embedding Confidence
                </div>
                <div className="confidence-bar-bg">
                  <div className="confidence-bar-fill" style={{
                    width: `${selectedNode.sim * 100}%`,
                    background: selectedNode.isShared
                      ? 'linear-gradient(90deg, #6d28d9, #a78bfa)'
                      : `linear-gradient(90deg, ${MC[selectedNode.models[0]]}aa, ${MC[selectedNode.models[0]]})`,
                    boxShadow: `0 0 12px ${selectedNode.isShared ? '#7c3aed66' : MC[selectedNode.models[0]] + '66'}`
                  }} />
                </div>

                <p className="inspector-desc">
                  <span style={{ color: '#fff', fontWeight: 800 }}>{(selectedNode.sim * 100).toFixed(1)}%</span>
                  {' '}semantic similarity to <strong style={{ color: '#fff' }}>{categoryData?.name}</strong>
                  {selectedNode.isShared ? ` identified by ${selectedNode.models.length} separate model architectures.` : ` in ${selectedNode.models[0]}'s embedding space.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`analytics-wrapper ${isMobile && !showAnalytics ? 'hidden' : ''}`}>
        <AnalyticsPanel data={categoryData} visibleModels={visibleModels} />
      </div>
    </div>
  );
}
