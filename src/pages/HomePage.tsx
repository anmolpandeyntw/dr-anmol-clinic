import { useDoctor } from '../hooks/useDoctor';
import { useClinics } from '../hooks/useClinics';
import { useSpecializations } from '../hooks/useSpecializations';
import { HeroSection } from '../components/home/HeroSection';
import { DoctorCredentials } from '../components/home/DoctorCredentials';
import { TrustStrip } from '../components/home/TrustStrip';
import { TodayAvailability } from '../components/home/TodayAvailability';
import { ClinicsPreview } from '../components/home/ClinicsPreview';
import { SpecializationsGrid } from '../components/home/SpecializationsGrid';
import { AboutDoctor } from '../components/home/AboutDoctor';
import { HowItWorks } from '../components/home/HowItWorks';
import { OnlineConsultation } from '../components/home/OnlineConsultation';
import { FAQ } from '../components/home/FAQ';
import { ContactSection } from '../components/home/ContactSection';

export default function HomePage() {
  const { doctor } = useDoctor();
  const { clinics } = useClinics();
  const { specializations } = useSpecializations();

  // Filter ONLY active Private Clinics for Homepage Availability & Clinics Cards
  const privateClinicsOnly = clinics.filter(c =>
    c.is_private_clinic !== false &&
    !c.name.toLowerCase().includes('hospital') &&
    !c.name.toLowerCase().includes('kgmu')
  );

  return (
    <>
      <HeroSection doctor={doctor} />
      <DoctorCredentials doctor={doctor} />
      <TrustStrip doctor={doctor} clinicCount={privateClinicsOnly.length} />
      <TodayAvailability clinics={privateClinicsOnly} />
      <ClinicsPreview clinics={privateClinicsOnly} />
      <SpecializationsGrid specializations={specializations} />
      <AboutDoctor doctor={doctor} />
      <HowItWorks doctor={doctor} />
      <OnlineConsultation doctor={doctor} />
      <FAQ doctor={doctor} />
      <ContactSection clinics={privateClinicsOnly} />
    </>
  );
}
