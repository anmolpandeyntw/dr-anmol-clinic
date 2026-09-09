import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { MobileNav } from '../components/common/MobileNav';
import { WhatsAppFloatingWidget } from '../components/common/WhatsAppFloatingWidget';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { useDoctor } from '../hooks/useDoctor';
import { useClinics } from '../hooks/useClinics';
import './PublicLayout.css';

export default function PublicLayout() {
  const { doctor } = useDoctor();
  const { clinics } = useClinics();

  const primaryPhone = clinics.find(c => c.phone)?.phone ?? undefined;

  return (
    <div className="public-layout">
      <ScrollToTop />
      <Header doctorName={doctor?.full_name} />
      <main className="public-layout__main">
        <Outlet />
      </main>
      <Footer doctorName={doctor?.full_name} />
      <MobileNav phone={primaryPhone} />
      <WhatsAppFloatingWidget clinicPhone={primaryPhone} doctorName={doctor?.full_name} />
    </div>
  );
}
