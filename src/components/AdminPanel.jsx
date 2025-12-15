import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc,
  where,
  orderBy 
} from 'firebase/firestore';
import { X, Users, Key, Plus, Trash2, Copy, CheckCircle, Shield, ShieldOff } from 'lucide-react';

const AdminPanel = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState('codes');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  // Генерация случайного кода
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Загрузка инвайт-кодов
  const loadInviteCodes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'inviteCodes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      }));
      setInviteCodes(codes);
    } catch (error) {
      console.error('Ошибка загрузки кодов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка пользователей
  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  // Создание нового инвайт-кода
  const createInviteCode = async (maxUses = 1) => {
    try {
      const code = generateCode();
      await addDoc(collection(db, 'inviteCodes'), {
        code: code,
        isUsed: false,
        usedCount: 0,
        maxUses: maxUses,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        usedBy: []
      });
      await loadInviteCodes();
    } catch (error) {
      console.error('Ошибка создания кода:', error);
    }
  };

  // Удаление инвайт-кода
  const deleteInviteCode = async (codeId) => {
    if (!confirm('Удалить этот инвайт-код?')) return;
    
    try {
      await deleteDoc(doc(db, 'inviteCodes', codeId));
      await loadInviteCodes();
    } catch (error) {
      console.error('Ошибка удаления кода:', error);
    }
  };

  // Копирование кода
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  // Блокировка/разблокировка пользователя
  const toggleBlockUser = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'заблокировать' : 'разблокировать';
    
    if (!confirm(`Вы уверены что хотите ${action} этого пользователя?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: newStatus,
        blockedAt: newStatus ? new Date() : null
      });
      await loadUsers();
      alert(`Пользователь успешно ${newStatus ? 'заблокирован' : 'разблокирован'}!`);
    } catch (error) {
      console.error('Ошибка изменения статуса пользователя:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  // Удаление пользователя и всех его данных
  const deleteUser = async (userId, userEmail) => {
    if (!confirm(`ВНИМАНИЕ! Вы действительно хотите удалить пользователя ${userEmail}?\n\nЭто действие удалит:\n- Профиль пользователя\n- Все его события\n- Все его контакты\n\nЭто действие НЕОБРАТИМО!`)) return;
    
    if (!confirm('Вы абсолютно уверены? Введите подтверждение.')) return;
    
    setLoading(true);
    try {
      // Удаляем события пользователя
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', userId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const deleteEventsPromises = eventsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteEventsPromises);
      
      // Удаляем контакты пользователя
      const contactsQuery = query(
        collection(db, 'contacts'),
        where('userId', '==', userId)
      );
      const contactsSnapshot = await getDocs(contactsQuery);
      const deleteContactsPromises = contactsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteContactsPromises);
      
      // Удаляем профиль пользователя
      await deleteDoc(doc(db, 'users', userId));
      
      await loadUsers();
      alert('Пользователь и все его данные успешно удалены!');
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'codes') {
        loadInviteCodes();
      } else {
        loadUsers();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.3s ease'
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        animation: 'slideInRight 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Manrope", sans-serif'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '24px',
            fontWeight: '900',
            background: '#64748b',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Панель администратора
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(102, 126, 234, 0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.2)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            <X size={20} color="#667eea" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          padding: '16px 24px',
          gap: '12px',
          borderBottom: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('codes')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'codes' 
                ? '#64748b'
                : 'rgba(102, 126, 234, 0.1)',
              color: activeTab === 'codes' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Key size={18} />
            Инвайт-коды
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'users' 
                ? '#64748b'
                : 'rgba(102, 126, 234, 0.1)',
              color: activeTab === 'users' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} />
            Пользователи
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {activeTab === 'codes' ? (
            <>
              {/* Create buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <button
                  onClick={() => createInviteCode(1)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <Plus size={18} />
                  Код на 1 человека
                </button>
                <button
                  onClick={() => createInviteCode(10)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <Plus size={18} />
                  Код на 10 человек
                </button>
              </div>

              {/* Codes list */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Загрузка...
                </div>
              ) : inviteCodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Key size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>Нет инвайт-кодов</p>
                </div>
              ) : (
                inviteCodes.map(code => (
                  <div
                    key={code.id}
                    style={{
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '16px',
                      border: '2px solid rgba(102, 126, 234, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        background: code.isUsed || code.usedCount >= code.maxUses
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(16, 185, 129, 0.1)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '18px',
                        letterSpacing: '1px',
                        color: code.isUsed || code.usedCount >= code.maxUses
                          ? '#ef4444'
                          : '#10b981',
                        fontFamily: 'monospace'
                      }}>
                        {code.code}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => copyCode(code.code)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: copied === code.code 
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(102, 126, 234, 0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {copied === code.code ? (
                            <CheckCircle size={18} color="#10b981" />
                          ) : (
                            <Copy size={18} color="#667eea" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteInviteCode(code.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      fontSize: '13px',
                      color: '#64748b'
                    }}>
                      <div>
                        <strong>Использовано:</strong> {code.usedCount} / {code.maxUses}
                      </div>
                      <div>
                        <strong>Создан:</strong> {code.createdAt?.toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {/* Users list */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Загрузка...
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>Нет пользователей</p>
                </div>
              ) : (
                <>
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#667eea'
                  }}>
                    Всего пользователей: {users.length}
                  </div>
                  {users.map(user => (
                    <div
                      key={user.id}
                      style={{
                        background: user.isBlocked 
                          ? 'rgba(239, 68, 68, 0.05)' 
                          : 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        border: user.isBlocked 
                          ? '2px solid rgba(239, 68, 68, 0.3)' 
                          : '2px solid rgba(102, 126, 234, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '16px',
                            color: '#1e293b',
                            marginBottom: '4px'
                          }}>
                            {user.email}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#64748b',
                            marginBottom: '6px'
                          }}>
                            Роль: <strong>{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</strong>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                          }}>
                            {user.role === 'admin' && (
                              <div style={{
                                padding: '4px 10px',
                                background: '#64748b',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                ADMIN
                              </div>
                            )}
                            <div style={{
                              padding: '4px 10px',
                              background: user.isBlocked 
                                ? 'rgba(239, 68, 68, 0.1)' 
                                : 'rgba(16, 185, 129, 0.1)',
                              color: user.isBlocked ? '#ef4444' : '#10b981',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {user.isBlocked ? '🔒 ЗАБЛОКИРОВАН' : '✓ АКТИВЕН'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <strong>Инвайт-код:</strong> {user.inviteCode || 'N/A'}
                        </div>
                        <div>
                          <strong>Регистрация:</strong> {user.createdAt?.toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      
                      {/* Кнопки управления */}
                      {user.role !== 'admin' && user.id !== currentUser.uid && (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          paddingTop: '16px',
                          borderTop: '1px solid rgba(102, 126, 234, 0.1)'
                        }}>
                          <button
                            onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: user.isBlocked 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : 'rgba(255, 159, 67, 0.1)',
                              color: user.isBlocked ? '#10b981' : '#ff9f43',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            {user.isBlocked ? (
                              <>
                                <ShieldOff size={16} />
                                Разблокировать
                              </>
                            ) : (
                              <>
                                <Shield size={16} />
                                Заблокировать
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <Trash2 size={16} />
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
