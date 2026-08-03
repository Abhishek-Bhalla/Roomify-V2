import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import RLogo from '../../assets/R.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const backgroundImage = import.meta.env.VITE_LOGIN_BACKGROUND;

  const heroStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)' };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-0 sm:p-4"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-none sm:rounded-2xl lg:rounded-3xl shadow-2xl">

        {/* Left Section — Hero */}
        <div
          className="hidden lg:flex flex-col justify-between p-12 text-white relative"
          style={heroStyle}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <img src={RLogo} alt="Roomify logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-wide">Roomify</span>
          </div>

          {/* Headline + Tagline */}
          <div className="space-y-5">
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
              BOOK SMARTER.<br />
              <span className="text-blue-200">WORK BETTER.</span>
            </h1>
            <p className="text-lg xl:text-xl text-white/85 max-w-md leading-relaxed">
              The smart way to reserve rooms and labs across your campus —
              real-time availability, instant approvals, and zero paperwork.
            </p>
          </div>

          {/* Footer hint */}
          <p className="text-sm text-white/60">
            Room &amp; Lab Booking System for modern teams.
          </p>
        </div>

        {/* Right Section — Glassmorphism Login Card */}
        <div
          className="flex items-center justify-center p-6 sm:p-10 lg:p-12"
          style={backgroundImage ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)' }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/30 shadow-2xl p-8 sm:p-10"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Mobile-only logo (hidden on desktop where the hero shows it) */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30">
                <img src={RLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-white">Roomify</h1>
              <p className="text-white/70 text-sm mt-1">Room &amp; Lab Booking System</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-white/75 text-sm mt-1">Sign in to continue to Roomify.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="bg-white/80"
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="bg-white/80"
              />

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-300/40 rounded-lg text-sm text-white">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-xs text-white/80 text-center mt-5">
              Need an account? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
