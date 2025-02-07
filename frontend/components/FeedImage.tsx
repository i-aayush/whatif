interface FeedImageProps {
  image: string;
  prompt: string;
  onClick: () => void;
}

const FeedImage: React.FC<FeedImageProps> = ({ image, prompt, onClick }) => {
  return (
    <div 
      className="relative group cursor-pointer w-full aspect-square"
      onClick={onClick}
    >
      <img
        src={image}
        alt={prompt}
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white line-clamp-2">
          {prompt}
        </p>
      </div>
    </div>
  );
};

export default FeedImage; 