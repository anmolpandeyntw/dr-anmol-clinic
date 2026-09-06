import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Stethoscope } from 'lucide-react';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="container section not-found-page">
      <div className="not-found-card">
        <Stethoscope size={64} className="not-found-icon" />
        <h1>404 — Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link to="/">
          <Button variant="primary">Return to Homepage</Button>
        </Link>
      </div>
    </div>
  );
}
