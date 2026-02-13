import { prisma } from '../lib/prisma';
import { getOrCreateDefaultFamily } from '../lib/defaultFamily';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getWeekDates() {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = (currentDay + 6) % 7;

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysFromMonday);

  return DAY_NAMES.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      day,
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date
    };
  });
}

function toDayName(date) {
  const dayIndex = date.getDay();
  return DAY_NAMES[(dayIndex + 6) % 7];
}

export default async function HomePage() {
  const noteColors = ['#fff59d', '#ffd9a8', '#c9f7a5', '#ffd6e7'];
  const noteRotations = ['rotate(-1deg)', 'rotate(0.8deg)', 'rotate(-0.6deg)', 'rotate(0.6deg)'];
  const weekDates = getWeekDates();
  const weekStart = new Date(weekDates[0].date);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDates[6].date);
  weekEnd.setHours(23, 59, 59, 999);

  let events = [];

  try {
    const family = await getOrCreateDefaultFamily();
    events = await prisma.event.findMany({
      where: {
        familyId: family.id,
        startsAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      orderBy: {
        startsAt: 'asc'
      }
    });
  } catch {
    events = [];
  }

  const boardDays = weekDates.map((day) => {
    const dayEvents = events.filter((item) => toDayName(item.startsAt) === day.day);
    const workItems = dayEvents.filter((item) => item.type === 'WORK').map((item) => item.title);
    const eventItems = dayEvents.filter((item) => item.type === 'EVENT').map((item) => item.title);

    return {
      day: day.day,
      date: day.dateLabel,
      workSchedule: workItems[0] || 'Not set',
      events: eventItems.length > 0 ? eventItems : ['No events']
    };
  });

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <p style={styles.badge}>Deployed with Vercel</p>
        <h1 style={styles.title}>Family Planner</h1>
        <p style={styles.subtitle}>
          A practical starter for building your smart family planner using Next.js and Vercel.
        </p>
      </section>
      <section style={styles.weekWrapper}>
        <div style={styles.weekGrid}>
          {boardDays.map((day, index) => (
            <article
              key={day.day}
              style={{
                ...styles.card,
                background: noteColors[index % noteColors.length],
                transform: noteRotations[index % noteRotations.length]
              }}
            >
              <div style={styles.dayHeader}>
                <h2 style={styles.dayTitle}>{day.day}</h2>
                <p style={styles.dayDate}>{day.date}</p>
              </div>
              <div style={styles.sectionBlock}>
                <p style={styles.label}>Work</p>
                <p>{day.workSchedule}</p>
              </div>
              <div style={styles.sectionBlock}>
                <p style={styles.label}>Events</p>
                <ul style={styles.eventList}>
                  {day.events.map((event) => (
                    <li key={event} style={styles.eventItem}>
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: '3rem 1.5rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d'
  },
  hero: {
    maxWidth: 780,
    margin: '0 auto 2rem auto',
    textAlign: 'center',
    background: '#ffef7d',
    padding: '1.5rem 1.25rem',
    borderRadius: 10,
    boxShadow: '0 14px 24px rgba(102, 68, 18, 0.2)',
    border: '1px solid rgba(105, 67, 16, 0.18)',
    transform: 'rotate(-1deg)'
  },
  badge: {
    display: 'inline-block',
    marginBottom: '0.5rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 9999,
    background: 'rgba(132, 94, 42, 0.16)',
    color: '#52351d',
    fontSize: '0.85rem'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 7vw, 3rem)',
    letterSpacing: '0.01em'
  },
  subtitle: {
    marginTop: '0.75rem',
    lineHeight: 1.5,
    maxWidth: 620,
    marginInline: 'auto'
  },
  weekWrapper: {
    maxWidth: 980,
    margin: '0 auto',
    overflowX: 'auto',
    paddingBottom: '0.5rem'
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))',
    gap: '1rem',
    minWidth: 1280
  },
  card: {
    padding: '1.2rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)',
    transition: 'transform 120ms ease',
    transformOrigin: 'center top',
    minHeight: 280
  },
  dayHeader: {
    marginBottom: '0.85rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px dashed rgba(98, 73, 24, 0.4)'
  },
  dayTitle: {
    margin: 0,
    fontSize: '1.15rem'
  },
  dayDate: {
    fontSize: '0.85rem',
    opacity: 0.8
  },
  sectionBlock: {
    marginBottom: '0.9rem'
  },
  label: {
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.3rem',
    fontWeight: 700
  },
  eventList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: '0.5rem'
  },
  eventItem: {
    background: 'rgba(255,255,255,0.45)',
    border: '1px solid rgba(98, 73, 24, 0.18)',
    borderRadius: 4,
    padding: '0.45rem 0.5rem',
    fontSize: '0.92rem'
  }
};
