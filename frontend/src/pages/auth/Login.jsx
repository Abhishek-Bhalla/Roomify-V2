import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RLogo from '../../assets/R.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0.75) 100%), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)' };

  return (
    <div className="min-h-screen relative">
      {/* Full-viewport background layer — covers the entire screen and stays fixed during scroll. */}
      <div
        className="fixed inset-0 -z-10 animate-[fade-in_0.8s_ease-out_both]"
        style={
          backgroundImage
            ? {
                // backgroundImage: `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.65)), radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.35) 100%), url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)' }
        }
        aria-hidden="true"
      />

      <div className="min-h-[100dvh] flex items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-none sm:rounded-2xl lg:rounded-3xl shadow-2xl">

        {/* Left Section — Hero (desktop ≥1024px only) */}
        <div
          className="hidden lg:flex flex-col justify-between p-10 xl:p-12 text-white relative animate-[fade-in_0.7s_ease-out_0.15s_both]"
          style={heroStyle}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 animate-[fade-in_0.6s_ease-out_0.25s_both]">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <img src={RLogo} alt="CampusSpace logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-wide">CampusSpace</span>
          </div>

          {/* Headline + Tagline */}
          <div className="space-y-5 animate-[fade-in-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.35s_both]">
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
              BOOK SMARTER.<br />
              <span style={{ color: '#93C5FD' }}>WORK BETTER.</span>
            </h1>
            <p className="text-lg xl:text-xl max-w-md leading-relaxed" style={{ color: '#D1D5DB' }}>
              The smart way to reserve rooms and labs across your campus —
              real-time availability, instant approvals, and zero paperwork.
            </p>
          </div>

          {/* Footer hint */}
          <p className="text-sm animate-[fade-in_0.6s_ease-out_0.55s_both]" style={{ color: '#9CA3AF' }}>
            Room &amp; Lab Booking System for modern teams.
          </p>
        </div>

                  {/* Right Section — Glassmorphism Login Card */}
          <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
            <div
              className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl p-6 sm:p-8 lg:p-10 animate-[fade-in-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]"
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
              <h1 className="text-xl font-bold text-white">CampusSpace</h1>
              <p className="text-sm mt-1" style={{ color: '#D1D5DB' }}>Room &amp; Lab Booking System</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-sm mt-1" style={{ color: '#D1D5DB' }}>Sign in to continue to CampusSpace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 tracking-wide" style={{ color: '#E5E7EB' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-800 placeholder-gray-400 text-base border border-white/40 shadow-sm transition-[box-shadow,background-color,transform,border-color] duration-300 ease-out hover:bg-white hover:shadow-md hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-transparent focus:bg-white focus:shadow-lg focus:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus:translate-y-0"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 tracking-wide" style={{ color: '#E5E7EB' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/95 text-gray-800 placeholder-gray-400 text-base border border-white/40 shadow-sm transition-[box-shadow,background-color,transform,border-color] duration-300 ease-out hover:bg-white hover:shadow-md hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-transparent focus:bg-white focus:shadow-lg focus:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus:translate-y-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#3B82F6] active:scale-95 transition-all duration-150 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Reserved validation slot — keeps layout stable whether or not an error is shown. */}
              <div className="min-h-[3.25rem] flex items-start">
                {error && (
                  <div className="w-full p-3 bg-red-500/20 border border-red-300/40 rounded-xl text-sm text-white" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 rounded-xl text-white text-base font-semibold tracking-wide shadow-lg overflow-hidden transition-[transform,box-shadow,filter] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:translate-y-0 active:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[#3B82F6] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:hover:brightness-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #034DA2 0%, #0a3d80 100%)' }}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {loading && (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? 'Signing in...' : 'Sign In'}
                </span>
                {/* Subtle shimmer on hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              </button>
            </form>

            <p className="text-xs text-center mt-5" style={{ color: '#D1D5DB' }}>
              Need an account? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
