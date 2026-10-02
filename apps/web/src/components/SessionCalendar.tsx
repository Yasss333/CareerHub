import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface Session {
  id: string;
  seniorId: string;
  seniorName: string;
  seniorAvatar: string;
  topic: string;
  scheduledTime: string;
  duration: number;
  status: string;
  jitsiRoomUrl?: string;
}

interface SessionCalendarProps {
  sessions: Session[];
  onSessionClick?: (session: Session) => void;
}

const SessionCalendar = ({ sessions, onSessionClick }: SessionCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = parseISO(session.scheduledTime);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return sessionsByDate[dateKey] || [];
  };

  // Calendar tile content to show session indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const daySessions = getSessionsForDate(date);
    if (daySessions.length === 0) return null;

    const hasCompleted = daySessions.some(s => s.status === 'completed');
    const hasUpcoming = daySessions.some(s => ['pending', 'accepted', 'started'].includes(s.status));

    return (
      <div className="relative w-full h-full">
        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1`}>
          {hasUpcoming && (
            <div className="w-2 h-2 rounded-full bg-blue-500" title="Upcoming session" />
          )}
          {hasCompleted && (
            <div className="w-2 h-2 rounded-full bg-green-500" title="Completed session" />
          )}
        </div>
      </div>
    );
  };

  // Get sessions for selected date
  const selectedDateSessions = getSessionsForDate(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'started': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          Session Calendar
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">Upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                handleMonthChange(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                handleMonthChange(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full"
            prev2Label={null}
            next2Label={null}
          />
        </div>

        {/* Selected Date Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          {selectedDateSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No sessions scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSessionClick?.(session)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusColor(session.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={session.seniorAvatar || '/default-avatar.png'}
                          alt={session.seniorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-semibold text-gray-900">{session.seniorName}</span>
                      </div>
                      <p className="text-sm text-gray-700">{session.topic}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(session.scheduledTime), 'h:mm a')}
                        </span>
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded">
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      {session.status === 'started' && session.jitsiRoomUrl && (
                        <a
                          href={session.jitsiRoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCalendar;