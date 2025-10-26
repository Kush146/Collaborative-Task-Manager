export const Card = ({ children, className='' }: any) =>
  <div className={`bg-white rounded-2xl shadow p-4 ${className}`}>{children}</div>;
