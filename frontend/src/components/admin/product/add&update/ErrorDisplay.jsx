const ErrorDisplay = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="error-container bg-red-50 border border-red-200 rounded-lg p-3 mb-3 shadow-xs">
      {errors.map((error, index) => (
        <p key={index} className="text-red-600 font-medium text-sm mb-1 last:mb-0">
          • {error}
        </p>
      ))}
    </div>
  );
};

export default ErrorDisplay;
