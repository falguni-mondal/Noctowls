import { Icon } from '@iconify/react';

const StarRating = ({ rating, setRating, readOnly = false, size = "text-lg" }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex gap-1 ${size} text-amber-500`}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && setRating(star)}
          className={`${!readOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        >
          <Icon 
            icon={star <= rating ? "material-symbols:star-rounded" : "material-symbols:star-outline-rounded"} 
          />
        </span>
      ))}
    </div>
  );
};

export default StarRating;