'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  Globe, 
  Sparkles, 
  MapPin, 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Zap,
  PhoneCall,
  MailCheck,
  ShieldCheck
} from 'lucide-react';
import { api, ScrapeJob } from '@/lib/api';

const ICP_GROUPS = [
  {
    id: 'group_a',
    title: 'Group A — Local Consumer',
    desc: 'High customer booking & ordering needs',
    categories: [
      { id: 'catering.restaurant', label: 'Restaurants & Cafes', group: 'Food & Beverage' },
      { id: 'catering.fast_food', label: 'Takeaways & Bakeries', group: 'Food' },
      { id: 'service.beauty', label: 'Salons, Barbers & Spas', group: 'Personal Care' },
      { id: 'leisure.spa', label: 'Gyms & Fitness Studios', group: 'Fitness' },
    ]
  },
  {
    id: 'group_b',
    title: 'Group B — Local Service',
    desc: 'High lead value, urgent quote requests',
    categories: [
      { id: 'service.cleaning', label: 'Cleaning Companies', group: 'Home Service' },
      { id: 'service.plumber', label: 'Plumbers & HVAC', group: 'Trade Services' },
      { id: 'service.electrician', label: 'Electricians & Painters', group: 'Trade Services' },
      { id: 'service.auto_repair', label: 'Auto Repair & Detailing', group: 'Automotive' },
    ]
  },
  {
    id: 'group_c',
    title: 'Group C — Professional Small Business',
    desc: 'B2B & owner-led professional firms',
    categories: [
      { id: 'commercial.real_estate', label: 'Real Estate Agencies', group: 'Real Estate' },
      { id: 'service.financial', label: 'Accounting & Bookkeeping', group: 'Financial' },
      { id: 'commercial.architecture', label: 'Architecture & Design', group: 'Design' },
      { id: 'service.legal', label: 'Small Law & Legal Firms', group: 'Legal' },
    ]
  }
];

const PRIMARY_MARKETS = [
  { name: 'United Kingdom', city: 'Manchester', code: 'gb' },
  { name: 'United Kingdom', city: 'Birmingham', code: 'gb' },
  { name: 'United States', city: 'Austin', code: 'us' },
  { name: 'United States', city: 'Miami', code: 'us' },
  { name: 'Canada', city: 'Toronto', code: 'ca' },
  { name: 'Australia', city: 'Sydney', code: 'au' },
];

