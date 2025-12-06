import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto py-4 border-top bg-light">
      <div className="container text-center">
        <p className="mb-2 text-muted">
          Built with ❤️ by <strong>Zeus Angelo Bautista</strong>
        </p>
        <a
          href="https://github.com/kidlatpogi"
          target="_blank"
          rel="noopener noreferrer"
          className="d-inline-flex align-items-center gap-2 text-decoration-none text-dark hover-text-primary"
          style={{ transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0d6efd')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#000')}
        >
          <Github size={18} />
          <span>github.com/kidlatpogi</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
