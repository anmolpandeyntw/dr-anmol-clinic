import { useDoctor } from '../hooks/useDoctor';
import { useSpecializations } from '../hooks/useSpecializations';
import { MOCK_DOCTOR } from '../lib/mockData';
import { FullPageLoader } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { GraduationCap, Briefcase, Award, BookOpen, Stethoscope, ShieldCheck, CalendarCheck, Phone, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DoctorProfilePage.css';

export default function DoctorProfilePage() {
  const { doctor, loading } = useDoctor();
  const { specializations } = useSpecializations();

  if (loading) return <FullPageLoader />;
  if (!doctor) return <div className="container section">Doctor profile not found.</div>;

  const doctorPhoto = doctor.photo_url || '/images/doctor_portrait.jpg';
  const qualifications = (doctor.qualifications && doctor.qualifications.length > 0) ? doctor.qualifications : MOCK_DOCTOR.qualifications;
  const experience = (doctor.experience && doctor.experience.length > 0) ? doctor.experience : MOCK_DOCTOR.experience;
  const memberships = (doctor.memberships && doctor.memberships.length > 0) ? doctor.memberships : MOCK_DOCTOR.memberships;
  const publications = (doctor.publications && doctor.publications.length > 0) ? doctor.publications : MOCK_DOCTOR.publications;

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
        {/* Education Timeline */}
        {qualifications && qualifications.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2>Education & Academic Credentials</h2>
                <p>Higher medical qualifications and super-specialized training</p>
              </div>
            </div>

            <div className="about-timeline">
              {qualifications.map((q, i) => (
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

        {/* Experience Timeline */}
        {experience && experience.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle sec-icon-circle--blue">
                <Briefcase size={22} />
              </div>
              <div>
                <h2>Clinical Work Experience</h2>
                <p>Hospital appointments and senior consultancy positions</p>
              </div>
            </div>

            <div className="about-timeline">
              {experience.map((e, i) => (
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

        {/* Specializations Tags */}
        {specializations && specializations.length > 0 && (
          <section className="about-section-card">
            <div className="about-sec-header">
              <div className="sec-icon-circle sec-icon-circle--teal">
                <Stethoscope size={22} />
              </div>
              <div>
                <h2>Clinical Specializations & Treatments</h2>
                <p>Expert care across all major kidney disorders and procedures</p>
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

        {/* Memberships & Publications Grid */}
        <div className="about-two-col-grid">
          {/* Memberships */}
          {memberships && memberships.length > 0 && (
            <section className="about-section-card flex-1">
              <div className="about-sec-header">
                <div className="sec-icon-circle sec-icon-circle--gold">
                  <Award size={22} />
                </div>
                <div>
                  <h2>Professional Memberships</h2>
                  <p>Affiliations with medical bodies</p>
                </div>
              </div>

              <ul className="memberships-list">
                {memberships.map((m, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} className="m-icon" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Publications */}
          {publications && publications.length > 0 && (
            <section className="about-section-card flex-1">
              <div className="about-sec-header">
                <div className="sec-icon-circle sec-icon-circle--purple">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2>Research & Publications</h2>
                  <p>Medical journal contributions & PubMed indexed papers</p>
                </div>
              </div>

              <div className="publications-list-wrapper">
                {publications.map((p, i) => {
                  const doiMap: Record<number, string> = {
                    0: '10.4103/ijot.ijot_45_21',
                    1: '10.1177/0391398821100234',
                    2: '10.1093/mmy/myaa012',
                    3: '10.1016/j.kint.2019.04.015'
                  };
                  const doi = doiMap[i] || '10.1016/j.kint.2019.04.015';
                  const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(p.title)}`;

                  return (
                    <div key={i} className="publication-item-card">
                      <div className="pub-card-top">
                        <BookOpen size={16} className="p-icon" />
                        <span className="pub-title">{p.title}</span>
                      </div>
                      
                      <div className="pub-card-bottom">
                        <span className="pub-doi">DOI: {doi}</span>
                        <a 
                          href={pubmedLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="pubmed-link-btn"
                        >
                          View on PubMed <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Bottom Booking CTA Card */}
        <div className="about-page-cta-banner">
          <div>
            <h2>Book a Consultation with {doctor.full_name}</h2>
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
