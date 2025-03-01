
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find the page you were looking for. It might have been moved, deleted, or never existed.
        </p>
        <Button 
          onClick={() => navigate('/')}
          size="lg"
          className="min-w-32"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
