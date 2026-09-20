'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Sparkles, 
  Mail, 
  TrendingUp, 
  ArrowUpRight, 
  Compass, 
  Globe, 
  CheckCircle2, 
  Building2,
  ChevronRight,
  Flame
} from 'lucide-react';
import { api, DashboardStats, Lead } from '@/lib/api';
import LeadDrawer from '@/components/LeadDrawer';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLeadUpdate = (updated: Lead) => {
    setSelectedLead(updated);
    if (stats) {
      setStats({
        ...stats,
        recent_leads: stats.recent_leads.map(l => l.id === updated.id ? updated : l)
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Pipeline <span className="gradient-text">Command Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Autonomous discovery, deep website crawling & multi-LLM qualification pipeline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/scrape" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Compass size={16} />
            <span>Launch Discovery</span>
          </Link>
          <Link href="/leads" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <Users size={16} />
            <span>View All Leads</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Card 1 */}
        <div className="glass-panel kpi-tile-3d" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Leads</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)' }}>
              <Users size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {loading ? '...' : stats?.kpis.total_leads || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} />
            <span>Geoapify places connected</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel kpi-tile-3d" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Enriched Contact Info</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)' }}>
              <Globe size={18} color="#06b6d4" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {loading ? '...' : `${stats?.kpis.leads_with_email || 0}`}
          </div>
          <div style={{ fontSize: '12px', color: '#06b6d4' }}>
            {loading ? '...' : `${stats?.kpis.enrichment_rate}% direct email match rate`}
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel kpi-tile-3d" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Qualified Prospects (AI)</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <Sparkles size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {loading ? '...' : stats?.kpis.qualified_leads || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>
            {loading ? '...' : `${stats?.kpis.qualification_rate}% scored 70+ ICP rating`}
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel kpi-tile-3d" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Outreach Dispatched</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)' }}>
              <Mail size={18} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {loading ? '...' : stats?.kpis.total_outreaches || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#a78bfa' }}>
            <span>SMTP automated engine</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions & Pipeline Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent High-Intent Leads */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>High-Priority Prospects</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Recently discovered & qualified enterprise accounts</p>
            </div>
            <Link href="/leads" style={{ fontSize: '13px', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>ICP Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_leads && stats.recent_leads.length > 0 ? (
                  stats.recent_leads.map((lead) => (
                    <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{lead.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.city || 'Local Market'}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lead.category?.replace('commercial.', '').replace('healthcare.', '') || 'Business'}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <div style={{ color: lead.email ? '#38bdf8' : 'var(--text-muted)' }}>
                          {lead.email || 'No email'}
                        </div>
                      </td>
                      <td>
                        {lead.icp_score ? (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: lead.icp_score >= 80 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: lead.icp_score >= 80 ? '#34d399' : '#fbbf24'
                          }}>
                            {lead.icp_score}/100
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unscored</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${lead.status}`}>
                          {lead.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No leads discovered yet. Click "Launch Discovery" to start scraping.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories & Pipeline Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Industry Distribution */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f59e0b" />
              <span>Target Sectors</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.category_breakdown && stats.category_breakdown.length > 0 ? (
                stats.category_breakdown.map((cat, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {cat.category.replace('commercial.', '').replace('healthcare.', '').replace('catering.', '')}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{cat.count} leads</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (cat.count / (stats.kpis.total_leads || 1)) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No category data yet.</div>
              )}
            </div>
          </div>

          {/* Quick Launch Box */}
          <div className="glass-panel" style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Autonomous Prospecting</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Set location, industry, and prompt criteria to let LeadOS scrape and qualify targets in parallel.
            </p>
            <Link href="/scrape" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              <Compass size={16} />
              <span>Open Scraper Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide-over lead details drawer */}
      <LeadDrawer 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdate={handleLeadUpdate} 
      />
    </div>
  );
}
