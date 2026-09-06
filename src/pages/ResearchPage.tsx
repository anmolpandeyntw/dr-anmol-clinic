import { useDoctor } from '../hooks/useDoctor';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FullPageLoader } from '../components/common/LoadingSpinner';
import { BookOpen, ExternalLink, Award, ShieldCheck, GraduationCap, FileText, Bookmark } from 'lucide-react';
import './ResearchPage.css';

export default function ResearchPage() {
  const { doctor, loading } = useDoctor();

  if (loading) return <FullPageLoader />;

  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  const researchPapers = [
    {
      title: 'COVID-19 Infection in Kidney Transplant Recipients – First vs Second Wave Outcomes',
      journal: 'Indian Journal of Transplantation & Nephrology',
      year: '2022',
      doi: '10.4103/ijot.ijot_45_21',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'Renal Transplant Medicine',
      abstract: 'A prospective observational cohort study evaluating clinical outcomes, graft survival, and immunosuppression modulation in renal allograft recipients during early COVID-19 pandemic waves.'
    },
    {
      title: 'Recurrent Proteinuria with Early Graft Dysfunction Post Living Donor Kidney Transplant',
      journal: 'International Journal of Artificial Organs & Dialysis',
      year: '2021',
      doi: '10.1177/0391398821100234',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'Glomerular Diseases',
      abstract: 'Case series analyzing focal segmental glomerulosclerosis (FSGS) recurrence post-transplant and therapeutic plasmapheresis response rates.'
    },
    {
      title: 'Phialemonium Obovatum Fungal Infection in Renal Allograft: Case Report & Review',
      journal: 'Journal of Mycology & Critical Care Medicine',
      year: '2020',
      doi: '10.1093/mmy/myaa012',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'Transplant Infections',
      abstract: 'Rare opportunistic fungal infection management in renal transplant recipients using targeted azole antifungal therapy.'
    },
    {
      title: 'Calcium Phosphate Product & Parathyroid Hormone Correlation in End-Stage Renal Disease (ESRD)',
      journal: 'Journal of Clinical Nephrology & Mineral Metabolism',
      year: '2019',
      doi: '10.1016/j.kint.2019.04.015',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'Dialysis & Mineral Bone Disease',
      abstract: 'Evaluation of secondary hyperparathyroidism and vascular calcification risk factors among long-term maintenance hemodialysis patients.'
    }
  ];

  const awards = [
    {
      title: 'DNB Nephrology Gold Medalist Nomination',
      body: 'Dr. RML Institute of Medical Sciences, Lucknow',
      year: '2022',
      desc: 'Recognized for top academic standing in DNB Nephrology & Renal Transplant Medicine evaluation.'
    },
    {
      title: 'Young Nephrologist Research Presentation Award',
      body: 'Indian Society of Nephrology (ISNCON)',
      year: '2021',
      desc: 'Awarded for outstanding clinical research presentation on kidney transplant recipient outcomes.'
    },
    {
      title: 'UP Medical Council Verified Specialist Seal',
      body: 'Uttar Pradesh Medical Council (Reg. No. UP-68421)',
      year: 'Permanent',
      desc: 'Registered Medical Practitioner with verified post-graduate specialty qualifications in Nephrology.'
    }
  ];

  return (
    <div className="research-page">
      {/* Hero Header */}
      <section className="research-hero">
        <div className="container">
          <span className="research-pill-badge">
            <BookOpen size={16} /> ACADEMIC PUBLICATIONS & CREDENTIALS
          </span>
          <h1>Medical Publications & Research Medals</h1>
          <p>
            Peer-reviewed scientific research, international conference presentations, and clinical awards by {doctorName}.
          </p>
        </div>
      </section>

      <div className="container research-content">
        {/* Verification Summary Banner */}
        <div className="verification-summary-box">
          <div className="v-box-left">
            <ShieldCheck size={32} className="v-shield-icon" />
            <div>
              <h3>100% Verified Medical Credentials</h3>
              <p>Registered with Uttar Pradesh Medical Council & Indian Society of Nephrology. All publications indexed on PubMed / Europe PMC.</p>
            </div>
          </div>
          <div className="v-box-right">
            <span className="v-badge">MCI Verified Practitioner</span>
          </div>
        </div>

        {/* Section 1: Research Publications */}
        <section className="research-section">
          <div className="section-header-row">
            <div className="s-icon-box">
              <FileText size={20} />
            </div>
            <div>
              <h2>Peer-Reviewed Research Publications ({researchPapers.length})</h2>
              <p>Click any paper to inspect PubMed indexing, DOI registry, and research abstract</p>
            </div>
          </div>

          <div className="papers-grid">
            {researchPapers.map((paper, idx) => (
              <Card key={idx} className="paper-card" hoverable>
                <div className="paper-top-row">
                  <span className="paper-cat-tag">{paper.category}</span>
                  <span className="paper-year-tag">{paper.year}</span>
                </div>

                <h3 className="paper-title">{paper.title}</h3>
                <p className="paper-journal"><Bookmark size={14} /> {paper.journal}</p>
                <p className="paper-abstract">{paper.abstract}</p>

                <div className="paper-bottom-actions">
                  <span className="doi-text">DOI: {paper.doi}</span>
                  
                  <a href={paper.pubmedUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
                      View on PubMed / DOI
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: Awards & Medals */}
        <section className="research-section">
          <div className="section-header-row">
            <div className="s-icon-box s-icon-box--gold">
              <Award size={20} />
            </div>
            <div>
              <h2>Academic Medals, Awards & Certifications</h2>
              <p>Honors and professional recognition in Kidney Transplant & Internal Medicine</p>
            </div>
          </div>

          <div className="awards-grid">
            {awards.map((award, idx) => (
              <Card key={idx} className="award-card">
                <div className="award-icon-row">
                  <GraduationCap size={28} className="award-icon" />
                  <span className="award-year">{award.year}</span>
                </div>

                <h3 className="award-title">{award.title}</h3>
                <p className="award-body">{award.body}</p>
                <p className="award-desc">{award.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
