'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Cpu, 
  Mail, 
  User, 
  Building2, 
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { api, Lead } from '@/lib/api';

export default function AIOutreachLabPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Outreach parameters
  const [senderName, setSenderName] = useState('Alex Vance');
  const [senderCompany, setSenderCompany] = useState('Novatek Solutions');
  const [offerSummary, setOfferSummary] = useState('Autonomous outbound lead intelligence & high-intent B2B discovery');
  const [tone, setTone] = useState('conversational and value-driven');
  const [aiProvider, setAiProvider] = useState('groq');

  // Generated email draft state
  const [generating, setGenerating] = useState(false);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchQualifiedLeads = async () => {
      try {
        setLoadingLeads(true);
        const res = await api.getLeads({ page_size: 50, has_email: true });
        setLeads(res.items);
        if (res.items.length > 0) {
          setSelectedLeadId(res.items[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLeads(false);
      }
    };
    fetchQualifiedLeads();
  }, []);

  const currentLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = async () => {
    if (!currentLead) return;
    setGenerating(true);
    setStatusMsg(null);
    try {
      const res = await api.generateColdEmail({
        lead_id: currentLead.id,
        sender_name: senderName,
        sender_company: senderCompany,
        offer_summary: offerSummary,
        tone: tone,
        provider: aiProvider
      });
      setDraftSubject(res.subject);
      setDraftBody(res.body);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Generation error: ' + e.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!currentLead || !currentLead.email) {
      alert('Selected prospect does not have a valid email address.');
      return;
    }
    setSending(true);
    setStatusMsg(null);
    try {
      const res = await api.sendEmail({
        lead_id: currentLead.id,
        subject: draftSubject,
        body: draftBody,
        recipient_email: currentLead.email
      });
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: res.simulated ? '✓ Simulated delivery sent!' : '✓ Outreach successfully delivered via SMTP!'
        });
      } else {
        setStatusMsg({ type: 'error', text: 'Delivery failed: ' + res.error });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Error: ' + e.message });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${draftSubject}\n\n${draftBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          AI Outreach <span className="gradient-text">Lab</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Hyper-personalized multi-model email sequence generator powered by OpenAI, Gemini, and Groq.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '28px' }}>
        {/* Left Column: Lead Picker & Sender Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Target Prospect Selector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#818cf8" />
              <span>1. Choose Target Prospect</span>
            </h3>

            {loadingLeads ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading qualified leads...</div>
            ) : (
              <div>
                <select 
                  className="select" 
                  value={selectedLeadId || ''} 
                  onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city || 'Local'}) — {l.email || 'No email'} {l.icp_score ? `[Score: ${l.icp_score}]` : ''}
                    </option>
                  ))}
                </select>

                {currentLead && (
                  <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>{currentLead.name}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Category: {currentLead.category || 'Commercial'}</div>
                    <div style={{ color: '#38bdf8', marginTop: '4px' }}>Email: {currentLead.email || 'None'}</div>
                    {currentLead.ai_pain_points && (
                      <div style={{ color: '#fbbf24', marginTop: '6px' }}>
                        Pain point: {currentLead.ai_pain_points}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Persona & Value Proposition Config */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="#06b6d4" />
              <span>2. Value Proposition & Persona</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Your Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={senderName} 
                  onChange={(e) => setSenderName(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Your Organization</label>
                <input 
                  type="text" 
                  className="input" 
                  value={senderCompany} 
                  onChange={(e) => setSenderCompany(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Offer / Solution Pitch</label>
              <textarea 
                className="textarea" 
                rows={3}
                value={offerSummary} 
                onChange={(e) => setOfferSummary(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tone of Voice</label>
                <select className="select" value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option value="conversational and value-driven">Conversational & Value-driven</option>
                  <option value="direct and concise">Direct & Punchy</option>
                  <option value="consultative and analytical">Consultative & Analytical</option>
                  <option value="warm and friendly">Warm & Peer-to-Peer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>AI Provider</label>
                <select className="select" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                  <option value="groq">Groq (Llama-3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google Gemini 1.5</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={generating || !currentLead}
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
            >
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{generating ? 'Crafting Personalized Pitch...' : 'Generate Pitch with AI'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Cold Outreach Workbench */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Personalized Email Draft</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Review, edit, copy, or dispatch directly via SMTP</p>
            </div>
            {draftBody && (
              <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Subject Line</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Click 'Generate Pitch with AI' to craft an email..."
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Email Copy</label>
            <textarea 
              className="textarea" 
              rows={12}
              placeholder="Personalized body text tailored to prospect website and pain points will appear here..."
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              style={{ lineHeight: '1.6' }}
            />
          </div>

          {/* Status feedback */}
          {statusMsg && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              backgroundColor: statusMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color: statusMsg.type === 'success' ? '#34d399' : '#fb7185',
              border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#f43f5e'}`
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* Dispatch button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              onClick={handleSend}
              disabled={sending || !draftBody || !currentLead?.email}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '12px 24px' }}
            >
              <Send size={16} />
              <span>{sending ? 'Sending...' : 'Send Outreach Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
