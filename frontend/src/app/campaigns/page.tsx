'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Users, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { api, Campaign } from '@/lib/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCategory, setTargetCategory] = useState('healthcare.clinic');
  const [targetLocation, setTargetLocation] = useState('San Francisco, CA');
  const [icpDescription, setIcpDescription] = useState('High-intent local clinics with modern digital footprint.');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCampaign({
        name,
        description,
        target_category: targetCategory,
        target_location: targetLocation,
        icp_description: icpDescription,
        status: 'active'
      });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchCampaigns();
    } catch (e: any) {
      alert('Error creating campaign: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Target <span className="gradient-text">Campaigns</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Organize discovery sprints by industry, geo-cluster, and ICP persona.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading campaigns...</div>
        ) : campaigns.length > 0 ? (
          campaigns.map((camp) => (
            <div key={camp.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-qualified">{camp.status.toUpperCase()}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Created {new Date(camp.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{camp.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', minHeight: '40px' }}>
                  {camp.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} color="#f43f5e" />
                  <span>{camp.target_location || 'Global'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Layers size={14} color="#06b6d4" />
                  <span>{camp.target_category || 'All Categories'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <Users size={16} color="#818cf8" />
                  <span>{camp.lead_count} Leads Assigned</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No campaigns created yet. Click "New Campaign" to create your first outbound campaign.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', backgroundColor: '#0f172a' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '18px' }}>Create Target Campaign</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Campaign Name</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="e.g. Q4 FinTech NYC Expansion"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Description</label>
                <textarea 
                  className="textarea" 
                  rows={2} 
                  placeholder="Objectives and scope..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Target Location</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={targetLocation} 
                    onChange={(e) => setTargetLocation(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={targetCategory} 
                    onChange={(e) => setTargetCategory(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>ICP Criteria Prompt</label>
                <textarea 
                  className="textarea" 
                  rows={2} 
                  value={icpDescription} 
                  onChange={(e) => setIcpDescription(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
