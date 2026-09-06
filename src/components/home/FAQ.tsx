import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, MessageSquare, Search } from 'lucide-react';
import type { Doctor } from '../../types/database';
import './FAQ.css';

interface FAQProps {
  doctor?: Doctor | null;
}

interface FAQItem {
  id: string;
  category: 'booking' | 'fees' | 'medical';
  question: string;
  answer: string;
  badge: string;
}

export const FAQ: React.FC<FAQProps> = ({ doctor }) => {
  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'booking',
      question: `How do I book an appointment at ${doctorName}'s Private Clinics?`,
      answer: `Simply select your preferred private clinic location in Lucknow (Gomti Nagar, Vikas Nagar, or Alambagh), pick an available date, fill in your name and mobile number, and confirm. Your official token number will be generated immediately.`,
      badge: 'Booking Process'
    },
    {
      id: 'faq-2',
      category: 'booking',
      question: 'Do I need to create an account or register to book an appointment?',
      answer: 'No registration or login is required. We keep the process fast and simple for patients. You only need to enter your name, 10-digit mobile number, age, and gender during booking.',
      badge: 'No Registration'
    },
    {
      id: 'faq-3',
      category: 'booking',
      question: 'What is the difference between Private Clinic booking and Hospital OPD?',
      answer: `Instant online token booking is available exclusively for ${doctorName}'s Private Clinics. For Hospital OPD attachments, appointments are managed directly through the hospital desk.`,
      badge: 'Clinic vs OPD'
    },
    {
      id: 'faq-4',
      category: 'fees',
      question: 'What are the consultation fees and available payment methods?',
      answer: `Consultation fee for ${doctorName}'s Private Clinics is displayed during booking (e.g. ₹500 - ₹700). You can choose to "Pay Online" via UPI QR / Card or select "Pay at Clinic" to pay cash/UPI directly at the reception counter upon arrival.`,
      badge: 'Fees & Payment'
    },
    {
      id: 'faq-5',
      category: 'medical',
      question: 'What medical test reports should I bring for my consultation?',
      answer: 'Please bring your recent blood reports, urine routine tests, ultrasound scans, blood pressure history, and a complete list of ongoing medications.',
      badge: 'Medical Reports'
    },
    {
      id: 'faq-6',
      category: 'medical',
      question: `Can I consult ${doctorName} for a Second Opinion?`,
      answer: `Yes. ${doctorName} provides comprehensive medical consultations and second opinions. Please bring all previous medical discharge summaries and evaluation files.`,
      badge: 'Second Opinion'
    },
    {
      id: 'faq-7',
      category: 'booking',
      question: 'How does the instant digital token number work when I reach the clinic?',
      answer: 'Upon completing your booking, you receive a digital token number (e.g. Token #04). Show this token at the clinic reception counter on your appointment date for priority queue entry.',
      badge: 'Digital Token'
    },
    {
      id: 'faq-8',
      category: 'medical',
      question: 'Is Online Video Consultation available for outstation patients?',
      answer: 'Yes! Patients outside Lucknow can request an Online Video Consultation through our online portal to review reports or receive follow-up guidance remotely.',
      badge: 'Video Consult'
    }
  ];

  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<'all' | 'booking' | 'fees' | 'medical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="faq-section">
      <div className="container">
        {/* Header */}
        <div className="faq-header">
          <div className="faq-badge-pill">
            <HelpCircle size={14} />
            <span>Patient Knowledge Base</span>
          </div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Find answers to common questions about clinic bookings, consultation fees, and medical visit preparation
          </p>

          {/* Search Box */}
          <div className="faq-search-box">
            <Search size={18} className="faq-search-icon" />
            <input
              type="text"
              placeholder="Search your question (e.g., reports, fee, token, transplant)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="faq-search-input"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="faq-tabs-row">
            <button
              className={`faq-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Questions ({faqs.length})
            </button>
            <button
              className={`faq-tab ${activeCategory === 'booking' ? 'active' : ''}`}
              onClick={() => setActiveCategory('booking')}
            >
              Booking & Tokens
            </button>
            <button
              className={`faq-tab ${activeCategory === 'fees' ? 'active' : ''}`}
              onClick={() => setActiveCategory('fees')}
            >
              Fees & Payments
            </button>
            <button
              className={`faq-tab ${activeCategory === 'medical' ? 'active' : ''}`}
              onClick={() => setActiveCategory('medical')}
            >
              Medical & Reports
            </button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className={`faq-card ${isOpen ? 'open' : ''}`}>
                  <button className="faq-question-btn" onClick={() => toggleFAQ(faq.id)} type="button">
                    <div className="faq-q-text-side">
                      <span className="faq-badge-tag">{faq.badge}</span>
                      <h3 className="faq-q-title">{faq.question}</h3>
                    </div>
                    <ChevronDown className={`faq-chevron ${isOpen ? 'rotated' : ''}`} size={20} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-body">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="faq-no-results">
              <p>No questions found matching "{searchQuery}". Please try another search term or call clinic reception.</p>
            </div>
          )}
        </div>

        {/* Clinic Assistance Footer Banner */}
        <div className="faq-help-footer">
          <div className="faq-help-info">
            <h4>Have a specific question not answered here?</h4>
            <p>Our clinic reception team is happy to assist you directly on phone or WhatsApp.</p>
          </div>
          <div className="faq-help-actions">
            <a href="tel:+919415000000" className="faq-call-btn">
              <Phone size={16} /> Call Reception: +91 94150 00000
            </a>
            <a href="https://wa.me/919415000000" target="_blank" rel="noopener noreferrer" className="faq-wa-btn">
              <MessageSquare size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
