export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-14 text-center">
      {Icon && <Icon className="mb-3 size-9 text-gray-400" />}
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
