const ErrorDisplay = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  
  return (
    <div className="error-container bg-red-900/30 border border-red-500 rounded p-3 mb-3">
      {errors.map((error, index) => (
        <p key={index} className="text-red-400 text-sm mb-1 last:mb-0">
          • {error}
        </p>
      ))}
    </div>
  );
};

export default ErrorDisplay;