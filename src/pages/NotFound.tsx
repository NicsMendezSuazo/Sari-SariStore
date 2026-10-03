import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
        <Store className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-sm text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/pos" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
        Back to POS
      </Link>
    </div>
  );
}
