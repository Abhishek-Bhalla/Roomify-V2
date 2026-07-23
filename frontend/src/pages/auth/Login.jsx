import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import { Building2 } from 'lucide-react';
import { authAPI } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', employeeId: '' });

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.register({ ...registerData, role: 'requester' });
      setShowRegister(false);
      setEmail(registerData.email);
      setPassword(registerData.password);
      setError('Registration successful! Please sign in.');
      setRegisterData({ name: '', email: '', password: '', employeeId: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backgroundImage = import.meta.env.VITE_LOGIN_BACKGROUND;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Building2 size={28} className="sm:size-32 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Roomify</h1>
            <p className="text-gray-500 text-sm mt-1">Room & Lab Booking System</p>
          </div>

          {showRegister ? (
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
              <Input
                label="Full Name"
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
              <Input
                label="Employee ID"
                type="text"
                value={registerData.employeeId}
                onChange={(e) => setRegisterData({ ...registerData, employeeId: e.target.value })}
                placeholder="Enter your employee ID"
                required
              />
              <Input
                label="Email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="Enter your email"
                required
              />
              <PasswordInput
                label="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="Create a password"
                required
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <button
                type="button"
                onClick={() => { setShowRegister(false); setError(''); }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Already have an account? Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
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

              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Don't have an account? Register
              </button>
            </form>
          )}

          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2 font-semibold">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@jims.org / admin123</p>
              <p><strong>Approver:</strong> approver@jims.org / approver123</p>
              <p><strong>Requester:</strong> requester@jims.org / requester123</p>
              {/* <p><strong>John:</strong> john@jims.org / john123</p>
              <p><strong>Sarah:</strong> sarah@jims.org / sarah123</p>
              <p><strong>Mike:</strong> mike@jims.org / mike123</p>
              <p><strong>Emily:</strong> emily@jims.org / emily123</p> */}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
