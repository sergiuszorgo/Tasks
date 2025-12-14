import React, { useState, useEffect } from 'react';
import { Calendar, Search, Plus, X, Phone, Send, Trash2, Save, ChevronDown, ChevronUp, Edit } from 'lucide-react';

const TasksApp = () => {
  const [currentView, setCurrentView] = useState('events');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [expandedContact, setExpandedContact] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentContact, setCurrentContact] = useState(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkIfTablet = () => {
      setIsTablet(window.innerWidth >= 768); // Планшеты И десктопы
    };
    
    checkIfTablet();
    window.addEventListener('resize', checkIfTablet);
    return () => window.removeEventListener('resize', checkIfTablet);
  }, []);

  useEffect(() => {
    const savedEvents = localStorage.getItem('tasks_events');
    const savedContacts = localStorage.getItem('tasks_contacts');
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedContacts) setContacts(JSON.parse(savedContacts));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('tasks_contacts', JSON.stringify(contacts));
  }, [contacts]);

  const switchToEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedDate(new Date(event.date));
      setCurrentDate(new Date(event.date));
      setCurrentView('events');
      setExpandedEvent(eventId);
      setTimeout(() => {
        const eventElement = document.getElementById(`event-${eventId}`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const toggleTaskCompletion = (eventId, taskIndex) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const newTasksCompleted = [...(event.tasksCompleted || [])];
        newTasksCompleted[taskIndex] = !newTasksCompleted[taskIndex];
        return { ...event, tasksCompleted: newTasksCompleted };
      }
      return event;
    }));
  };

  const areAllTasksCompleted = (event) => {
    if (!event.tasks || event.tasks.length === 0) return false;
    const validTasks = event.tasks.filter(t => t && t.trim());
    if (validTasks.length === 0) return false;
    const completed = event.tasksCompleted || [];
    return validTasks.every((task, index) => completed[index] === true);
  };

  const getEventsForDate = (date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getDateBorderColor = (date) => {
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length === 0) return null;
    
    const allCompleted = dateEvents.every(event => areAllTasksCompleted(event));
    return allCompleted ? '#2fff7a' : '#ffe72f';
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isCurrentWeek = (date) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const getFilteredEvents = () => {
    let filtered = events;

    if (eventSearch) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        event.tasks.some(task => task.toLowerCase().includes(eventSearch.toLowerCase()))
      );
    } else if (isSameDay(selectedDate, new Date())) {
      filtered = filtered.filter(event => isCurrentWeek(new Date(event.date)));
    } else {
      filtered = filtered.filter(event => isSameDay(new Date(event.date), selectedDate));
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getFilteredContacts = () => {
    if (!contactSearch) return contacts;
    return contacts.filter(contact => 
      contact.lastName.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.firstName.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.phone.includes(contactSearch) ||
      contact.telegram.toLowerCase().includes(contactSearch.toLowerCase())
    );
  };

  const openEventModal = (event = null) => {
    if (event) {
      setCurrentEvent(event);
    } else {
      setCurrentEvent({
        id: Date.now(),
        date: selectedDate.toISOString(),
        title: '',
        tasks: [''],
        tasksCompleted: [false],
        contactIds: []
      });
    }
    setShowEventModal(true);
  };

  const openContactModal = (contact = null) => {
    if (contact) {
      setCurrentContact(contact);
    } else {
      setCurrentContact({
        id: Date.now(),
        lastName: '',
        firstName: '',
        phone: '',
        telegram: '',
        eventIds: []
      });
    }
    setShowContactModal(true);
  };

  const saveEvent = () => {
    if (!currentEvent.title) return;
    
    const updatedEvents = events.filter(e => e.id !== currentEvent.id);
    setEvents([...updatedEvents, currentEvent]);
    
    setContacts(contacts.map(contact => {
      if (currentEvent.contactIds.includes(contact.id)) {
        const eventIds = contact.eventIds || [];
        if (!eventIds.includes(currentEvent.id)) {
          return { ...contact, eventIds: [...eventIds, currentEvent.id] };
        }
      } else {
        const eventIds = (contact.eventIds || []).filter(id => id !== currentEvent.id);
        return { ...contact, eventIds };
      }
      return contact;
    }));
    
    setShowEventModal(false);
    setCurrentEvent(null);
  };

  const deleteEvent = () => {
    setContacts(contacts.map(contact => ({
      ...contact,
      eventIds: (contact.eventIds || []).filter(id => id !== currentEvent.id)
    })));
    
    setEvents(events.filter(e => e.id !== currentEvent.id));
    setShowEventModal(false);
    setCurrentEvent(null);
  };

  const saveContact = () => {
    if (!currentContact.lastName || !currentContact.firstName) return;
    
    const updatedContacts = contacts.filter(c => c.id !== currentContact.id);
    setContacts([...updatedContacts, currentContact]);
    setShowContactModal(false);
    setCurrentContact(null);
  };

  const deleteContact = () => {
    setContacts(contacts.filter(c => c.id !== currentContact.id));
    setShowContactModal(false);
    setCurrentContact(null);
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#64748b',
      fontFamily: '"Manrope", -apple-system, sans-serif',
      padding: '20px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          overflow-x: hidden;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .search-input {
          width: 100%;
          padding: 14px 18px 14px 48px;
          border: 2px solid #e9ecef;
          border-radius: 16px;
          font-size: 15px;
          font-family: 'Manrope', sans-serif;
          font-weight: 500;
          transition: all 0.3s ease;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .btn-primary {
          background: #64748b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Manrope', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Manrope', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: #667eea;
          color: white;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Manrope', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .event-card {
          background: #ffe72f;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .event-card.completed {
          background: #2fff7a;
        }

        .event-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .contact-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .contact-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          padding: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          font-size: 14px;
        }

        .calendar-day:hover:not(.empty) {
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.05);
        }

        .calendar-day.today {
          background: #64748b;
          color: white;
        }

        .calendar-day.selected {
          background: #667eea;
          color: white;
        }

        input, textarea {
          font-family: 'Manrope', sans-serif;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .add-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #64748b;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .add-button:hover {
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .nav-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .nav-tab {
          flex: 1;
          padding: 14px 20px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 15px;
          font-family: 'Manrope', sans-serif;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .nav-tab:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .nav-tab.active {
          background: #64748b;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .event-link {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .event-link:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .task-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .contact-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .contact-link:hover {
          background: rgba(102, 126, 234, 0.2);
          transform: translateX(2px);
        }

        .calendar-header-compact {
          cursor: pointer;
          padding: 16px 20px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .calendar-header-compact:hover {
          background: rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }

        .tablet-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .nav-tabs {
            display: none !important;
          }

          .tablet-layout {
            display: grid !important;
          }
        }

        @media (max-width: 767px) {
          .tablet-layout {
            display: block !important;
          }
        }

        @media (max-width: 768px) {
          .section-title {
            display: none !important;
          }

          .glass-card {
            border-radius: 16px;
            padding: 20px !important;
          }

          .calendar-day {
            font-size: 12px;
          }

          .modal-content {
            padding: 20px;
            border-radius: 16px;
          }

          .add-button {
            width: 44px;
            height: 44px;
          }

          h1 {
            font-size: 40px !important;
          }
        }

        @media (max-width: 480px) {
          .section-title {
            font-size: 18px;
            gap: 8px;
          }

          .glass-card {
            padding: 16px !important;
          }

          .calendar-day {
            font-size: 11px;
            border-radius: 8px;
          }

          .modal-content {
            padding: 16px;
          }

          .search-input {
            padding: 12px 14px 12px 42px;
            font-size: 14px;
          }

          .btn-primary, .btn-secondary, .btn-danger {
            padding: 10px 18px;
            font-size: 14px;
          }

          h1 {
            font-size: 32px !important;
          }

          .add-button {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'slideUp 0.6s ease' }}>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '56px',
            fontWeight: '900',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            Tasks
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', fontWeight: '500' }}>
            Ваш персональный органайзер
          </p>
        </div>

        <div className="nav-tabs" style={{ animation: 'slideUp 0.6s ease 0.1s backwards' }}>
          <button
            className={`nav-tab ${currentView === 'events' ? 'active' : ''}`}
            onClick={() => setCurrentView('events')}
          >
            <Calendar size={20} />
            События
          </button>
          <button
            className={`nav-tab ${currentView === 'contacts' ? 'active' : ''}`}
            onClick={() => setCurrentView('contacts')}
          >
            <Phone size={20} />
            Контакты
          </button>
        </div>

        <div className="tablet-layout" style={{ display: 'block' }}>
          <div style={{ display: currentView === 'events' || isTablet ? 'block' : 'none' }}>
            <div className="glass-card" style={{ padding: '32px', animation: 'slideUp 0.6s ease 0.2s backwards' }}>
                <div className="section-title" style={{ marginBottom: '24px' }}>
                <Calendar size={32} color="#667eea" />
                Календарь
              </div>

                <div 
                className="calendar-header-compact"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                style={{ marginBottom: isCalendarExpanded ? '24px' : '0' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {selectedDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                {isCalendarExpanded ? <ChevronUp size={24} color="#667eea" /> : <ChevronDown size={24} color="#667eea" />}
              </div>

              {isCalendarExpanded && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#667eea',
                        fontWeight: 'bold'
                      }}
                    >
                      ‹
                    </button>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#667eea',
                        fontWeight: 'bold'
                      }}
                    >
                      ›
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    {dayNames.map(day => (
                      <div key={day} style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#64748b',
                        padding: '8px 0'
                      }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px'
                  }}>
                    {getDaysInMonth(currentDate).map((day, index) => {
                      const borderColor = day ? getDateBorderColor(day) : null;
                      return (
                        <div
                          key={index}
                          className={`calendar-day ${!day ? 'empty' : ''} ${day && isSameDay(day, new Date()) ? 'today' : ''} ${day && isSameDay(day, selectedDate) ? 'selected' : ''}`}
                          onClick={() => {
                            if (day) {
                              setSelectedDate(day);
                            }
                          }}
                          style={{
                            opacity: day ? 1 : 0,
                            pointerEvents: day ? 'auto' : 'none',
                            border: borderColor ? `3px solid ${borderColor}` : undefined
                          }}
                        >
                          {day && day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px solid rgba(102, 126, 234, 0.2)' }}>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px',
                  position: 'relative'
                }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8'
                    }} />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Поиск событий..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                    />
                  </div>
                  <button
                    className="add-button"
                    onClick={() => openEventModal()}
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {getFilteredEvents().length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#94a3b8'
                    }}>
                      <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                      <p>Нет событий</p>
                    </div>
                  ) : (
                    getFilteredEvents().map(event => (
                      <div key={event.id} id={`event-${event.id}`}>
                        <div
                          className={`event-card ${areAllTasksCompleted(event) ? 'completed' : ''}`}
                          onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#64748b',
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {new Date(event.date).toLocaleDateString('ru-RU', { 
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1e293b'
                              }}>
                                {event.title}
                              </div>
                            </div>
                            {expandedEvent === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>

                          {expandedEvent === event.id && (
                            <div style={{
                              marginTop: '16px',
                              paddingTop: '16px',
                              borderTop: '2px solid rgba(0, 0, 0, 0.1)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            >
                              {event.tasks && event.tasks.filter(t => t && t.trim()).length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    marginBottom: '10px'
                                  }}>
                                    Задачи:
                                  </div>
                                  {event.tasks.filter(t => t && t.trim()).map((task, index) => (
                                    <div key={index} style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '12px',
                                      marginBottom: '10px',
                                      padding: '8px',
                                      background: 'rgba(255, 255, 255, 0.5)',
                                      borderRadius: '8px'
                                    }}>
                                      <input
                                        type="checkbox"
                                        className="task-checkbox"
                                        checked={(event.tasksCompleted && event.tasksCompleted[index]) || false}
                                        onChange={() => toggleTaskCompletion(event.id, index)}
                                        style={{ marginTop: '2px' }}
                                      />
                                      <span style={{
                                        fontSize: '14px',
                                        color: '#1e293b',
                                        textDecoration: (event.tasksCompleted && event.tasksCompleted[index]) ? 'line-through' : 'none',
                                        opacity: (event.tasksCompleted && event.tasksCompleted[index]) ? 0.6 : 1
                                      }}>
                                        {task}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {event.contactIds && event.contactIds.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    marginBottom: '10px'
                                  }}>
                                    Контакты:
                                  </div>
                                  {event.contactIds.map(contactId => {
                                    const contact = contacts.find(c => c.id === contactId);
                                    return contact ? (
                                      <div key={contactId} style={{
                                        padding: '10px',
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        borderRadius: '8px',
                                        marginBottom: '8px'
                                      }}>
                                        <div style={{
                                          fontSize: '14px',
                                          fontWeight: '700',
                                          color: '#1e293b',
                                          marginBottom: '8px'
                                        }}>
                                          {contact.lastName} {contact.firstName}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          {contact.phone && (
                                            <a
                                              href={`tel:${contact.phone}`}
                                              className="contact-link"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Phone size={14} />
                                              {contact.phone}
                                            </a>
                                          )}
                                          {contact.telegram && (
                                            <a
                                              href={`https://t.me/${contact.telegram.replace('@', '')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="contact-link"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Send size={14} />
                                              {contact.telegram}
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              )}

                              <button
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEventModal(event);
                                }}
                              >
                                <Edit size={18} />
                                Изменить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
          </div>
          </div>

          <div style={{ display: currentView === 'contacts' || isTablet ? 'block' : 'none' }}>
            <div className="glass-card" style={{ padding: '32px', animation: 'slideUp 0.6s ease 0.2s backwards' }}>
                <div className="section-title">
                <Phone size={32} color="#667eea" />
                Контакты
              </div>

              <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              position: 'relative'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={20} style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Поиск контактов..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <button
                className="add-button"
                onClick={() => openContactModal()}
              >
                <Plus size={24} />
              </button>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {getFilteredContacts().length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8'
                }}>
                  <Phone size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>Нет контактов</p>
                </div>
              ) : (
                getFilteredContacts().map(contact => (
                  <div key={contact.id}>
                    <div
                      className="contact-card"
                      onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1e293b'
                          }}>
                            {contact.lastName} {contact.firstName}
                          </div>
                        </div>
                        {expandedContact === contact.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {expandedContact === contact.id && (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #e9ecef'
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '12px',
                              color: '#64748b',
                              marginBottom: '4px'
                            }}>
                              Телефон
                            </div>
                            <a
                              href={`tel:${contact.phone}`}
                              style={{
                                fontSize: '15px',
                                color: '#667eea',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone size={16} />
                              {contact.phone}
                            </a>
                          </div>

                          {contact.telegram && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#64748b',
                                marginBottom: '4px'
                              }}>
                                Telegram
                              </div>
                              <a
                                href={`https://t.me/${contact.telegram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '15px',
                                  color: '#667eea',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Send size={16} />
                                {contact.telegram}
                              </a>
                            </div>
                          )}

                          {contact.eventIds && contact.eventIds.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#64748b',
                                marginBottom: '8px',
                                fontWeight: '700'
                              }}>
                                Связанные события:
                              </div>
                              {contact.eventIds.map(eventId => {
                                const event = events.find(e => e.id === eventId);
                                return event ? (
                                  <div 
                                    key={eventId} 
                                    className="event-link"
                                    style={{
                                      padding: '8px 12px',
                                      background: '#f8fafc',
                                      borderRadius: '8px',
                                      marginBottom: '6px',
                                      fontSize: '13px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchToEvent(eventId);
                                    }}
                                  >
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                      {event.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      {new Date(event.date).toLocaleDateString('ru-RU', { 
                                        day: 'numeric',
                                        month: 'long'
                                      })}
                                    </div>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          <div style={{ marginTop: '16px' }}>
                            <button
                              className="btn-secondary"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openContactModal(contact);
                              }}
                            >
                              Редактировать
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {showEventModal && currentEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#1e293b',
                fontFamily: '"Playfair Display", serif'
              }}>
                Карточка события
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} color="#64748b" />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Дата события
              </label>
              <input
                type="date"
                value={new Date(currentEvent.date).toISOString().split('T')[0]}
                onChange={(e) => setCurrentEvent({
                  ...currentEvent,
                  date: new Date(e.target.value).toISOString()
                })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Заголовок
              </label>
              <input
                type="text"
                value={currentEvent.title}
                onChange={(e) => setCurrentEvent({
                  ...currentEvent,
                  title: e.target.value
                })}
                placeholder="Введите заголовок события"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Задачи
              </label>
              {currentEvent.tasks.map((task, index) => (
                <div key={index} style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <textarea
                    value={task}
                    onChange={(e) => {
                      const newTasks = [...currentEvent.tasks];
                      newTasks[index] = e.target.value;
                      setCurrentEvent({ ...currentEvent, tasks: newTasks });
                    }}
                    placeholder="Описание задачи"
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #e9ecef',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  />
                  <button
                    onClick={() => {
                      const newTasks = currentEvent.tasks.filter((_, i) => i !== index);
                      const newTasksCompleted = (currentEvent.tasksCompleted || []).filter((_, i) => i !== index);
                      setCurrentEvent({ ...currentEvent, tasks: newTasks, tasksCompleted: newTasksCompleted });
                    }}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setCurrentEvent({
                  ...currentEvent,
                  tasks: [...currentEvent.tasks, ''],
                  tasksCompleted: [...(currentEvent.tasksCompleted || []), false]
                })}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              >
                <Plus size={20} />
                Новая задача
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Контакты
              </label>
              {currentEvent.contactIds.map(contactId => {
                const contact = contacts.find(c => c.id === contactId);
                return contact ? (
                  <div key={contactId} style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '600' }}>
                      {contact.lastName} {contact.firstName}
                    </span>
                    <button
                      onClick={() => setCurrentEvent({
                        ...currentEvent,
                        contactIds: currentEvent.contactIds.filter(id => id !== contactId)
                      })}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : null;
              })}
              <select
                onChange={(e) => {
                  const contactId = Number(e.target.value);
                  if (contactId && !currentEvent.contactIds.includes(contactId)) {
                    setCurrentEvent({
                      ...currentEvent,
                      contactIds: [...currentEvent.contactIds, contactId]
                    });
                  }
                  e.target.value = '';
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <option value="">Добавить контакт...</option>
                {contacts.filter(c => !currentEvent.contactIds.includes(c.id)).map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.lastName} {contact.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef'
            }}>
              <button
                onClick={saveEvent}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Save size={20} />
                Сохранить
              </button>
              {events.some(e => e.id === currentEvent.id) && (
                <button
                  onClick={deleteEvent}
                  className="btn-danger"
                  style={{ justifyContent: 'center' }}
                >
                  <Trash2 size={20} />
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showContactModal && currentContact && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#1e293b',
                fontFamily: '"Playfair Display", serif'
              }}>
                {contacts.some(c => c.id === currentContact.id) ? 'Редактировать контакт' : 'Новый контакт'}
              </h2>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} color="#64748b" />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Фамилия
              </label>
              <input
                type="text"
                value={currentContact.lastName}
                onChange={(e) => setCurrentContact({
                  ...currentContact,
                  lastName: e.target.value
                })}
                placeholder="Введите фамилию"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Имя
              </label>
              <input
                type="text"
                value={currentContact.firstName}
                onChange={(e) => setCurrentContact({
                  ...currentContact,
                  firstName: e.target.value
                })}
                placeholder="Введите имя"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Телефон
              </label>
              <input
                type="tel"
                value={currentContact.phone}
                onChange={(e) => setCurrentContact({
                  ...currentContact,
                  phone: e.target.value
                })}
                placeholder="+380..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Telegram
              </label>
              <input
                type="text"
                value={currentContact.telegram}
                onChange={(e) => setCurrentContact({
                  ...currentContact,
                  telegram: e.target.value
                })}
                placeholder="@username"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef'
            }}>
              <button
                onClick={saveContact}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Save size={20} />
                Сохранить
              </button>
              {contacts.some(c => c.id === currentContact.id) && (
                <button
                  onClick={deleteContact}
                  className="btn-danger"
                  style={{ justifyContent: 'center' }}
                >
                  <Trash2 size={20} />
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksApp;