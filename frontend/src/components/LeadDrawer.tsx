'use client';

import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Star, 
  Linkedin,
  Building2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { Lead, api } from '@/lib/api';

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
}

export default function LeadDrawer({ lead, onClose, onUpdate }: LeadDrawerProps) {
  const [qualifying, setQualifying] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  // Email state
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [aiProvider, setAiProvider] = useState('groq');
  const [offerSummary, setOfferSummary] = useState('AI outbound workflow & high-intent lead generation');
  const [statusMessage, setStatusMessage] = useState('');

  if (!lead) return null;

  const handleQualify = async () => {
    setQualifying(true);
    try {
      const res = await api.qualifyLeads([lead.id], undefined, aiProvider);
      if (res.results && res.results.length > 0) {
        const item = res.results[0];
        const updated = {
          ...lead,
          icp_score: item.icp_score,
          ai_qualification_summary: item.summary,
          ai_pain_points: item.pain_points,
          ai_value_prop: item.value_prop,
          ai_provider_used: aiProvider,
          status: item.icp_score >= 70 ? 'qualified' : lead.status
        };
        onUpdate(updated);
      }
    } catch (e: any) {
      alert('Error qualifying lead: ' + e.message);
    } finally {
      setQualifying(false);
    }
  };

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    setStatusMessage('');
    try {
      const res = await api.generateColdEmail({
        lead_id: lead.id,
        sender_name: 'Alex Vance',
        sender_company: 'Novatek Solutions',
        offer_summary: offerSummary,
        tone: 'conversational and value-driven',
        provider: aiProvider
      });
      setSubject(res.subject);
      setEmailBody(res.body);
    } catch (e: any) {
      alert('Error generating email: ' + e.message);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!lead.email) {
      alert('This lead does not have an email address.');
      return;
    }
    setSendingEmail(true);
    setStatusMessage('');
    try {
      const res = await api.sendEmail({
        lead_id: lead.id,
        subject: subject,
        body: emailBody,
        recipient_email: lead.email
      });
      if (res.success) {
        setStatusMessage(res.simulated ? '✓ Simulated delivery successful' : '✓ Email delivered via SMTP');
        onUpdate({ ...lead, status: 'contacted' });
      } else {
        setStatusMessage('✕ Delivery error: ' + res.error);
      }
    } catch (e: any) {
      setStatusMessage('✕ Error: ' + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        height: '100vh',
        backgroundColor: '#0c1222',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.8)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${lead.status}`}>{lead.status.toUpperCase()}</span>
              {lead.smb_tier && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid #818cf8'
                }}>
                  {lead.smb_tier} (1-20 EMP)
                </span>
              )}
              {lead.icp_score !== undefined && lead.icp_score !== null && (
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: lead.icp_score >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: lead.icp_score >= 70 ? '#34d399' : '#fbbf24',
                  border: '1px solid currentColor'
                }}>
                  SMB FIT: {lead.icp_score}/100
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{lead.name}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Building2 size={14} />
              <span>{lead.category || 'Local Business'}</span>
              {lead.city && <span>• {lead.city}, {lead.country || 'USA'}</span>}
            </div>

            {/* Recommended High-Leverage Service */}
            {lead.recommended_service && (
              <div style={{
                marginTop: '10px',
                padding: '6px 10px',
                background: 'rgba(6, 182, 212, 0.15)',
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '12px',
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600
              }}>
                <Sparkles size={13} />
                <span>Recommended Service: {lead.recommended_service}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Google Maps Button */}
            <a 
              href={lead.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + (lead.address || ''))}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                textDecoration: 'none'
              }}
            >
              <MapPin size={14} />
              <span>Google Maps</span>
            </a>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contact Details Grid */}
          <div className="glass-panel" style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Mail size={16} color="#818cf8" />
              <span style={{ color: lead.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {lead.email || 'No email found'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Phone size={16} color="#34d399" />
              <span style={{ color: lead.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {lead.phone || 'No phone'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Globe size={16} color="#38bdf8" />
              {lead.website ? (
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                  {lead.website.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No website</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <MapPin size={16} color="#f43f5e" />
              <a 
                href={lead.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + (lead.address || ''))}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#f87171', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {lead.address || 'Open in Google Maps'}
              </a>
            </div>
          </div>

          {/* Scraped Website Insights */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} color="#38bdf8" />
                <span>Web Intelligence & Scraped Bio</span>
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {lead.crawl_status}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {lead.scraped_meta_desc || lead.scraped_body_snippet || 'No website content extracted yet.'}
            </p>
          </div>

          {/* AI Qualification Panel */}
          <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#818cf8" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>AI Lead Qualification & Scoring</h3>
              </div>
              <button 
                onClick={handleQualify} 
                disabled={qualifying}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                {qualifying ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} color="#818cf8" />}
                <span>{qualifying ? 'Scoring...' : 'Run AI Score'}</span>
              </button>
            </div>

            {lead.ai_qualification_summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Qualification Summary</div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{lead.ai_qualification_summary}</div>
                </div>
                {lead.ai_pain_points && (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Detected Pain Points</div>
                    <div style={{ color: '#fbbf24', lineHeight: '1.5' }}>{lead.ai_pain_points}</div>
                  </div>
                )}
                {lead.ai_value_prop && (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Target Value Pitch</div>
                    <div style={{ color: '#34d399', lineHeight: '1.5' }}>{lead.ai_value_prop}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                Click "Run AI Score" to evaluate this prospect against your target ICP.
              </div>
            )}
          </div>

          {/* AI Cold Email Generator & Dispatcher */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Personalized Cold Outreach</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={aiProvider} 
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="select" 
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                >
                  <option value="groq">Groq (Llama-3.3)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <button 
                  onClick={handleGenerateEmail} 
                  disabled={generatingEmail}
                  className="btn btn-primary btn-sm"
                >
                  {generatingEmail ? 'Generating...' : 'Generate Pitch'}
                </button>
              </div>
            </div>

            {/* Email draft inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Subject Line</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Subject line will appear here..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Personalized Body Draft</label>
                <textarea 
                  className="textarea" 
                  rows={6}
                  placeholder="AI-generated personalized email copy will be populated here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  {statusMessage && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: statusMessage.startsWith('✓') ? '#34d399' : '#f43f5e' }}>
                      {statusMessage}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {emailBody && (
                    <button onClick={handleCopyEmail} className="btn btn-secondary btn-sm">
                      {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                  <button 
                    onClick={handleSendEmail} 
                    disabled={sendingEmail || !emailBody || !lead.email}
                    className="btn btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    <Send size={14} />
                    <span>{sendingEmail ? 'Dispatching...' : 'Send via SMTP'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
