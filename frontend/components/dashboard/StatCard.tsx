import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const StatCard = React.memo(function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
      {icon && <div className="p-3 bg-gray-50 rounded-full">{icon}</div>}
    </div>
  );
});
export default StatCard;