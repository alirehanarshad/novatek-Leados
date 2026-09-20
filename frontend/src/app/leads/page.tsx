'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Sparkles, 
  Globe, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ExternalLink,
  MapPin,
  Briefcase,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { api, Lead } from '@/lib/api';
import LeadDrawer from '@/components/LeadDrawer';

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [minIcp, setMinIcp] = useState<number | ''>('');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: 25,
        search: search.trim() || undefined,
        status: status || undefined,
        city: city.trim() || undefined,
        min_icp_score: minIcp !== '' ? minIcp : undefined,
        has_email: hasEmail ? true : undefined,
        has_phone: hasPhone ? true : undefined,
      };
      const res = await api.getLeads(params);
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status, hasEmail, hasPhone]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchQualify = async () => {
    if (selectedIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      await api.qualifyLeads(selectedIds, undefined, 'groq');
      fetchLeads();
      setSelectedIds([]);
    } catch (e: any) {
      alert('Error in batch qualify: ' + e.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchCrawl = async () => {
    if (selectedIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      await api.crawlLeads(selectedIds);
      fetchLeads();
      setSelectedIds([]);
    } catch (e: any) {
      alert('Error in batch crawl: ' + e.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleCleanupUnreachable = async () => {
    if (!confirm('This will purge all leads that have neither an email address nor a phone number. Continue?')) return;
    try {
      const res = await api.cleanupUnreachableLeads();
      alert(res.message);
      fetchLeads();
    } catch (e: any) {
      alert('Cleanup failed: ' + e.message);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
    window.open(`${backendUrl}/leads/export?format=${format}`, '_blank');
  };

  const handleLeadUpdate = (updated: Lead) => {
    setActiveLead(updated);
    setLeads(leads.map(l => l.id === updated.id ? updated : l));
  };

  const getGoogleMapsUrl = (lead: Lead) => {
    if (lead.google_maps_url) return lead.google_maps_url;
    if (lead.latitude && lead.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`;
    }
    const query = [lead.name, lead.address, lead.city, lead.country].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Lead <span className="gradient-text">CRM Grid</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage {total} verified prospects with direct contact channels, instant Google Maps pins, and single-service pitches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleCleanupUnreachable} 
            className="btn btn-secondary"
            title="Remove leads without phone and without email"
            style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            <Trash2 size={15} />
            <span>Purge No-Contacts</span>
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => handleExport('xlsx')} className="btn btn-secondary">
            <Download size={15} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto auto auto', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search company, email, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="discovered">Discovered</option>
              <option value="enriched">Enriched</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              className="input"
              placeholder="Filter City..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <input
              type="number"
              className="input"
              placeholder="Min ICP (0-100)"
              value={minIcp}
              onChange={(e) => setMinIcp(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={hasEmail}
              onChange={(e) => setHasEmail(e.target.checked)}
              style={{ accentColor: '#6366f1' }}
            />
            <span>Has Email</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={hasPhone}
              onChange={(e) => setHasPhone(e.target.checked)}
              style={{ accentColor: '#10b981' }}
            />
            <span>Has Phone</span>
          </label>

          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 16px' }}>
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Batch Actions Bar (shown when leads are selected) */}
      {selectedIds.length > 0 && (
        <div className="glass-panel" style={{
          padding: '12px 20px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid #6366f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {selectedIds.length} lead(s) selected
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleBatchQualify} 
              disabled={batchActionLoading}
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={14} />
              <span>{batchActionLoading ? 'Evaluating...' : 'Batch AI Qualify'}</span>
            </button>
            <button 
              onClick={handleBatchCrawl} 
              disabled={batchActionLoading}
              className="btn btn-secondary btn-sm"
            >
              <Globe size={14} />
              <span>{batchActionLoading ? 'Crawling...' : 'Deep Website Crawl'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="glass-panel table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === leads.length && leads.length > 0}
                  onChange={toggleSelectAll}
                  style={{ accentColor: '#6366f1' }}
                />
              </th>
              <th>Company / Business</th>
              <th>Location & Map</th>
              <th>Direct Email</th>
              <th>Phone</th>
              <th>Website</th>
              <th>ICP & Tier</th>
              <th>Recommended Service</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading lead data...</div>
                </td>
              </tr>
            ) : leads.length > 0 ? (
              leads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                const mapsUrl = getGoogleMapsUrl(lead);
                return (
                  <tr key={lead.id} style={{ background: isSelected ? 'rgba(99, 102, 241, 0.1)' : undefined }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.id)}
                        style={{ accentColor: '#6366f1' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveLead(lead)}>
                      <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{lead.name}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.category || 'Local Business'}</div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{lead.city || lead.country || '—'}</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Real Location on Google Maps"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin size={11} />
                          <span>Map</span>
                        </a>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {lead.email ? (
                        <span style={{ color: '#38bdf8', fontWeight: 500 }}>{lead.email}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {lead.phone ? (
                        <span style={{ color: '#34d399', fontWeight: 500 }}>{lead.phone}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {lead.website ? (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          <span>Visit</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                        {lead.icp_score !== null && lead.icp_score !== undefined ? (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: lead.icp_score >= 80 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: lead.icp_score >= 80 ? '#34d399' : '#fbbf24'
                          }}>
                            {lead.icp_score}/100
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unranked</span>
                        )}
                        {lead.smb_tier && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: lead.smb_tier === 'MICRO' ? 'rgba(129,140,248,0.2)' : 'rgba(56,189,248,0.2)',
                            color: lead.smb_tier === 'MICRO' ? '#a5b4fc' : '#7dd3fc',
                            letterSpacing: '0.3px'
                          }}>
                            {lead.smb_tier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {lead.recommended_service ? (
                        <span style={{
                          fontSize: '11.5px',
                          color: '#e0e7ff',
                          background: 'rgba(99, 102, 241, 0.18)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={lead.recommended_service}>
                          {lead.recommended_service}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => setActiveLead(lead)} 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No leads found matching your criteria. Try adjusting your search or launch a new discovery run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing page {page} of {totalPages} ({total} total leads)
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page <= 1}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page >= totalPages}
            className="btn btn-secondary btn-sm"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <LeadDrawer 
        lead={activeLead} 
        onClose={() => setActiveLead(null)} 
        onUpdate={handleLeadUpdate} 
      />
    </div>
  );
}
