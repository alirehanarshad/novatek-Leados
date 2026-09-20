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
  Cpu
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
      setHealth({ status: 'offline', features: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = [
    {
      name: 'Geoapify Places Engine',
      description: 'Global business discovery & places geocoding API',
      active: health?.features?.geoapify,
      icon: Key,
      envVar: 'GEOAPIFY_API_KEY'
    },
    {
      name: 'Groq AI Gateway',
      description: 'Llama 3.3 70B ultra-fast qualification & cold copy generation',
      active: health?.features?.groq,
      icon: Cpu,
      envVar: 'GROQ_API_KEY'
    },
    {
      name: 'OpenAI Intelligence',
      description: 'GPT-4o & GPT-4o-mini lead scoring & analysis',
      active: health?.features?.openai,
      icon: Cpu,
      envVar: 'OPENAI_API_KEY'
    },
    {
      name: 'Google Gemini',
      description: 'Gemini 1.5 multimodal prospect evaluation',
      active: health?.features?.gemini,
      icon: Cpu,
      envVar: 'GEMINI_API_KEY'
    },
    {
      name: 'SMTP Outreach Mailer',
      description: 'Automated email dispatch for outbound sequences',
      active: health?.features?.smtp,
      icon: Mail,
      envVar: 'SMTP_HOST & SMTP_USER'
    },
    {
      name: 'S3-Compatible Object Storage',
      description: 'Dataset exports and lead attachment bucket',
      active: health?.features?.storage,
      icon: HardDrive,
      envVar: 'STORAGE_BUCKET'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            System <span className="gradient-text">Settings & Gateway</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Integration status and API credentials configured in <code style={{ color: '#818cf8' }}>.env</code>.
          </p>
        </div>
        <button onClick={fetchHealth} className="btn btn-secondary" style={{ gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Status</span>
        </button>
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

      {/* Services & Providers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {services.map((svc, i) => {
          const Icon = svc.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: svc.active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <Icon size={20} color={svc.active ? '#10b981' : '#94a3b8'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{svc.name}</h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '8px' }}>
                    {svc.description}
                  </p>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Env: {svc.envVar}
                  </span>
                </div>
              </div>

              <div>
                {svc.active ? (
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle2 size={12} />
                    <span>Configured</span>
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(244,63,94,0.1)',
                    color: '#fb7185',
                    border: '1px solid rgba(244,63,94,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <XCircle size={12} />
                    <span>Unset / Fallback</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Tip */}
      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#818cf8', marginBottom: '6px' }}>💡 Quick Configuration Tip</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          To activate live live Geoapify discovery, OpenAI, Gemini, or Groq AI models, add your API keys to <code style={{ color: '#ffffff' }}>d:\novascrape\.env</code> and restart the backend server. When API keys are unset, LeadOS automatically provides high-fidelity simulation modes so you can test all UI flows instantly.
        </p>
      </div>
    </div>
  );
}
