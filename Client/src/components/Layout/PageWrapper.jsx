export default function PageWrapper({ children, title }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {title && (
        <div className="border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
      )}
      {children}
    </div>
  );
}
