import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion,
  increment 
} from 'firebase/firestore';
import { Mail, Lock, Key, User, AlertCircle, CheckCircle } from 'lucide-react';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Проверка инвайт-кода
  const validateInviteCode = async (code) => {
    const q = query(
      collection(db, 'inviteCodes'), 
      where('code', '==', code)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Неверный инвайт-код');
    }
    
    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data();
    
    // Проверка срока действия
    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      throw new Error('Инвайт-код истек');
    }
    
    // Проверка лимита использований
    if (inviteData.maxUses > 0 && inviteData.usedCount >= inviteData.maxUses) {
      throw new Error('Инвайт-код исчерпан');
    }
    
    return { id: inviteDoc.id, data: inviteData };
  };

  // Регистрация
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Проверка инвайт-кода
      const inviteCodeData = await validateInviteCode(inviteCode);
      
      // Создание пользователя
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Создание документа пользователя
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'user',
        createdAt: new Date(),
        inviteCode: inviteCode
      });
      
      // Обновление использования инвайт-кода
      await updateDoc(doc(db, 'inviteCodes', inviteCodeData.id), {
        usedCount: increment(1),
        usedBy: arrayUnion(user.uid),
        isUsed: inviteCodeData.data.maxUses === 1 ? true : 
                (inviteCodeData.data.usedCount + 1 >= inviteCodeData.data.maxUses)
      });
      
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  // Авторизация
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Неверный пароль');
      } else if (err.code === 'auth/user-not-found') {
        setError('Пользователь не найден');
      } else if (err.code === 'auth/invalid-email') {
        setError('Неверный формат email');
      } else {
        setError('Ошибка авторизации');
      }
    } finally {
      setLoading(false);
    }
  };

  // Восстановление пароля
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Введите email для восстановления пароля');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Пользователь с таким email не найден');
      } else {
        setError('Ошибка отправки письма');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Manrope", sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '36px',
            fontWeight: '900',
            background: '#64748b',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Tasks
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {/* Сообщение об успехе восстановления */}
        {resetEmailSent && (
          <div style={{
            padding: '16px',
            background: '#d1fae5',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ color: '#059669', fontSize: '14px' }}>
              Письмо отправлено! Проверьте почту.
            </span>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div style={{
            padding: '16px',
            background: '#fee2e2',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Invite Code (только при регистрации) */}
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Инвайт-код
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={20} style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="TASK2024"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 48px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <p style={{
                marginTop: '6px',
                fontSize: '12px',
                color: '#64748b'
              }}>
                Получите код у администратора
              </p>
            </div>
          )}

          {/* Forgot Password (только при логине) */}
          {isLogin && (
            <div style={{
              textAlign: 'right',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit'
                }}
              >
                Забыли пароль?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#94a3b8' : '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <span style={{ color: '#64748b', fontSize: '14px' }}>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          </span>
          {' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setResetEmailSent(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit'
            }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