export default function ScraperStudioPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['catering.restaurant', 'service.beauty']);
  const [city, setCity] = useState('Manchester');
  const [countryCode, setCountryCode] = useState('gb');
  const [radiusKm, setRadiusKm] = useState(10);
  const [limit, setLimit] = useState(25);
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [autoQualify, setAutoQualify] = useState(true);
  const [requireContact, setRequireContact] = useState(true);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [aiProvider, setAiProvider] = useState('groq');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);

  const fetchJobs = async () => {
    try {
      const data = await api.getScrapeJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 6000);
    return () => clearInterval(interval);
  }, []);

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== catId));
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleLaunchScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Initializing Geoapify Places engine with Schema JSON-LD & contact crawlers...' });

    try {
      const res = await api.startGeoapifyScrape({
        categories: selectedCategories,
        city: city.trim(),
        country_code: countryCode.trim(),
        radius_meters: radiusKm * 1000,
        limit: limit,
        auto_enrich_websites: autoEnrich,
        auto_ai_qualify: autoQualify,
        require_contact: requireContact,
        require_website: requireWebsite,
        ai_provider: aiProvider
      });

      setStatusMessage({ 
        type: 'success', 
        text: `Pipeline Job #${res.id} running! Discarding leads without contact details and qualifying SMB fit.` 
      });
      fetchJobs();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Scrape failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          ICP <span className="gradient-text">Scraper Studio</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          High-accuracy lead discovery: autonomous Schema JSON-LD contact extraction, Cloudflare decoding, and reachability enforcement.
        </p>
      </div>

      {/* ICP Rule Banner */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} color="#818cf8" />
          <div style={{ fontSize: '13px', color: '#e0e7ff' }}>
            <strong>Active Rule: Novatek Small-Business ICP v1</strong> — 1-20 staff, 1-3 locations, auto-rejection of corporate chains (McDonalds, Starbucks, Aldi, banks).
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {PRIMARY_MARKETS.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setCity(m.city); setCountryCode(m.code); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              📍 {m.city} ({m.code.toUpperCase()})
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px' }}>
        {/* Scraper Control Panel */}
        <form onSubmit={handleLaunchScrape} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Target Categories Grouped */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              1. Target ICP Niches (Group A, B, C)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              {ICP_GROUPS.map((group) => (
                <div key={group.id} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px' }}>
                    {group.title} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— {group.desc}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {group.categories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                            border: isSelected ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            border: isSelected ? 'none' : '1px solid var(--text-muted)',
                            backgroundColor: isSelected ? '#6366f1' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <CheckCircle2 size={10} color="#ffffff" />}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                              {cat.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Targeting */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              2. Geography & Search Radius
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Target City / Metro</span>
                <input
                  type="text"
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Manchester, London, Austin"
                  required
                />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Country (ISO-2)</span>
                <input
                  type="text"
                  className="input"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="gb"
                  maxLength={2}
                />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Radius (km)</span>
                <input
                  type="number"
                  className="input"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Strict Accuracy Filters */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              3. Contact Reachability & Quality Filters
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '13px', 
                cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <input
                  type="checkbox"
                  checked={requireContact}
                  onChange={(e) => setRequireContact(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '17px', height: '17px' }}
                />
                <div>
                  <strong style={{ color: '#34d399' }}>Require Valid Phone or Email (Strict Outreach Filter):</strong>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Automatically skip businesses where no phone number or direct email can be extracted.
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '13px', 
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <input
                  type="checkbox"
                  checked={requireWebsite}
                  onChange={(e) => setRequireWebsite(e.target.checked)}
                  style={{ accentColor: '#6366f1', width: '17px', height: '17px' }}
                />
                <div>
                  <strong>Require Verified Website:</strong>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Only save businesses with an active, crawlable website domain.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Autonomous Processing Pipeline */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              4. Deep Crawling & AI Scoring
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoEnrich}
                  onChange={(e) => setAutoEnrich(e.target.checked)}
                  style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                />
                <span><strong>Deep Crawler (Schema JSON-LD + Cloudflare Decode):</strong> Crawls /contact, /impressum & de-obfuscates protected contacts.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoQualify}
                  onChange={(e) => setAutoQualify(e.target.checked)}
                  style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                />
                <span><strong>Groq ICP Qualification:</strong> Score (0-100) and map high-leverage single service pitch.</span>
              </label>
            </div>
          </div>

          {/* AI Model & Limit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>AI Provider Model</span>
              <select className="select" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                <option value="groq">Groq (Ultra-fast JSON)</option>
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (1.5 Flash)</option>
              </select>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Max Places Sampled</span>
              <select className="select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value={10}>10 Places (Quick test)</option>
                <option value={25}>25 Places</option>
                <option value={50}>50 Places (Standard)</option>
                <option value={100}>100 Places (Deep search)</option>
              </select>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.15)' : statusMessage.type === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
              border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : statusMessage.type === 'error' ? '#f43f5e' : '#6366f1'}`,
              color: statusMessage.type === 'success' ? '#34d399' : statusMessage.type === 'error' ? '#fb7185' : '#818cf8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '14px', fontSize: '15px' }}>
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            <span>{loading ? 'Launching Pipeline...' : 'Start Lead Discovery Run'}</span>
          </button>
        </form>

        {/* Live Scrape Jobs History */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#818cf8" />
              <span>Discovery Pipeline History</span>
            </h3>
            <button onClick={fetchJobs} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
              <RefreshCw size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '550px' }}>
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>
                      Job #{job.id} • {job.query_params?.city || 'Local Metro'}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: job.status === 'completed' ? 'rgba(16,185,129,0.2)' : job.status === 'running' ? 'rgba(6,182,212,0.2)' : 'rgba(245,158,11,0.2)',
                      color: job.status === 'completed' ? '#34d399' : job.status === 'running' ? '#38bdf8' : '#fbbf24'
                    }}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Sampled: <strong>{job.total_found}</strong> places | Saved: <strong>{job.total_processed}</strong> qualified leads
                  </div>

                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {new Date(job.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active jobs. Configure your criteria and launch your first scrape.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
