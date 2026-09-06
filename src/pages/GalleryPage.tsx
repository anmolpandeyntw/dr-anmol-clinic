import { useState } from 'react';
import { useDoctor } from '../hooks/useDoctor';
import { Card } from '../components/common/Card';
import { FullPageLoader } from '../components/common/LoadingSpinner';
import { Award, Image as ImageIcon, MapPin, ShieldCheck } from 'lucide-react';
import './GalleryPage.css';

interface GalleryItem {
  id: string;
  category: 'awards' | 'lectures' | 'clinics' | 'dialysis';
  title: string;
  location: string;
  imageUrl: string;
  caption: string;
  year: string;
}

export default function GalleryPage() {
  const { doctor, loading } = useDoctor();
  const [activeTab, setActiveTab] = useState<'all' | 'awards' | 'lectures' | 'clinics' | 'dialysis'>('all');
  const [lightboxImg, setLightboxImg] = useState<GalleryItem | null>(null);

  if (loading) return <FullPageLoader />;

  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  const milestones = [
    {
      stat: 'GOLD MEDAL',
      title: 'DNB Nephrology Academic Standing',
      sub: 'Dr. RML Institute of Medical Sciences, Lucknow',
      imgUrl: '/images/gold_medal_badge.jpg'
    },
    {
      stat: 'ISN HONOR',
      title: 'ISN Research Excellence Award',
      sub: 'Indian Society of Nephrology (ISNCON Conference)',
      imgUrl: '/images/isn_award_badge.jpg'
    },
    {
      stat: 'NABH CERTIFIED',
      title: 'NABH Quality Healthcare Standards',
      sub: 'Certified OPD & Dialysis Care Protocol',
      imgUrl: '/images/nabh_accredited_badge.jpg'
    }
  ];

  const galleryItems: GalleryItem[] = [
    {
      id: 'g-01',
      category: 'lectures',
      title: 'Guest Lecture on Living Donor Renal Transplant Protocols',
      location: 'Dr. RML Institute of Medical Sciences, Lucknow',
      year: '2025',
      imageUrl: '/images/anmol_lecture.jpg',
      caption: `${doctorName} in formal suit delivering an interactive keynote guest lecture at the International Medical Conference.`
    },
    {
      id: 'g-02',
      category: 'awards',
      title: 'Felicitation & Medical Association Honor',
      location: 'Lucknow Medical Association Convention',
      year: '2024',
      imageUrl: '/images/anmol_award.jpg',
      caption: `${doctorName} honored for clinical contributions in kidney disease management and renal transplant medicine.`
    },
    {
      id: 'g-03',
      category: 'clinics',
      title: `${doctorName} Clinical Visit & Site Inspection`,
      location: 'Vibhuti Khand, Gomti Nagar, Lucknow',
      year: '2025',
      imageUrl: '/images/anmol_real_original.jpg',
      caption: `${doctorName} during clinic site visits and patient facility inspections.`
    }
  ];

  const filteredItems = galleryItems.filter(item => activeTab === 'all' || item.category === activeTab);

  return (
    <div className="gallery-page">
      {/* Hero Header */}
      <section className="gallery-hero">
        <div className="container">
          <span className="gallery-pill-badge">
            <Award size={16} /> HONORS, MEDIA & CLINICAL MOMENTS
          </span>
          <h1>Honors, Awards & Guest Lectures</h1>
          <p>
            Academic felicitations, guest lectures, national conference presentations, and clinical milestones of {doctorName}.
          </p>
        </div>
      </section>

      <div className="container gallery-content">
        {/* Section 1: Clinical Milestones & Awards Banner */}
        <section className="milestones-section">
          <div className="milestones-header">
            <ShieldCheck size={26} className="m-shield-icon" />
            <div>
              <h2>Clinical Milestones & Academic Standing</h2>
              <p>Peer-verified medical achievements, high transplant success rates, and medical council registrations</p>
            </div>
          </div>

          <div className="milestones-grid">
            {milestones.map((m, idx) => (
              <div key={idx} className="milestone-card">
                <div className="m-card-seal-wrapper">
                  <img src={m.imgUrl} alt={m.title} className="m-card-seal-img" />
                </div>
                <div className="m-card-body">
                  <span className="m-stat">{m.stat}</span>
                  <h3 className="m-title">{m.title}</h3>
                  <p className="m-sub">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Interactive Photo Gallery */}
        <section className="gallery-section">
          <div className="gallery-header-row">
            <h2>Honors & Photo Gallery ({filteredItems.length})</h2>

            {/* Category Filter Tabs */}
            <div className="gallery-tabs">
              <button className={`g-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                All Photos
              </button>
              <button className={`g-tab ${activeTab === 'awards' ? 'active' : ''}`} onClick={() => setActiveTab('awards')}>
                Awards & Felicitations
              </button>
              <button className={`g-tab ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>
                Guest Lectures
              </button>
              <button className={`g-tab ${activeTab === 'clinics' ? 'active' : ''}`} onClick={() => setActiveTab('clinics')}>
                OPD Clinics
              </button>
              <button className={`g-tab ${activeTab === 'dialysis' ? 'active' : ''}`} onClick={() => setActiveTab('dialysis')}>
                Dialysis Setup
              </button>
            </div>
          </div>

          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <Card key={item.id} className="gallery-card" onClick={() => setLightboxImg(item)}>
                <div className="gallery-img-wrapper">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="gallery-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
                    }}
                  />
                  <div className="gallery-img-overlay">
                    <ImageIcon size={24} className="zoom-icon" />
                    <span>View Photo</span>
                  </div>
                  <span className="g-year-badge">{item.year}</span>
                </div>

                <div className="gallery-card-body">
                  <h3 className="g-item-title">{item.title}</h3>
                  <p className="g-item-loc"><MapPin size={12} /> {item.location}</p>
                  <p className="g-item-caption">{item.caption}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
            <img
              src={lightboxImg.imageUrl}
              alt={lightboxImg.title}
              className="lightbox-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
              }}
            />
            <div className="lightbox-caption">
              <div className="lb-header">
                <h3>{lightboxImg.title}</h3>
                <span className="lb-year">{lightboxImg.year}</span>
              </div>
              <p className="lb-loc"><MapPin size={13} /> {lightboxImg.location}</p>
              <p className="lb-cap">{lightboxImg.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
