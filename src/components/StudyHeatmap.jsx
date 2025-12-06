import { useState, useEffect } from 'react';
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const StudyHeatmap = () => {
  const { user } = useAuth();
  const [studyData, setStudyData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudyData = async () => {
      try {
        const studySessionsRef = collection(db, 'studySessions');
        const q = query(studySessionsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const data = {};
        querySnapshot.forEach((doc) => {
          const session = doc.data();
          const date = session.date; // Format: YYYY-MM-DD
          if (!data[date]) {
            data[date] = 0;
          }
          // Convert to minutes: use durationMs if available (precise), otherwise use duration in seconds
          const durationSeconds = session.durationMs ? session.durationMs / 1000 : session.duration || 0;
          const durationMinutes = durationSeconds / 60;
          data[date] += durationMinutes;
        });
        
        setStudyData(data);
      } catch (error) {
        console.error('Error loading study data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStudyData();
      // Refresh every 30 seconds to catch recent study sessions
      const interval = setInterval(loadStudyData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Generate last 365 days using local browser date
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    // Start from 364 days ago and go forward to today (365 total days)
    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    
    return dates;
  };

  // Get color intensity based on study time (dark to light green)
  const getColor = (minutes) => {
    if (!minutes || minutes === 0) return '#ebedf0';
    if (minutes < 15) return '#216e39'; // darkest
    if (minutes < 30) return '#30a14e'; // dark
    if (minutes < 60) return '#40c463'; // medium
    return '#9be9a8'; // lightest
  };

  // Format date to YYYY-MM-DD using local browser date
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format duration for tooltip
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return 'No study time';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    
    if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${mins}m`;
  };


  // Group dates by week (Sunday to Saturday)
  const groupByWeeks = (dates) => {
    if (dates.length === 0) return [];
    
    const weeks = [];
    let currentWeek = [];
    
    // Add padding for the first week if it doesn't start on Sunday
    const firstDayOfWeek = dates[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add all dates
    for (const date of dates) {
      currentWeek.push(date);
      
      // If we have a full week (Sunday included), push it and start a new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining dates as the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const dates = generateDates();
  const weeks = groupByWeeks(dates);
  const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Study Activity</h5>
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="mb-3">Study Activity</h5>
        
        <div className="heatmap-container" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
          <div style={{ display: 'inline-flex', gap: '4px', minWidth: 'fit-content' }}>
            {/* Day labels column */}
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '18px', marginRight: '4px' }}>
              {['Mon', 'Wed', 'Fri'].map((day, index) => (
                <div 
                  key={day}
                  className="text-muted"
                  style={{ 
                    height: index === 0 ? '14px' : '28px',
                    lineHeight: '14px',
                    fontSize: '9px',
                    marginBottom: index < 2 ? '14px' : '0'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div>
              {/* Month labels */}
              <div style={{ display: 'flex', marginBottom: '7px', height: '14px' }}>
                {weeks.map((week, weekIndex) => {
                  const firstDate = week.find(d => d !== null);
                  if (!firstDate) {
                    return <div key={weekIndex} style={{ width: '11px', marginRight: '3px' }} />;
                  }
                  
                  // Show month label only if it's the first week of the month or first week overall
                  let showMonth = false;
                  if (weekIndex === 0) {
                    showMonth = true;
                  } else {
                    const prevWeek = weeks[weekIndex - 1];
                    const prevDate = prevWeek.find(d => d !== null);
                    if (prevDate && firstDate.getMonth() !== prevDate.getMonth()) {
                      showMonth = true;
                    }
                  }
                  
                  return (
                    <div key={weekIndex} style={{ width: '11px', marginRight: '3px' }}>
                      {showMonth && (
                        <span className="text-muted" style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>
                          {monthLabels[firstDate.getMonth()]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Days grid */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return (
                          <div
                            key={`empty-${weekIndex}-${dayIndex}`}
                            style={{
                              width: '11px',
                              height: '11px',
                              backgroundColor: 'transparent'
                            }}
                          />
                        );
                      }

                      const dateStr = formatDate(date);
                      const minutes = studyData[dateStr] || 0;
                      const color = getColor(minutes);

                      return (
                        <OverlayTrigger
                          key={dateStr}
                          placement="top"
                          overlay={
                            <Tooltip>
                              <strong>{formatDuration(minutes)}</strong>
                              <br />
                              {date.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Tooltip>
                          }
                        >
                          <div
                            style={{
                              width: '11px',
                              height: '11px',
                              backgroundColor: color,
                              borderRadius: '2px',
                              border: '1px solid rgba(27,31,35,0.06)',
                              cursor: 'pointer',
                              transition: 'all 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.3)';
                              e.currentTarget.style.border = '1px solid rgba(27,31,35,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.border = '1px solid rgba(27,31,35,0.06)';
                            }}
                          />
                        </OverlayTrigger>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="d-flex align-items-center justify-content-end gap-2 mt-3">
            <span className="text-muted small">Less</span>
            <div className="d-flex gap-1">
              {['#ebedf0', '#216e39', '#30a14e', '#40c463', '#9be9a8'].map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: '11px',
                    height: '11px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    border: '1px solid rgba(27,31,35,0.06)'
                  }}
                  title={index === 0 ? 'No activity' : `${index * 15}+ minutes`}
                />
              ))}
            </div>
            <span className="text-muted small">More</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StudyHeatmap;
