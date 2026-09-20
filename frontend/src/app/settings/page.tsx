'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Key, 
  ShieldCheck, 
  Database, 
  Mail, 
  HardDrive, 
  RefreshCw,
  Cpu,
  Sparkles,
  Save,
  Zap,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { api, ConfiguredKeysResponse } from '@/lib/api';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [configuredKeys, setConfiguredKeys] = useState<ConfiguredKeysResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Key input states
  const [groqKey, setGroqKey] = useState('');
  const [geoapifyKey, setGeoapifyKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Visibility states
  const [showGroq, setShowGroq] = useState(false);
  const [showGeo, setShowGeo] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  // Action states
  const [savingKeys, setSavingKeys] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [healthData, keysData] = await Promise.all([
        api.getHealth().catch(() => ({ status: 'offline', features: {} })),
        api.getConfiguredKeys().catch(() => null)
      ]);
      setHealth(healthData);
      setConfiguredKeys(keysData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setActionMessage(null);

    const payload: any = {};
    if (groqKey.trim()) payload.groq_api_key = groqKey.trim();
    if (geoapifyKey.trim()) payload.geoapify_api_key = geoapifyKey.trim();
    if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
    if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();

    if (Object.keys(payload).length === 0) {
      setActionMessage({ type: 'info', text: 'Please enter at least one API key to update.' });
      setSavingKeys(false);
      return;
    }

    try {
      const res = await api.updateConfiguredKeys(payload);
      setActionMessage({ type: 'success', text: res.message });
      // Clear inputs
      setGroqKey('');
      setGeoapifyKey('');
      setOpenaiKey('');
      setGeminiKey('');
      fetchData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save API keys' });
    } finally {
      setSavingKeys(false);
    }
  };

  const handleTestKey = async (service: string, customKey?: string) => {
    setTestingService(service);
    setActionMessage(null);
    try {
      const res = await api.testApiKey(service, customKey?.trim() || undefined);
      if (res.success) {
        setActionMessage({ type: 'success', text: `✓ ${res.message}` });
      } else {
        setActionMessage({ type: 'error', text: `✗ ${res.message}` });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Test failed: ${err.message}` });
    } finally {
      setTestingService(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            System <span className="gradient-text">Settings & API Gateway</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Configure your own custom Groq, Geoapify, OpenAI, and Gemini credentials live at runtime.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13.5px',
          fontWeight: 500,
          background: actionMessage.type === 'success' ? 'rgba(16,185,129,0.15)' : actionMessage.type === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
          border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : actionMessage.type === 'error' ? '#f43f5e' : '#6366f1'}`,
          color: actionMessage.type === 'success' ? '#34d399' : actionMessage.type === 'error' ? '#fb7185' : '#818cf8',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Dynamic API Key Configuration Panel */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Key size={20} color="#818cf8" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Custom API Key Configuration</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          Add or update your API keys below. Changes take effect immediately across the crawling and AI scoring engine without needing to restart the server.
        </p>

        <form onSubmit={handleSaveKeys} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {/* Groq API Key */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={15} color="#818cf8" />
                <span>Groq API Key (Llama 3.3 / GPT-OSS)</span>
              </label>
              {configuredKeys?.groq?.configured ? (
                <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Active ({configuredKeys.groq.masked})
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#fb7185', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Unconfigured
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showGroq ? 'text' : 'password'}
                className="input"
                placeholder="Enter new Groq key (e.g. gsk_...)"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showGroq ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleTestKey('groq', groqKey)}
                disabled={testingService === 'groq'}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                <Zap size={13} color="#818cf8" />
                <span>{testingService === 'groq' ? 'Testing...' : 'Test Groq Connection'}</span>
              </button>
            </div>
          </div>

          {/* Geoapify API Key */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={15} color="#38bdf8" />
                <span>Geoapify Places API Key</span>
              </label>
              {configuredKeys?.geoapify?.configured ? (
                <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Active ({configuredKeys.geoapify.masked})
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#fb7185', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Unconfigured
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showGeo ? 'text' : 'password'}
                className="input"
                placeholder="Enter new Geoapify key..."
                value={geoapifyKey}
                onChange={(e) => setGeoapifyKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowGeo(!showGeo)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showGeo ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleTestKey('geoapify', geoapifyKey)}
                disabled={testingService === 'geoapify'}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                <Zap size={13} color="#38bdf8" />
                <span>{testingService === 'geoapify' ? 'Testing...' : 'Test Geoapify Connection'}</span>
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="#10b981" />
                <span>OpenAI API Key (GPT-4o)</span>
              </label>
              {configuredKeys?.openai?.configured ? (
                <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Active ({configuredKeys.openai.masked})
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#fb7185', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Unconfigured
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showOpenai ? 'text' : 'password'}
                className="input"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleTestKey('openai', openaiKey)}
                disabled={testingService === 'openai'}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                <Zap size={13} color="#10b981" />
                <span>{testingService === 'openai' ? 'Testing...' : 'Test OpenAI Connection'}</span>
              </button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={15} color="#fbbf24" />
                <span>Google Gemini API Key (1.5 Flash)</span>
              </label>
              {configuredKeys?.gemini?.configured ? (
                <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Active ({configuredKeys.gemini.masked})
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#fb7185', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Unconfigured
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showGemini ? 'text' : 'password'}
                className="input"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showGemini ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleTestKey('gemini', geminiKey)}
                disabled={testingService === 'gemini'}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                <Zap size={13} color="#fbbf24" />
                <span>{testingService === 'gemini' ? 'Testing...' : 'Test Gemini Connection'}</span>
              </button>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="submit"
              disabled={savingKeys}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              <Save size={16} />
              <span>{savingKeys ? 'Saving to Runtime...' : 'Save & Update API Keys'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backend & Database Status Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: health?.status === 'healthy' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
        background: health?.status === 'healthy' ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: health?.status === 'healthy' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'
          }}>
            <Database size={24} color={health?.status === 'healthy' ? '#10b981' : '#f43f5e'} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              LeadOS Core Server: {health?.status === 'healthy' ? 'Operational & Healthy' : 'Backend Disconnected'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Environment: <strong>{health?.environment || 'development'}</strong> • DB: PostgreSQL / Async SQLite Adaptive
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: health?.status === 'healthy' ? '#10b981' : '#f43f5e',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: health?.status === 'healthy' ? '#34d399' : '#fb7185' }}>
            {health?.status === 'healthy' ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}
