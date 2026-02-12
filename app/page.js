const cards = [
  {
    title: 'Shared Schedule',
    description: 'Keep everyone synced with one household calendar.'
  },
  {
    title: 'Meal + Grocery Flow',
    description: 'Turn weekly meal plans into an actionable shopping list.'
  },
  {
    title: 'Chore Rotation',
    description: 'Assign and rotate chores with fair tracking over time.'
  }
];

export default function HomePage() {
  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <p style={styles.badge}>Deployed with Vercel</p>
        <h1 style={styles.title}>Family Planner</h1>
        <p style={styles.subtitle}>
          A practical starter for building your smart family planner using Next.js and Vercel.
        </p>
      </section>
      <section style={styles.grid}>
        {cards.map((card) => (
          <article key={card.title} style={styles.card}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: '3rem 1.5rem',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    color: '#1f2937'
  },
  hero: {
    maxWidth: 760,
    margin: '0 auto 2rem auto',
    textAlign: 'center'
  },
  badge: {
    display: 'inline-block',
    marginBottom: '0.5rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 999,
    background: '#e0e7ff',
    color: '#3730a3',
    fontSize: '0.85rem'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 7vw, 3rem)'
  },
  subtitle: {
    marginTop: '0.75rem',
    lineHeight: 1.5
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    maxWidth: 980,
    margin: '0 auto'
  },
  card: {
    padding: '1rem',
    borderRadius: 12,
    border: '1px solid #dbeafe',
    background: '#ffffff',
    boxShadow: '0 6px 20px rgba(30, 41, 59, 0.06)'
  }
};
