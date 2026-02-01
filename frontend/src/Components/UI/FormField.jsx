function FormField({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div
        className={`rounded border transition w-full ${
          error ? "border-red-500" : "border-gray-300 "
        }`}
      >
        {children}
      </div>

      <div style={{ minHeight: "14px" }}>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}

export default FormField;