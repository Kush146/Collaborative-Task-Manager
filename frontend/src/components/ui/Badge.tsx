export const Badge = ({ children, tone='gray' }: { children: React.ReactNode; tone?: 'gray'|'green'|'blue'|'orange'|'red' }) => {
  const map:any = { gray:'bg-gray-100 text-gray-700', green:'bg-green-100 text-green-700', blue:'bg-blue-100 text-blue-700', orange:'bg-orange-100 text-orange-700', red:'bg-red-100 text-red-700' };
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${map[tone]}`}>{children}</span>;
};
