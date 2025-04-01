interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description?: string;
    gradeLevel?: number;
    allGrades?: number[];
  };
  onClick: () => void;
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
      {topic.description && (
        <p className="text-gray-600 mb-4">{topic.description}</p>
      )}
      <div className="flex items-center gap-2">
        {topic.gradeLevel && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Grade {topic.gradeLevel}
          </span>
        )}
        {topic.allGrades && topic.allGrades.length > 0 && topic.allGrades.length > 1 && (
          <span className="text-sm text-gray-500">
            (Also available in grades {topic.allGrades.filter(g => g !== topic.gradeLevel).join(', ')})
          </span>
        )}
      </div>
    </div>
  );
} 