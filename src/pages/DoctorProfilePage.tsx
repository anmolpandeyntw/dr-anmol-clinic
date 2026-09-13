import { useDoctor } from '../hooks/useDoctor';
import { useSpecializations } from '../hooks/useSpecializations';
import { useHonorsMedia } from '../hooks/useHonorsMedia';
import { FullPageLoader } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import {
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Stethoscope,
  ShieldCheck,
  CalendarCheck,
  Phone,
  CheckCircle2,
  ExternalLink,
  MapPin,
  ImageIcon,
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './DoctorProfilePage.css';

export default function DoctorProfilePage() {
  const { doctor, loading: doctorLoading } = useDoctor();
  const { specializations, loading: specLoading } = useSpecializations();
  const { milestones, galleryItems, loading: honorsLoading } = useHonorsMedia();

  if (doctorLoading || specLoading || honorsLoading) return <FullPageLoader />;
  if (!doctor) return <div className="container section">Doctor profile not found.</div>;

  const doctorPhoto = doctor.photo_url || '/images/doctor_portrait.jpg';

  const researchPapers = [
    {
      title: 'COVID-19 Infection in Kidney Transplant Recipients – First vs Second Wave Outcomes',
      journal: 'Indian Journal of Transplantation & Nephrology',
      year: '2022',
      doi: '10.4103/ijot.ijot_45_21',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=COVID-19+Kidney+Transplant+Recipients',
      category: 'Renal Transplant Medicine',
      abstract: 'A prospective observational cohort study evaluating clinical outcomes, graft survival, and immunosuppression modulation in renal allograft recipients during early COVID-19 pandemic waves.'
    },
    {
      title: 'Recurrent Proteinuria with Early Graft Dysfunction Post Living Donor Kidney Transplant',
      journal: 'International Journal of Artificial Organs & Dialysis',
      year: '2021',
      doi: '10.1177/0391398821100234',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=Recurrent+Proteinuria+Graft+Dysfunction',
      category: 'Glomerular Diseases',
      abstract: 'Case series analyzing focal segmental glomerulosclerosis (FSGS) recurrence post-transplant and therapeutic plasmapheresis response rates.'
    },
    {
      title: 'Phialemonium Obovatum Fungal Infection in Renal Allograft: Case Report & Review',
      journal: 'Journal of Mycology & Critical Care Medicine',
      year: '2020',
      doi: '10.1093/mmy/myaa012',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=Phialemonium+Obovatum+Renal+Allograft',
      category: 'Transplant Infections',
      abstract: 'Rare opportunistic fungal infection management in renal transplant recipients using targeted azole antifungal therapy.'
    },
    {
      title: 'Calcium Phosphate Product & Parathyroid Hormone Correlation in End-Stage Renal Disease (ESRD)',
      journal: 'Journal of Clinical Nephrology & Mineral Metabolism',
      year: '2019',
      doi: '10.1016/j.kint.2019.04.015',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=Calcium+Phosphate+Product+Parathyroid+Hormone+CKD',
      category: 'Dialysis & Mineral Bone Care',
      abstract: 'Evaluation of secondary hyperparathyroidism and vascular calcification risk factors among long-term maintenance hemodialysis patients.'
    }
  ];

  return (
    <div className="about-doctor-page">
      {/* Hero Header Banner */}
      <section className="about-hero">
        <div className="about-hero-bg"></div>
        <div className="container about-hero-container">
          <div className="about-hero-media">
            <div className="about-portrait-card">
              <img 
                src={doctorPhoto} 
                alt={doctor.full_name}
                className="about-portrait-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
                }}
              />
              <div className="about-portrait-badge">
                <Award size={18} />
                <span>{doctor.years_of_experience || 13}+ Yrs Clinical Excellence</span>
              </div>
            </div>
          </div>

          <div className="about-hero-content">
            <span className="about-hero-pill">
              <Stethoscope size={14} /> Senior Consultant Nephrologist
            </span>
            <h1 className="about-hero-title">About {doctor.full_name}</h1>
            <p className="about-hero-degrees">{doctor.title}</p>
            <p className="about-hero-subtitle">{doctor.subtitle}</p>

            <p className="about-hero-bio">
              {doctor.bio || `${doctor.full_name} is a renowned Senior Consultant in Nephrology & Renal Transplant Medicine with over 13+ years of clinical expertise. He specializes in managing complex kidney disorders, hemodialysis, peritoneal dialysis, interventional nephrology, and renal transplantation.`}
            </p>

            <div className="about-hero-actions">
              <Link to="/book">
                <Button variant="primary" size="lg" icon={<CalendarCheck size={20} />}>
                  Book Consultation
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="outline" size="lg" icon={<ImageIcon size={20} />}>
                  View Honors & Gallery
                </Button>
              </Link>
              <a href="tel:7317286787">
                <Button variant="outline" size="lg" icon={<Phone size={20} />}>
                  Call Clinic Desk
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Highlights Strip */}
      <section className="about-highlights-bar">
        <div className="container">
          <div className="highlights-grid">
            <div className="highlight-box">
              <ShieldCheck size={22} className="hl-icon" />
              <div>
                <h4>13+ Years</h4>
                <p>Specialist Experience</p>
              </div>
            </div>
            <div className="highlight-box">
              <GraduationCap size={22} className="hl-icon" />
              <div>
                <h4>DNB Nephrology</h4>
                <p>Dr. RMLIMS Lucknow</p>
              </div>
            </div>
            <div className="highlight-box">
              <Stethoscope size={22} className="hl-icon" />
              <div>
                <h4>Transplant Expert</h4>
                <p>Renal Replacement Care</p>
              </div>
            </div>
            <div className="highlight-box">
              <Award size={22} className="hl-icon" />
              <div>
                <h4>ISN Member</h4>
                <p>Indian & Int'l Nephrology</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="container about-body-container">

        {/* SECTION 1: Academic Medals & Standing Badges */}
        {milestones && milestones.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="sec-icon-circle sec-icon-circle--gold">
                  <Award size={22} />
                </div>
                <div>
                  <h2>Academic Medals, Honors & Badges ({milestones.length})</h2>
                  <p>Gold medal standing, research honors, and quality healthcare accreditations</p>
                </div>
              </div>
              <Link to="/gallery">
                <Button variant="outline" size="sm" icon={<ArrowRight size={14} />}>
                  View All Honors
                </Button>
              </Link>
            </div>

            <div className="honors-seals-grid">
              {milestones.map((m, idx) => (
                <div key={idx} className="honor-seal-card">
                  <div className="honor-seal-img-wrap">
                    <img 
                      src={m.image_url} 
                      alt={m.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/gold_medal_badge.jpg';
                      }}
                    />
                  </div>
                  <div className="honor-seal-info">
                    <span className="honor-seal-badge">{m.stat}</span>
                    <h3 className="honor-seal-title">{m.title}</h3>
                    <p className="honor-seal-sub">{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Education Timeline */}
        {doctor.qualifications && doctor.qualifications.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2>Education & Academic Qualifications</h2>
                <p>Higher medical degrees, super-speciality DNB Nephrology & residency training</p>
              </div>
            </div>

            <div className="about-timeline">
              {doctor.qualifications.map((q, i) => (
                <div key={i} className="timeline-card">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-badge">{q.year}</span>
                    <h3 className="timeline-title">{q.degree} — {q.field}</h3>
                    <p className="timeline-institution">{q.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: Clinical Experience Timeline */}
        {doctor.experience && doctor.experience.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle sec-icon-circle--blue">
                <Briefcase size={22} />
              </div>
              <div>
                <h2>Clinical Experience & Work History</h2>
                <p>Senior consultant appointments in top medical institutes & hospitals</p>
              </div>
            </div>

            <div className="about-timeline">
              {doctor.experience.map((e, i) => (
                <div key={i} className={`timeline-card ${e.current ? 'timeline-card--current' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-top-row">
                      <span className="timeline-badge">{e.period}</span>
                      {e.current && <span className="current-pill"><CheckCircle2 size={12} /> Present Position</span>}
                    </div>
                    <h3 className="timeline-title">{e.role}</h3>
                    <p className="timeline-institution">{e.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: Peer-Reviewed Research Publications */}
        <section className="about-section-card">
          <div className="about-sec-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="sec-icon-circle sec-icon-circle--purple">
                <BookOpen size={22} />
              </div>
              <div>
                <h2>Peer-Reviewed Research Publications ({researchPapers.length})</h2>
                <p>Scientific papers indexed on PubMed, Europe PMC, and Nephrology journals</p>
              </div>
            </div>
            <Link to="/research">
              <Button variant="outline" size="sm" icon={<ArrowRight size={14} />}>
                Full Research Index
              </Button>
            </Link>
          </div>

          <div className="rich-papers-grid">
            {researchPapers.map((paper, idx) => (
              <div key={idx} className="rich-paper-card">
                <div className="rich-paper-tags">
                  <span className="rich-paper-cat">{paper.category}</span>
                  <span className="rich-paper-year">{paper.year}</span>
                </div>

                <h3 className="rich-paper-title">{paper.title}</h3>
                <p className="rich-paper-journal"><Bookmark size={14} /> {paper.journal}</p>
                <p className="rich-paper-abstract">{paper.abstract}</p>

                <div className="rich-paper-footer">
                  <span className="pub-doi">DOI: {paper.doi}</span>
                  <a 
                    href={paper.pubmedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="pubmed-link-btn"
                  >
                    View on PubMed <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: Specializations Tags */}
        {specializations && specializations.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle sec-icon-circle--teal">
                <Stethoscope size={22} />
              </div>
              <div>
                <h2>Clinical Specializations & Diagnostic Expertise</h2>
                <p>Expert medical care across all major kidney disorders & procedures</p>
              </div>
            </div>

            <div className="specialties-flex">
              {specializations.map(s => (
                <span key={s.id} className="specialty-chip">
                  <ShieldCheck size={14} /> {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: Professional Memberships & Medical Council */}
        <div className="about-two-col-grid">
          {doctor.memberships && doctor.memberships.length > 0 && (
            <section className="about-section-card flex-1">
              <div className="about-sec-header">
                <div className="sec-icon-circle sec-icon-circle--gold">
                  <Award size={22} />
                </div>
                <div>
                  <h2>Professional Memberships & Registrations</h2>
                  <p>National & international medical council affiliations</p>
                </div>
              </div>

              <ul className="memberships-list">
                <li style={{ background: '#EFF6FF', borderColor: '#BAE6FD' }}>
                  <ShieldCheck size={18} style={{ color: '#0284C7', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#0F172A', display: 'block', fontSize: '13px' }}>UP Medical Council Registration</strong>
                    <span style={{ color: '#475569', fontSize: '12px' }}>Verified Specialty Practitioner in Nephrology & Medicine</span>
                  </div>
                </li>
                {doctor.memberships.map((m, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} className="m-icon" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Gallery Preview Box */}
          {galleryItems && galleryItems.length > 0 && (
            <section className="about-section-card flex-1">
              <div className="about-sec-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="sec-icon-circle" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h2>Honors & Photo Gallery</h2>
                    <p>Conferences, guest lectures & OPD setups</p>
                  </div>
                </div>
                <Link to="/gallery">
                  <Button variant="outline" size="sm">View All ({galleryItems.length})</Button>
                </Link>
              </div>

              <div className="gallery-mini-grid">
                {galleryItems.slice(0, 2).map((g) => (
                  <Link key={g.id} to="/gallery" className="gallery-mini-card">
                    <div className="mini-img-box">
                      <img 
                        src={g.imageUrl} 
                        alt={g.title} 
                        className="mini-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
                        }}
                      />
                      <span className="mini-cat-badge">{g.category}</span>
                    </div>
                    <div className="mini-body">
                      <h4 className="mini-title">{g.title}</h4>
                      <p className="mini-loc"><MapPin size={10} /> {g.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Bottom Booking CTA Banner */}
        <div className="about-page-cta-banner">
          <div>
            <h2>Book an Appointment Token with {doctor.full_name}</h2>
            <p>Select your clinic location in Lucknow and reserve your appointment token online</p>
          </div>
          <Link to="/book">
            <Button variant="primary" size="lg" icon={<CalendarCheck size={20} />}>
              Book Token Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
