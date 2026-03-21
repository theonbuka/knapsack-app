import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseAuthClient } from '../utils/supabaseAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { processSupabaseSession } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        navigate('/landing');
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/landing');
          return;
        }

        if (data.session) {
          const success = await processSupabaseSession(data.session, supabase);
          if (success) {
            navigate('/', { replace: true });
          } else {
            navigate('/landing');
          }
        } else {
          navigate('/landing');
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        navigate('/landing');
      }
    };

    handleAuthCallback();
  }, [navigate, processSupabaseSession]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        <p className="mt-4 text-slate-600">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}