import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import './WhatsAppFloatingWidget.css';

interface WhatsAppFloatingWidgetProps {
  clinicPhone?: string;
  doctorName?: string;
}

export const WhatsAppFloatingWidget: React.FC<WhatsAppFloatingWidgetProps> = ({
  clinicPhone = '9450000000',
  doctorName = 'Dr. Amit Kumar Singh'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const cleanPhone = clinicPhone.replace(/\D/g, '').slice(-10);
  const fullWhatsAppNumber = `91${cleanPhone || '9450000000'}`;

  const defaultQueries = [
    'Hello, I want to book an appointment with Dr. Amit Kumar Singh.',
    'What are the clinic OPD timings and address?',
    'What is the consultation fee for Nephrology consultation?',
    'Is emergency kidney dialysis support available today?'
  ];

  const handleSendQuery = (text: string) => {
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${fullWhatsAppNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setCustomMessage('');
  };

  return (
    <div className="whatsapp-floating-container">
      {/* Quick Chat Box Popup */}
      {isOpen && (
        <div className="whatsapp-chat-card">
          <div className="whatsapp-card-header">
            <div className="whatsapp-avatar-group">
              <div className="whatsapp-avatar">
                <span className="online-indicator"></span>
                👨‍⚕️
              </div>
              <div>
                <h4 className="whatsapp-card-title">{doctorName} Desk</h4>
                <p className="whatsapp-card-subtitle">
                  <ShieldCheck size={12} /> Instant Help & Appointments
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="whatsapp-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="whatsapp-card-body">
            <div className="whatsapp-msg-bubble">
              <p>
                Hello! 👋 Welcome to <strong>{doctorName}</strong> Clinic Help Desk.
              </p>
              <p className="whatsapp-time-hint">
                <Clock size={12} /> Usually replies within 5 minutes
              </p>
            </div>

            <div className="whatsapp-quick-queries">
              <span className="quick-title">
                <Sparkles size={13} /> Tap a quick question:
              </span>
              {defaultQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-query-btn"
                  onClick={() => handleSendQuery(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="whatsapp-card-footer">
            <input
              type="text"
              className="whatsapp-input"
              placeholder="Type your question..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customMessage.trim()) {
                  handleSendQuery(customMessage.trim());
                }
              }}
            />
            <button
              type="button"
              className="whatsapp-send-btn"
              disabled={!customMessage.trim()}
              onClick={() => handleSendQuery(customMessage.trim())}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Circle Button */}
      <button
        type="button"
        className="whatsapp-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat on WhatsApp for help & booking"
      >
        <span className="whatsapp-ping-badge"></span>
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
        {!isOpen && <span className="whatsapp-label-badge">WhatsApp Support</span>}
      </button>
    </div>
  );
};

export default WhatsAppFloatingWidget;
