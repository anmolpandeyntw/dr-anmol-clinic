import { useState } from 'react';
import { useHonorsMedia } from '../../hooks/useHonorsMedia';
import type { MilestoneItem, GalleryItem } from '../../hooks/useHonorsMedia';
import { Button } from '../../components/common/Button';
import { FullPageLoader } from '../../components/common/LoadingSpinner';
import {
  Award,
  Plus,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  X
} from 'lucide-react';
import './AdminHonorsMediaPage.css';

export default function AdminHonorsMediaPage() {
  const {
    milestones,
    galleryItems,
    loading,
    saveMilestone,
    deleteMilestone,
    saveGalleryItem,
    deleteGalleryItem
  } = useHonorsMedia();

  const [activeMainTab, setActiveMainTab] = useState<'milestones' | 'gallery'>('gallery');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'awards' | 'lectures' | 'clinics' | 'dialysis'>('all');

  // Milestone Form Modal State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [mStat, setMStat] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mSub, setMSub] = useState('');
  const [mImgUrl, setMImgUrl] = useState('');

  // Gallery Item Form Modal State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [gCategory, setGCategory] = useState<'awards' | 'lectures' | 'clinics' | 'dialysis'>('awards');
  const [gTitle, setGTitle] = useState('');
  const [gLocation, setGLocation] = useState('');
  const [gYear, setGYear] = useState('2025');
  const [gImgUrl, setGImgUrl] = useState('');
  const [gCaption, setGCaption] = useState('');

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'milestone' | 'gallery'; id: string; title: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <FullPageLoader />;

  // Filter gallery items by selected category
  const filteredGallery = galleryItems.filter(
    item => activeCategoryFilter === 'all' || item.category === activeCategoryFilter
  );

  // Open Milestone Add/Edit Modal
  const handleOpenMilestoneModal = (item?: MilestoneItem) => {
    if (item) {
      setEditingMilestone(item);
      setMStat(item.stat);
      setMTitle(item.title);
      setMSub(item.sub);
      setMImgUrl(item.image_url);
    } else {
      setEditingMilestone(null);
      setMStat('GOLD MEDAL');
      setMTitle('');
      setMSub('');
      setMImgUrl('/images/gold_medal_badge.jpg');
    }
    setShowMilestoneModal(true);
  };

  // Open Gallery Add/Edit Modal
  const handleOpenGalleryModal = (item?: GalleryItem) => {
    if (item) {
      setEditingGallery(item);
      setGCategory(item.category);
      setGTitle(item.title);
      setGLocation(item.location);
      setGYear(item.year || '2025');
      setGImgUrl(item.imageUrl);
      setGCaption(item.caption);
    } else {
      setEditingGallery(null);
      setGCategory(activeCategoryFilter === 'all' ? 'awards' : activeCategoryFilter);
      setGTitle('');
      setGLocation('');
      setGYear(new Date().getFullYear().toString());
      setGImgUrl('/images/doctor_portrait.jpg');
      setGCaption('');
    }
    setShowGalleryModal(true);
  };

  // Handle local image file upload & convert to data URL for instant live preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isMilestone: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isMilestone) {
            setMImgUrl(reader.result);
          } else {
            setGImgUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Milestone submit handler
  const handleSaveMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) {
      alert('Please enter a title for this honor badge.');
      return;
    }

    setSaving(true);
    await saveMilestone({
      id: editingMilestone?.id,
      stat: mStat.trim() || 'HONOR BADGE',
      title: mTitle.trim(),
      sub: mSub.trim() || 'Academic & Clinical Distinction',
      image_url: mImgUrl || '/images/gold_medal_badge.jpg'
    });
    setSaving(false);
    setShowMilestoneModal(false);
  };

  // Save Gallery Item submit handler
  const handleSaveGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim()) {
      alert('Please enter a post title.');
      return;
    }

    setSaving(true);
    await saveGalleryItem({
      id: editingGallery?.id,
      category: gCategory,
      title: gTitle.trim(),
      location: gLocation.trim() || 'Lucknow Clinic',
      year: gYear.trim() || new Date().getFullYear().toString(),
      imageUrl: gImgUrl || '/images/doctor_portrait.jpg',
      caption: gCaption.trim() || gTitle.trim()
    });
    setSaving(false);
    setShowGalleryModal(false);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    if (deleteTarget.type === 'milestone') {
      await deleteMilestone(deleteTarget.id);
    } else {
      await deleteGalleryItem(deleteTarget.id);
    }
    setSaving(false);
    setDeleteTarget(null);
  };

  return (
    <div className="admin-honors-page">
      {/* Header Bar */}
      <div className="admin-honors-header">
        <div className="admin-honors-title-col">
          <div className="admin-honors-icon-badge">
            <Award size={26} />
          </div>
          <div>
            <h1>Honors & Media Control Panel</h1>
            <p>Manage medals, felicitation awards, guest lectures, OPD clinics & dialysis setup photos</p>
          </div>
        </div>

        <div className="admin-honors-action-row">
          <Button variant="outline" size="md" onClick={() => handleOpenMilestoneModal()}>
            <Plus size={16} /> Add Medal / Badge
          </Button>
          <Button variant="primary" size="md" onClick={() => handleOpenGalleryModal()}>
            <Plus size={16} /> Add Photo / Event Post
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="admin-honors-tabs">
        <button
          className={`admin-tab-btn ${activeMainTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('gallery')}
        >
          <ImageIcon size={18} />
          <span>Honors & Photo Gallery</span>
          <span className="admin-tab-count">{galleryItems.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeMainTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('milestones')}
        >
          <ShieldCheck size={18} />
          <span>Medals & Standing Badges</span>
          <span className="admin-tab-count">{milestones.length}</span>
        </button>
      </div>

      {/* TAB 1: Photo Gallery & Media Management */}
      {activeMainTab === 'gallery' && (
        <div className="admin-gallery-section">
          {/* Category Filter Chips */}
          <div className="gallery-filter-strip">
            <button
              className={`filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('all')}
            >
              All Photos ({galleryItems.length})
            </button>
            <button
              className={`filter-chip ${activeCategoryFilter === 'awards' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('awards')}
            >
              Awards & Felicitations ({galleryItems.filter(g => g.category === 'awards').length})
            </button>
            <button
              className={`filter-chip ${activeCategoryFilter === 'lectures' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('lectures')}
            >
              Guest Lectures ({galleryItems.filter(g => g.category === 'lectures').length})
            </button>
            <button
              className={`filter-chip ${activeCategoryFilter === 'clinics' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('clinics')}
            >
              OPD Clinics ({galleryItems.filter(g => g.category === 'clinics').length})
            </button>
            <button
              className={`filter-chip ${activeCategoryFilter === 'dialysis' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('dialysis')}
            >
              Dialysis Setup ({galleryItems.filter(g => g.category === 'dialysis').length})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="gallery-admin-grid">
            {filteredGallery.map((item) => (
              <div key={item.id} className="gallery-admin-card">
                <div className="g-admin-img-box">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="g-admin-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
                    }}
                  />
                  <span className="g-admin-cat-badge">{item.category}</span>
                  <span className="g-admin-year-badge">{item.year}</span>
                </div>

                <div className="g-admin-body">
                  <h3 className="g-admin-title">{item.title}</h3>
                  <p className="g-admin-loc"><MapPin size={12} /> {item.location}</p>
                  <p className="g-admin-caption">{item.caption}</p>
                </div>

                <div className="g-admin-footer">
                  <button
                    type="button"
                    className="card-action-btn card-action-btn--edit"
                    onClick={() => handleOpenGalleryModal(item)}
                  >
                    <Edit size={14} /> Edit Post
                  </button>
                  <button
                    type="button"
                    className="card-action-btn card-action-btn--delete"
                    onClick={() => setDeleteTarget({ type: 'gallery', id: item.id, title: item.title })}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Medals & Standing Badges Management */}
      {activeMainTab === 'milestones' && (
        <div className="milestones-admin-grid">
          {milestones.map((item) => (
            <div key={item.id} className="milestone-admin-card">
              <div className="m-admin-seal">
                <img
                  src={item.image_url}
                  alt={item.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/gold_medal_badge.jpg';
                  }}
                />
              </div>

              <div className="m-admin-content">
                <span className="m-admin-stat">{item.stat}</span>
                <h3 className="m-admin-title">{item.title}</h3>
                <p className="m-admin-sub">{item.sub}</p>
              </div>

              <div className="admin-card-actions">
                <button
                  type="button"
                  className="card-action-btn card-action-btn--edit"
                  onClick={() => handleOpenMilestoneModal(item)}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  type="button"
                  className="card-action-btn card-action-btn--delete"
                  onClick={() => setDeleteTarget({ type: 'milestone', id: item.id, title: item.title })}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Add / Edit Milestone Medal */}
      {showMilestoneModal && (
        <div className="modal-backdrop" onClick={() => setShowMilestoneModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Award size={20} /> {editingMilestone ? 'Edit Medal / Badge' : 'Add New Medal / Badge'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowMilestoneModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveMilestoneSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Badge Header / Tag (e.g., GOLD MEDAL, ISN HONOR)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. GOLD MEDAL"
                    value={mStat}
                    onChange={(e) => setMStat(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Honor Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. DNB Nephrology Academic Standing"
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Institution / Subtitle</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. RML Institute of Medical Sciences"
                    value={mSub}
                    onChange={(e) => setMSub(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Medal / Badge Image (URL or Select File)</label>
                  <div className="file-upload-row">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Paste Image URL or select file"
                      value={mImgUrl}
                      onChange={(e) => setMImgUrl(e.target.value)}
                    />
                    <label className="file-upload-btn">
                      <Upload size={14} /> Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                      />
                    </label>
                  </div>

                  <div className="img-preview-box">
                    {mImgUrl ? (
                      <>
                        <img
                          src={mImgUrl}
                          alt="Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/gold_medal_badge.jpg';
                          }}
                        />
                        <button
                          type="button"
                          className="remove-img-btn"
                          title="Remove Image"
                          onClick={() => setMImgUrl('')}
                        >
                          <X size={14} /> Remove Image
                        </button>
                      </>
                    ) : (
                      <div className="img-preview-placeholder">
                        <ImageIcon size={24} />
                        <span>No Image Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setShowMilestoneModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={saving}>
                  {editingMilestone ? 'Save Changes' : 'Create Badge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Gallery Post */}
      {showGalleryModal && (
        <div className="modal-backdrop" onClick={() => setShowGalleryModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><ImageIcon size={20} /> {editingGallery ? 'Edit Gallery Photo Post' : 'Add New Photo / Event Post'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowGalleryModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveGallerySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Category</label>
                  <select
                    className="form-control"
                    value={gCategory}
                    onChange={(e) => setGCategory(e.target.value as GalleryItem['category'])}
                  >
                    <option value="awards">Awards & Felicitations</option>
                    <option value="lectures">Guest Lectures</option>
                    <option value="clinics">OPD Clinics</option>
                    <option value="dialysis">Dialysis Setup</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Post / Event Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Guest Lecture on Living Donor Renal Transplant Protocols"
                    value={gTitle}
                    onChange={(e) => setGTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location / Venue</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. RML Institute of Medical Sciences, Lucknow"
                    value={gLocation}
                    onChange={(e) => setGLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Event Details / Story (20-50 words)</label>
                  <textarea
                    className="form-control"
                    placeholder="Write 20-50 words about what happened, honor details, lecture summary, or OPD clinic updates..."
                    value={gCaption}
                    onChange={(e) => setGCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 2025"
                    value={gYear}
                    onChange={(e) => setGYear(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Photo Image (Paste URL or Upload File)</label>
                  <div className="file-upload-row">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Paste Image URL or choose file below"
                      value={gImgUrl}
                      onChange={(e) => setGImgUrl(e.target.value)}
                    />
                    <label className="file-upload-btn">
                      <Upload size={14} /> Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                      />
                    </label>
                  </div>

                  <div className="img-preview-box">
                    {gImgUrl ? (
                      <>
                        <img
                          src={gImgUrl}
                          alt="Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
                          }}
                        />
                        <button
                          type="button"
                          className="remove-img-btn"
                          title="Remove Image"
                          onClick={() => setGImgUrl('')}
                        >
                          <X size={14} /> Remove Image
                        </button>
                      </>
                    ) : (
                      <div className="img-preview-placeholder">
                        <ImageIcon size={24} />
                        <span>No Image Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setShowGalleryModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={saving}>
                  {editingGallery ? 'Save Changes' : 'Publish Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#DC2626' }}>
              <h2><AlertTriangle size={20} /> Delete Confirmation</h2>
              <button type="button" className="modal-close-btn" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-primary)' }}>
                Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
                This action will remove it permanently from the website.
              </p>
            </div>

            <div className="modal-footer">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleConfirmDelete}
                loading={saving}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
